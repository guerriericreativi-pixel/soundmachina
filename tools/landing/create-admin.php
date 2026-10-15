<?php
/** Add an independent admin secret without rotating the user's invite. CLI only. */
declare(strict_types=1);
if (PHP_SAPI !== 'cli') exit(1);
$dir=$argv[1]??'';
if (!$dir || !is_file($dir.'/config.php')) { fwrite(STDERR,"Provide an existing private invitation directory.\n"); exit(1); }
$config=require $dir.'/config.php';
if (isset($config['admin_hash'])) { fwrite(STDERR,"An administrator is already configured.\n"); exit(1); }
do { $code='VIRUS-ADMIN-'.strtoupper(bin2hex(random_bytes(16))); } while(password_verify($code,$config['code_hash']??''));
$config['admin_hash']=password_hash($code,PASSWORD_DEFAULT);
file_put_contents($dir.'/config.php',"<?php\nreturn ".var_export($config,true).";\n",LOCK_EX);
file_put_contents($dir.'/admin-code.txt',$code."\n",LOCK_EX);
chmod($dir.'/config.php',0600);chmod($dir.'/admin-code.txt',0600);
echo "Administrator configured; secret saved only in the private directory.\n";
