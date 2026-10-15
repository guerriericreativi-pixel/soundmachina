<?php
declare(strict_types=1);
require __DIR__.'/access.php';
header('Content-Type: application/json; charset=utf-8');
function fail_bank(int $status,string $message): never { http_response_code($status);echo json_encode(['error'=>$message]);exit; }
if(!vh_authenticated())fail_bank(401,'Accedi per consultare i banchi.');
$method=$_SERVER['REQUEST_METHOD'];
if(!in_array($method,['GET','POST'],true))fail_bank(405,'Metodo non consentito.');
if($method==='POST'){
    if(vh_role()!=='admin')fail_bank(403,'Solo l’amministratore può modificare il catalogo.');
    if(!hash_equals(vh_csrf(),$_SERVER['HTTP_X_CSRF_TOKEN']??''))fail_bank(403,'Sessione scaduta: riapri la pagina.');
    if((int)($_SERVER['CONTENT_LENGTH']??0)>64*1024*1024)fail_bank(413,'Dati troppo grandi.');
}
function bank_cover(mixed $cover): ?string {
    if($cover===null)return null;
    if(!is_string($cover)||strlen($cover)>2*1024*1024||!preg_match('~^data:image/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$~D',$cover,$m))throw new Exception('Copertina non valida.');
    $binary=base64_decode($m[2],true);$image=$binary===false?false:@getimagesizefromstring($binary);
    if(!$image||$image[0]*$image[1]>40000000||($image['mime']??'')!=='image/'.$m[1])throw new Exception('Copertina non valida.');
    return $cover;
}
/** Validate SMF framing and both Virus Single checksums on the server. */
function bank_validate(array $bytes): void {
    if(!array_is_list($bytes)||!count($bytes)||count($bytes)>8388608)throw new Exception('File non valido.');
    foreach($bytes as $b)if(!is_int($b)||$b<0||$b>255)throw new Exception('Byte non valido.');
    $raw=pack('C*',...$bytes);$messages=[];
    $takeRaw=function(string $data)use(&$messages){$pending='';for($i=0;$i<strlen($data);$i++){$v=ord($data[$i]);if($v===240){if($pending!=='')throw new Exception('SysEx incompleto.');$pending=$data[$i];}elseif($pending!==''){$pending.=$data[$i];if($v===247){$messages[]=$pending;$pending='';}}}if($pending!=='')throw new Exception('SysEx incompleto.');};
    if(substr($raw,0,4)!=='MThd')$takeRaw($raw);
    else{
        $size=strlen($raw);if($size<14)throw new Exception('MIDI incompleto.');
        $u32=fn(int $i)=>unpack('N',substr($raw,$i,4))[1];
        $header=$u32(4);$tracks=ord($raw[10])*256+ord($raw[11]);
        if($header<6||8+$header>$size||ord($raw[8])!==0||ord($raw[9])>2||!$tracks)throw new Exception('Header MIDI non valido.');
        $chunk=8+$header;$found=0;
        while($chunk<$size){
            if($chunk+8>$size)throw new Exception('Traccia incompleta.');$end=$chunk+8+$u32($chunk+4);if($end>$size)throw new Exception('Traccia incompleta.');
            if(substr($raw,$chunk,4)==='MTrk'){
                $found++;$cursor=$chunk+8;$running=0;$pending='';
                $read=function()use(&$cursor,$end,$raw){if($cursor>=$end)throw new Exception('Evento incompleto.');return ord($raw[$cursor++]);};
                $vlq=function()use($read){$n=0;for($i=0;$i<4;$i++){$b=$read();$n=$n*128+($b&127);if($b<128)return $n;}throw new Exception('Lunghezza MIDI non valida.');};
                while($cursor<$end){
                    $vlq();$status=$read();if($status<128){if(!$running)throw new Exception('Running status non valido.');$cursor--;$status=$running;}
                    if($status===255){$running=0;$type=$read();$length=$vlq();if($cursor+$length>$end)throw new Exception('Meta evento incompleto.');$cursor+=$length;if($type===47){if($length||$pending!=='')throw new Exception('Traccia non valida.');break;}}
                    elseif($status===240||$status===247){$running=0;$length=$vlq();if($cursor+$length>$end)throw new Exception('SysEx incompleto.');$payload=substr($raw,$cursor,$length);$cursor+=$length;if($status===240){if($pending!=='')throw new Exception('SysEx incompleto.');$pending=chr(240).$payload;}elseif($pending!=='')$pending.=$payload;else{$takeRaw($payload);continue;}if(str_ends_with($pending,chr(247))){$messages[]=$pending;$pending='';}}
                    elseif($status>=128&&$status<240){$running=$status;$length=in_array($status&240,[192,208],true)?1:2;for($i=0;$i<$length;$i++)if($read()>127)throw new Exception('Evento MIDI non valido.');}
                    else throw new Exception('Evento MIDI non valido.');
                }
                if($pending!=='')throw new Exception('SysEx incompleto.');
            }$chunk=$end;
        }if($tracks!==$found)throw new Exception('Numero tracce non valido.');
    }
    $patches=0;
    foreach($messages as $message){$b=array_values(unpack('C*',$message));if(array_slice($b,0,5)!==[240,0,32,51,1]||($b[6]??0)!==16)continue;$len=count($b);if(!in_array($len,[267,524],true)||end($b)!==247)throw new Exception('Dump Virus non valido.');foreach(array_slice($b,1,-1) as $v)if($v>127)throw new Exception('Byte SysEx non valido.');if((array_sum(array_slice($b,5,$len-7))&127)!==$b[$len-2]||($len===524&&(array_sum(array_slice($b,5,260))&127)!==$b[265]))throw new Exception('Checksum Virus non valido.');$patches++;}
    if(!$patches||$patches>4096)throw new Exception('Nessuna patch Virus valida o troppe patch.');
}
$directory=vh_config()['bank_dir']??__DIR__.'/.access/banks';
if(!is_dir($directory)&&!@mkdir($directory,0700,true))fail_bank(503,'Archivio non disponibile.');
$handle=@fopen($directory.'/catalogue.lock','c+');if(!$handle||!flock($handle,LOCK_EX))fail_bank(503,'Archivio occupato.');@chmod($directory.'/catalogue.lock',0600);
try{
    $text=is_file($directory.'/catalogue.json')?file_get_contents($directory.'/catalogue.json'):'';$records=$text===''?[]:json_decode($text,true,512,JSON_THROW_ON_ERROR);
    if(!is_array($records))throw new Exception('Archivio non leggibile.');
    $changed=0;
    if($method==='POST'){
        $input=json_decode(file_get_contents('php://input'),true,512,JSON_THROW_ON_ERROR);
        if(($input['action']??'')==='merge'){
            if(!is_array($input['banks']??null)||count($input['banks'])>1000)throw new Exception('Banchi non validi.');
            $validated=[];
            foreach($input['banks'] as $record){if(!is_array($record['file']??null)||!is_string($record['filename']??null))throw new Exception('File o nome mancante.');bank_validate($record['file']);$id=hash('sha256',pack('C*',...$record['file']));$validated[$id]=['id'=>$id,'filename'=>substr((string)($record['filename']??'Banco.mid'),0,240),'file'=>$record['file'],'cover'=>bank_cover($record['cover']??null),'createdAt'=>gmdate('c')];}
            foreach($validated as $id=>$record){if(!isset($records[$id])){$records[$id]=$record;$changed++;}elseif($record['cover']&&!($records[$id]['cover']??null)){$records[$id]['cover']=$record['cover'];$changed++;}}
        }elseif(($input['action']??'')==='cover'){
            $id=$input['id']??'';if(!is_string($id)||!isset($records[$id]))throw new Exception('Banco non trovato.');$records[$id]['cover']=bank_cover($input['cover']??null);$changed=1;
        }else throw new Exception('Azione non valida.');
        $encoded=json_encode($records,JSON_THROW_ON_ERROR);$temp=tempnam($directory,'bank-');if($temp===false)throw new Exception('Salvataggio non riuscito.');try{chmod($temp,0600);if(file_put_contents($temp,$encoded)!==strlen($encoded)||!rename($temp,$directory.'/catalogue.json'))throw new Exception('Salvataggio non riuscito.');}finally{if(is_file($temp))unlink($temp);}
    }
    echo json_encode($method==='GET'?['banks'=>array_values($records),'role'=>vh_role()]:['changed'=>$changed],JSON_THROW_ON_ERROR);
}catch(Throwable $e){fail_bank(422,$e->getMessage());}
finally{flock($handle,LOCK_UN);fclose($handle);}
