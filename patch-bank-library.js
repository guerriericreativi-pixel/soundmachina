/* Persistent local banks. Import and browsing never send MIDI. */
(function(root){
  'use strict';
  const MAX_FILE=8*1024*1024;
  const requireWrite=()=>root.VirusAccess?.requireWrite();
  function createRemoteStore({bank,crypto,access,fetch}){
    async function request(body){const response=await fetch(access.remote,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json','X-CSRF-Token':access.csrf}:{},...(body?{body:JSON.stringify(body)}:{})});const data=await response.json();if(!response.ok)throw Error(data.error||'Catalogo non disponibile.');return data;}
    return {
      async list(){const data=await request();const parser=createModel({bank,crypto,store:null});return Promise.all(data.banks.map(async r=>({...await parser.parse(r.file,r.filename),cover:validateCover(r.cover)})));},
      async merge(records){requireWrite();return (await request({action:'merge',banks:records.map(r=>({filename:r.filename,file:r.file,cover:r.cover||null}))})).changed;},
      async setCover(id,cover){requireWrite();return (await request({action:'cover',id,cover})).changed;}
    };
  }
  function validateCover(cover){
    if(cover==null)return null;
    if(typeof cover!=='string'||cover.length>2*1024*1024)throw Error('Copertina non valida o troppo grande.');
    const match=/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(cover);
    if(!match)throw Error('Usa una copertina PNG, JPG o WebP.');
    let bytes;try{bytes=root.atob(match[2]);}catch{throw Error('Copertina non valida.');}
    const signature=match[1]==='png'?bytes.startsWith('\x89PNG\r\n\x1a\n'):match[1]==='jpeg'?bytes.startsWith('\xff\xd8\xff'):bytes.startsWith('RIFF')&&bytes.slice(8,12)==='WEBP';
    if(!signature)throw Error('Il contenuto della copertina non corrisponde al formato.');
    return cover;
  }
  async function prepareCover(file,document){
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>MAX_FILE)throw Error('Scegli un’immagine PNG, JPG o WebP entro 8 MB.');
    const image=document.createElement('img'),url=root.URL.createObjectURL(file);
    try{
      await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Immagine non leggibile.'));image.src=url;});
      if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth*image.naturalHeight>40000000)throw Error('Immagine troppo grande: usa al massimo 40 megapixel.');
      const ratio=Math.min(1,1024/Math.max(image.naturalWidth,image.naturalHeight)),canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));
      canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
      return validateCover(canvas.toDataURL('image/webp',.86));
    }finally{root.URL.revokeObjectURL(url);}
  }
  function createStore(indexedDB){
    let opened;
    function open(){return opened||(opened=new Promise((resolve,reject)=>{
      if(!indexedDB){reject(Error('Archivio non disponibile in questo browser.'));return;}
      const req=indexedDB.open('virusH_patch_banks',1);
      req.onupgradeneeded=()=>req.result.createObjectStore('banks',{keyPath:'id'});
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
      req.onblocked=()=>reject(Error('Chiudi le altre schede VIRUS-H e riprova.'));
    }));}
    return {
      async list(){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('banks','readonly'),req=tx.objectStore('banks').getAll();tx.oncomplete=()=>resolve(req.result);tx.onabort=()=>reject(tx.error);tx.onerror=()=>{};});},
      async merge(records){const db=await open();return new Promise((resolve,reject)=>{
        const tx=db.transaction('banks','readwrite'),store=tx.objectStore('banks');let added=0;
        // Check and insert in the same transaction so concurrent imports cannot overwrite.
        for(const record of records){const req=store.get(record.id);req.onsuccess=()=>{if(!req.result){store.add(record);added++;}else if(record.cover&&!req.result.cover){store.put({...req.result,cover:record.cover});added++;}};}
        tx.oncomplete=()=>resolve(added);tx.onabort=()=>reject(tx.error||Error('Salvataggio interrotto.'));tx.onerror=()=>{};
      });},
      async setCover(id,cover){const db=await open();return new Promise((resolve,reject)=>{
        const tx=db.transaction('banks','readwrite'),store=tx.objectStore('banks'),req=store.get(id);let missing=false;
        req.onsuccess=()=>{if(!req.result){missing=true;tx.abort();return;}store.put({...req.result,cover});};
        tx.oncomplete=()=>resolve(1);tx.onabort=()=>reject(missing?Error('Banco non trovato.'):tx.error||Error('Copertina non salvata.'));tx.onerror=()=>{};
      });}
    };
  }
  function createModel({store,bank,crypto}){
    async function parse(input,filename){
      if(!input||!Number.isSafeInteger(input.length)||input.length===0||input.length>MAX_FILE)throw Error('File vuoto o oltre 8 MB.');
      if(Array.from(input).some(v=>!Number.isInteger(v)||v<0||v>255))throw Error('Byte del file non validi.');
      const file=Uint8Array.from(input),frames=bank.extractSysEx(file),patches=[];
      for(const bytes of frames){
        if(![240,0,32,51,1].every((v,i)=>bytes[i]===v)||bytes[6]!==16)continue;
        const sum=end=>Array.from(bytes.slice(5,end)).reduce((a,v)=>a+v,0)&127;
        if(![267,524].includes(bytes.length)||bytes.at(-1)!==247||bytes.slice(1,-1).some(v=>v>127)||sum(bytes.length-2)!==bytes.at(-2)||(bytes.length===524&&sum(265)!==bytes[265]))throw Error('Patch Virus incompleta o checksum non valido. Nessun banco salvato.');
        patches.push({name:String.fromCharCode(...bytes.slice(249,259)).replace(/[^\x20-\x7e]/g,'').trim()||'Senza nome',bytes:Array.from(bytes),slot:bytes[8],position:patches.length+1});
      }
      if(!patches.length)throw Error('Nessuna patch Virus nel file. I MIDI di sole note non sono banchi di suoni.');
      if(patches.length>4096)throw Error('Il file supera 4096 patch.');
      const hash=await crypto.subtle.digest('SHA-256',file);
      return {id:Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join(''),filename:String(filename||'Banco.mid').slice(0,240),createdAt:new Date().toISOString(),file:Array.from(file),patches};
    }
    return {list:()=>store.list(),parse,
      async importFiles(files){requireWrite();const records=await Promise.all(files.map(async f=>({...await parse(f.bytes,f.name),cover:validateCover(f.cover)})));return store.merge([...new Map(records.map(r=>[r.id,r])).values()]);},
      async setCover(id,cover){requireWrite();return store.setCover(id,validateCover(cover));},
      async backup(){const records=await store.list();return {app:'virus-h-bank-archive',version:1,banks:records.map(r=>({filename:r.filename,file:r.file,cover:r.cover||null}))};},
      async restore(data){if(data?.app!=='virus-h-bank-archive'||data.version!==1||!Array.isArray(data.banks)||data.banks.length>1000)throw Error('Backup banchi non valido.');return this.importFiles(data.banks.map(r=>({name:r.filename,bytes:r.file,cover:r.cover})));}
    };
  }
  function create(container,bridge){
    const document=container.ownerDocument,crypto=bridge.crypto||root.crypto,access=root.VirusAccess;
    const store=bridge.store||(access?.remote?createRemoteStore({bank:bridge.bank,crypto,access,fetch:root.fetch.bind(root)}):createStore(root.indexedDB));
    const model=createModel({store,bank:bridge.bank,crypto});
    let records=[],selected=null,query='',busy=false;
    const sorted=items=>items.sort((a,b)=>a.filename.localeCompare(b.filename));
    container.innerHTML='<div class="pba-head"><div><h2>I tuoi banchi</h2><p>Conserva i file .mid e .syx. Scegli un banco, poi un suono da caricare.</p></div><div><button type="button" data-bank-action="import">Importa banchi</button><button type="button" data-bank-action="backup">Backup banchi</button><button type="button" data-bank-action="restore">Ripristina banchi</button></div></div><input type="file" data-bank-files accept=".mid,.midi,.syx" multiple hidden><input type="file" data-bank-backup accept=".json" hidden><p class="pba-status" role="status" aria-live="polite"></p><div class="pba-layout"><nav class="pba-banks" aria-label="Banchi archiviati"></nav><section class="pba-detail" aria-label="Suoni del banco"></section></div><p class="pba-note">Salvati in questo browser e su questo indirizzo. Esporta un backup per conservarli anche fuori dal browser. Carica usa solo il buffer Single o la parte Multi scelta.</p>';
    const status=container.querySelector('.pba-status'),list=container.querySelector('.pba-banks'),detail=container.querySelector('.pba-detail');
    // Reuse the space below the part destinations, leaving the full browser
    // width for the cover and patches. The same nav keeps its live handlers.
    if(bridge.sidebar){bridge.sidebar.append(list);container.classList.add('pba-has-sidebar');}
    const coverFile=document.createElement('input');coverFile.type='file';coverFile.accept='image/png,image/jpeg,image/webp';coverFile.hidden=true;coverFile.dataset.bankCover='';container.append(coverFile);let coverTarget=null;
    function el(tag,text,className){const node=document.createElement(tag);if(text)node.textContent=text;if(className)node.className=className;return node;}
    function button(text,action){const b=el('button',text);b.type='button';b.addEventListener('click',action);return b;}
    function render(){
      list.replaceChildren();detail.replaceChildren();
      container.querySelectorAll('[data-bank-action]').forEach(b=>b.disabled=busy);
      const visible=records.filter(r=>!query||r.filename.toLowerCase().includes(query)||r.patches.some(p=>p.name.toLowerCase().includes(query)));
      const active=visible.find(r=>r.id===selected)||visible[0];if(active)selected=active.id;
      const count=document.getElementById('pmArchiveCount');if(count)count.textContent=String(records.length);
      const panel=container.closest('[role=tabpanel]');if(panel){panel.dataset.resultCount=visible.length+' banchi / '+records.length;const summary=document.getElementById('pmSearchStatus');if(summary&&!panel.hidden)summary.textContent=panel.dataset.resultCount;}
      for(const r of visible){const b=button('',()=>{selected=r.id;render();});b.setAttribute('aria-pressed',String(r.id===selected));b.className='pba-bank-card';b.title=r.filename;const artwork=cover(r,'pba-thumb'),text=el('span');text.append(el('strong',r.filename),el('small',r.patches.length+' patch · '+Math.round(r.file.length/1024)+' KB'));b.append(artwork,text);list.append(b);}
      if(!records.length){detail.append(el('h3','La tua collezione di banchi'),el('p','Importa un banco .mid o .syx: nomi uguali in banchi diversi restano separati.'));return;}
      const record=visible.find(r=>r.id===selected)||visible[0];if(!record){detail.append(el('p','Nessun banco o suono corrisponde alla ricerca.'));return;}selected=record.id;
      const header=el('header');header.append(el('h3',record.filename),button('Scarica originale',()=>bridge.download(Uint8Array.from(record.file),record.filename,/\.mid(i)?$/i.test(record.filename)?'audio/midi':'application/octet-stream')));detail.append(header);
      const artwork=el('div',null,'pba-artwork'),actions=el('div');const upload=button(record.cover?'Cambia copertina':'Carica copertina',()=>{coverTarget=record.id;coverFile.click();});upload.disabled=busy;upload.dataset.bankCoverUpload='';
      actions.append(upload,el('small','PNG, JPG o WebP · max 8 MB'));
      if(record.cover&&access?.isAdmin!==false){const remove=button('Rimuovi copertina',()=>operation(()=>model.setCover(record.id,null),'Copertina rimossa.'));remove.disabled=busy;actions.append(remove);}
      artwork.append(cover(record,'pba-cover'));if(access?.isAdmin!==false)artwork.append(actions);detail.append(artwork);
      const patches=record.patches.filter(p=>!query||record.filename.toLowerCase().includes(query)||p.name.toLowerCase().includes(query));
      detail.append(el('p',patches.length+' / '+record.patches.length+' patch · destinazione '+bridge.context().label));
      const rows=el('div',null,'pba-patches');
      for(const patch of patches){const row=el('div',null,'pba-patch');row.append(el('span',String(patch.position).padStart(3,'0')),el('strong',patch.name));
        const load=button('Carica → '+bridge.context().label,async()=>{if(busy)return;busy=true;refresh();try{if(!bridge.context().connected)throw Error('Collega MIDI OUT per caricare.');const result=await bridge.load(patch.bytes);if(result===false)throw Error('Invio non riuscito.');status.textContent=patch.name+' inviato a '+bridge.context().label+'.';}catch(error){status.textContent=error.message;}finally{busy=false;render();}});load.dataset.bankLoad='';load.disabled=busy||!bridge.context().connected;
        row.append(load,button('.mid ↓',()=>bridge.download(bridge.bank.midiFromDumps([patch.bytes],patch.name),patch.name.replace(/[^a-z0-9_-]/gi,'_')+'.mid','audio/midi')));rows.append(row);}
      detail.append(rows);
    }
    function cover(record,className){if(record.cover){const img=el('img',null,className);img.src=validateCover(record.cover);img.alt=className==='pba-thumb'?'':'Copertina di '+record.filename;return img;}const placeholder=el('span','VH',className+' pba-cover-empty');placeholder.setAttribute('aria-hidden','true');return placeholder;}
    function refresh(){container.querySelectorAll('[data-bank-load]').forEach(b=>{b.disabled=busy||!bridge.context().connected;b.textContent='Carica → '+bridge.context().label;});}
    async function operation(action,success){if(busy)return;busy=true;render();try{const added=await action();records=sorted(await model.list());status.textContent=success||(added===0?'Banchi già presenti: nessun duplicato creato.':added+(added===1?' banco salvato.':' banchi salvati.')+' Nessun invio MIDI.');}catch(error){status.textContent='Archivio: '+error.message;}finally{busy=false;render();}}
    coverFile.onchange=async()=>{const file=coverFile.files[0],id=coverTarget;coverFile.value='';if(file&&id)await operation(async()=>model.setCover(id,await prepareCover(file,document)),'Copertina salvata. Nessun invio MIDI.');};
    const files=container.querySelector('[data-bank-files]'),backup=container.querySelector('[data-bank-backup]');
    container.querySelector('[data-bank-action=import]').onclick=()=>files.click();
    files.onchange=async()=>{const chosen=Array.from(files.files);files.value='';await operation(async()=>model.importFiles(await Promise.all(chosen.map(async f=>{if(f.size>MAX_FILE)throw Error('File oltre 8 MB.');return {name:f.name,bytes:new Uint8Array(await f.arrayBuffer())};}))));};
    container.querySelector('[data-bank-action=backup]').onclick=async()=>{try{bridge.download(new TextEncoder().encode(JSON.stringify(await model.backup())),'VIRUS-H-Banchi.json','application/json');}catch(e){status.textContent=e.message;}};
    container.querySelector('[data-bank-action=restore]').onclick=()=>backup.click();
    backup.onchange=async()=>{const f=backup.files[0];backup.value='';if(f)await operation(async()=>{if(f.size>64*1024*1024)throw Error('Backup oltre 64 MB.');return model.restore(JSON.parse(await f.text()));});};
    const ready=model.list().then(r=>{records=sorted(r);render();}).catch(e=>{status.textContent=e.message;render();});render();
    return {ready,model,refresh,async reload(){records=sorted(await model.list());render();},search(value){query=String(value).trim().toLowerCase();render();},async importBytes(bytes,name){await ready;await operation(()=>model.importFiles([{name,bytes}]));}};
  }
  const api={createStore,createRemoteStore,createModel,create,validateCover};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VirusPatchBanks=api;
})(typeof window!=='undefined'?window:globalThis);
