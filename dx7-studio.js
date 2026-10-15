/* Independent six-operator DX7-compatible software instrument. No Virus MIDI writes. */
(function(root){
  'use strict';
  const KEY='virusH_dx7_banks_v1';
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const names=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
  const name=p=>String.fromCharCode(...p.slice(145,155).map(v=>v>=32&&v<127?v:32)).trim()||'Senza nome';
  function unpack(p){
    if(p.length!==128)throw Error('Voce DX7 incompleta.');const u=new Uint8Array(155);
    for(let op=0;op<6;op++){const a=op*17,b=op*21;u.set(p.slice(a,a+11),b);u[b+11]=p[a+11]&3;u[b+12]=p[a+11]>>2&3;u[b+13]=p[a+12]&7;u[b+20]=p[a+12]>>3&15;u[b+14]=p[a+13]&3;u[b+15]=p[a+13]>>2&7;u[b+16]=p[a+14];u[b+17]=p[a+15]&1;u[b+18]=p[a+15]>>1&31;u[b+19]=p[a+16];}
    u.set(p.slice(102,110),126);u[134]=p[110]&31;u[135]=p[111]&7;u[136]=p[111]>>3&1;u.set(p.slice(112,116),137);u[141]=p[116]&1;u[142]=p[116]>>1&7;u[143]=p[116]>>4&7;u[144]=p[117];u.set(p.slice(118,128),145);return u;
  }
  function validate(p){
    if(p.length!==155||Array.from(p).some(v=>!Number.isInteger(v)||v<0||v>127))throw Error('Parametri DX7 non validi.');
    for(let op=0;op<6;op++){const base=op*21;for(const i of [...Array(11).keys(),16,19])if(p[base+i]>99)throw Error('Valore DX7 fuori intervallo.');if(p[base+11]>3||p[base+12]>3||p[base+13]>7||p[base+14]>3||p[base+15]>7||p[base+17]>1||p[base+18]>31||p[base+20]>14)throw Error('Operatore DX7 non valido.');}
    if([...p.slice(126,134),...p.slice(137,141)].some(v=>v>99))throw Error('Inviluppo o LFO DX7 non valido.');
    if(p[134]>31||p[135]>7||p[136]>1||p[141]>1||p[142]>5||p[143]>7||p[144]>48)throw Error('Voce DX7 non valida.');return Uint8Array.from(p);
  }
  function parse(input){
    const bytes=Uint8Array.from(input);let start=-1;const voices=[];
    for(let i=0;i<bytes.length;i++){
      if(bytes[i]===240){if(start!==-1)throw Error('SysEx DX7 interrotto.');start=i;}
      else if(bytes[i]===247&&start!==-1){
        const f=bytes.slice(start,i+1);start=-1;
        if(f[1]!==67||f[2]>15||![0,9].includes(f[3]))continue;
        const size=f[4]*128+f[5];if(!((f[3]===9&&size===4096)||(f[3]===0&&size===155))||f.length!==size+8)throw Error('Dimensione del banco DX7 non valida.');
        if(f.slice(1,-1).some(v=>v>127))throw Error('Byte SysEx DX7 non valido.');
        const data=f.slice(6,6+size);if(((data.reduce((sum,v)=>sum+v,0)+f[f.length-2])&127)!==0)throw Error('Checksum DX7 non valido.');
        const count=size===4096?32:1;for(let n=0;n<count;n++){const patch=validate(count===32?unpack(data.slice(n*128,n*128+128)):data);voices.push({name:name(patch),patch:Array.from(patch)});}
      }
    }
    if(start!==-1)throw Error('File SysEx incompleto.');if(!voices.length)throw Error('Nessuna voce DX7 trovata: importa un banco .syx a 6 operatori.');return voices;
  }
  function sysex(patch){const data=validate(patch);const sum=data.reduce((a,b)=>a+b,0);return new Uint8Array([240,67,0,0,1,27,...data,(-sum)&127,247]);}
  function initial(){
    const p=new Uint8Array(155);for(let op=0;op<6;op++){const b=op*21;p.set([99,99,99,80,99,99,99,0],b);p[b+18]=1;p[b+20]=7;}
    p[5*21+16]=99;p.set([99,99,99,99,50,50,50,50],126);p[134]=31;p[136]=1;p[137]=35;p[141]=1;p[142]=4;p[144]=24;p.set(Array.from('INIT SINE ',c=>c.charCodeAt(0)),145);return p;
  }
  function create(container,bridge={}){
    const doc=container.ownerDocument,win=doc.defaultView,storage=bridge.storage||win.localStorage;
    let banks=[{id:'init',name:'VIRUS-H · Init',voices:[{name:'INIT SINE',patch:Array.from(initial())}]}],selectedBank='init',voice=0,patch=initial(),operator=1,enabled=false,ctx=null,node=null,gain=null,starting=null,midi=false,latestPeak=0,outputId='',outputElement=null,outputStream=null;
    const held=new Map(),pointers=new Map();let previewTimer=null;
    try{const saved=JSON.parse(storage.getItem(KEY)||'[]');if(!Array.isArray(saved))throw Error();for(const bank of saved){if(!bank.voices?.length||typeof bank.id!=='string'||typeof bank.name!=='string'||!Array.isArray(bank.voices)||bank.voices.length>1024)throw Error();bank.voices=bank.voices.map(v=>({name:name(validate(v.patch)),patch:Array.from(validate(v.patch))}));}banks.push(...saved);if(saved.length)selectedBank=saved[0].id;}
    catch(error){bridge.report?.('Archivio DX7 non leggibile. Puoi reimportare i tuoi banchi.');}
    patch=Uint8Array.from(banks.find(b=>b.id===selectedBank).voices[0].patch);
    container.innerHTML=`<header class="vxd-heading"><div><small>STRUMENTO SOFTWARE · 6 OPERATORI FM</small><h2>PRISMA / X</h2><p>Patch DX7 native · audio dal computer</p></div><button type="button" data-dx-action="audio">Attiva audio</button></header><div class="vxd-audio-routing"><label>Uscita audio<select data-dx-output aria-label="Uscita audio"><option value="">Predefinita del sistema</option></select></label><button type="button" data-dx-action="output">Scegli dispositivo…</button><span data-dx-output-status role="status"></span></div><div class="vxd-library"><label>Banco<select data-dx-bank aria-label="Banco DX7"></select></label><label>Suono<select data-dx-voice aria-label="Suono DX7"></select></label><button type="button" data-dx-action="import">Importa banco DX7 .syx</button><button type="button" data-dx-action="export">Esporta voce .syx</button><a href="https://au.yamaha.com/en/musical-instruments/keyboards/explore/montage-portal/essentials/compatibility.html" target="_blank" rel="noopener">Banchi originali Yamaha ↗</a><input type="file" accept=".syx,.mid,.midi" multiple data-dx-file hidden></div><section class="vsi-panel vsi-phase vxd-panel"><header class="vsi-brand"><div><small>VIRUS-H INSTRUMENTS / SOFTWARE FM</small><h3>PRISMA / X</h3></div><span>6 OPERATORS · 32 ALGORITHMS</span></header><div class="vxd-screen-row"><div class="vsi-display-recess"><output class="vsi-param-number" data-dx-number>01</output><div class="vsi-lcd"><small>VOICE / SIX-OP FM</small><div><span data-dx-name></span></div></div></div><label>ALGORITHM<select data-dx-alg aria-label="Algoritmo FM">${Array.from({length:32},(_,i)=>`<option value="${i}">${i+1}</option>`).join('')}</select></label><label>FEEDBACK<input type="range" min="0" max="7" data-dx-feedback aria-label="Feedback FM"><output data-dx-feedback-value></output></label><label>LEVEL<input type="range" min="0" max="100" value="65" data-dx-volume aria-label="Volume motore DX7"></label><meter min="0" max="1" value="0" data-dx-meter aria-label="Livello audio DX7"></meter></div><div class="vxd-op-buttons">${[1,2,3,4,5,6].map(i=>`<button type="button" data-dx-op="${i}">OP ${i}</button>`).join('')}</div><div class="vxd-operator" data-dx-controls></div><footer><span data-dx-status>Audio disattivato · scegli una voce, poi attiva l’audio.</span><span>SOFTWARE FM / OUTPUT COMPUTER</span></footer><div class="vxd-keyboard"><img class="vsi-keyboard" src="assets/studio-instruments/keyboard-phase.webp" alt=""><div class="vxd-key-overlay" aria-label="Tastiera DX7"></div></div></section><div class="vxd-actions"><button type="button" data-dx-action="mac">Suona con Mac · A–L</button><button type="button" data-dx-action="preview">Prova nota</button><button type="button" data-dx-action="panic">Ferma tutte le note</button><button type="button" data-dx-action="midi" aria-pressed="false">Tastiera MIDI: disattivata</button><span data-dx-message role="status"></span></div><p class="vxd-footnote">Modifica i parametri FM e suona una nuova nota per ascoltarli. I file importati restano nella libreria di questo browser. Questo strumento produce audio software; le patch DX7 non vengono inviate al Virus.</p>`;
    const $=selector=>container.querySelector(selector);
    const report=text=>{$('[data-dx-message]').textContent=text;};
    const devices=win.navigator.mediaDevices;
    const AudioClass=win.AudioContext||win.webkitAudioContext;
    const contextRouting=typeof AudioClass?.prototype?.setSinkId==='function';
    const elementRouting=typeof win.HTMLMediaElement?.prototype?.setSinkId==='function';
    const canRoute=contextRouting||elementRouting;
    const outputStatus=text=>{$('[data-dx-output-status]').textContent=text;};
    async function outputs(extra){
      try{
        const list=devices?.enumerateDevices?await devices.enumerateDevices():[];
        const available=list.filter(d=>d.kind==='audiooutput'&&d.deviceId&&d.deviceId!=='default');
        if(extra&&!available.some(d=>d.deviceId===extra.deviceId))available.push(extra);
        const select=$('[data-dx-output]');
        select.innerHTML='<option value="">Predefinita del sistema</option>'+available.map((d,i)=>`<option value="${esc(d.deviceId)}">${esc(d.label||'Uscita audio '+(i+1))}</option>`).join('');
        // A disconnected interface must never leave a silent, stale destination selected.
        if(outputId&&!available.some(d=>d.deviceId===outputId)){
          await routeOutput('');outputStatus('Dispositivo scollegato · uso l’uscita di sistema.');
        }
        select.value=outputId;
      }catch(error){outputStatus('Elenco dispositivi non disponibile: '+error.message);}
    }
    async function routeOutput(id){
      if(!canRoute&&id)throw Error('Questo browser usa l’uscita audio di sistema.');
      if(ctx){
        if(contextRouting)await ctx.setSinkId(id);
        else if(elementRouting){
          // Route Web Audio through a media element only on browsers without context.setSinkId.
          if(!outputElement){outputElement=doc.createElement('audio');outputElement.autoplay=true;outputStream=ctx.createMediaStreamDestination();outputElement.srcObject=outputStream.stream;}
          await outputElement.setSinkId(id);
          if(enabled)await outputElement.play();
        }
      }
      outputId=id;
    }
    async function chooseOutput(){
      const button=$('[data-dx-action=output]');
      // This optional permission is requested only by the clearly labelled user action.
      if(button.dataset.permission==='microphone'){
        button.disabled=true;
        try{const stream=await devices.getUserMedia({audio:true,video:false});stream.getTracks().forEach(track=>track.stop());await outputs();outputStatus('Scegli l’uscita dal menu.');}
        catch(error){outputStatus('Elenco non autorizzato · mantengo l’uscita di sistema.');}
        finally{button.disabled=false;}
        return;
      }
      button.disabled=true;
      try{
        if(devices?.selectAudioOutput){const chosen=await devices.selectAudioOutput();await outputs(chosen);await routeOutput(chosen.deviceId);$('[data-dx-output]').value=outputId;outputStatus('Uscita selezionata: '+(chosen.label||'dispositivo audio'));}
        else{await outputs();if($('[data-dx-output]').options.length>1)outputStatus('Scegli l’uscita dal menu.');else if(devices?.getUserMedia){button.dataset.permission='microphone';button.textContent='Autorizza dispositivi…';outputStatus('Il browser richiede il permesso microfono per mostrare le uscite. Il microfono viene subito chiuso.');}else outputStatus('Il browser non espone altre uscite. Selezionale nelle impostazioni audio del sistema.');}
      }catch(error){outputStatus(error.name==='NotAllowedError'?'Selezione non autorizzata. Mantengo l’uscita attuale.':'Uscita non modificata: '+error.message);}
      finally{button.disabled=false;}
    }
    if(!canRoute){$('[data-dx-output]').disabled=true;$('[data-dx-action=output]').hidden=true;outputStatus('Questo browser segue l’uscita del sistema. Cambiala nelle impostazioni audio di macOS.');}
    else{outputs();devices?.addEventListener?.('devicechange',()=>outputs());}
    function bank(){return banks.find(b=>b.id===selectedBank);}
    function library(){
      $('[data-dx-bank]').innerHTML=banks.map(b=>`<option value="${esc(b.id)}">${esc(b.name)} · ${b.voices.length} voci</option>`).join('');$('[data-dx-bank]').value=selectedBank;
      $('[data-dx-voice]').innerHTML=bank().voices.map((p,i)=>`<option value="${i}">${String(i+1).padStart(2,'0')} · ${esc(p.name)}</option>`).join('');$('[data-dx-voice]').value=voice;
    }
    function controls(){
      const base=(6-operator)*21;
      $('[data-dx-controls]').innerHTML=[[16,'OUTPUT',99],[18,'COARSE',31],[19,'FINE',99],[0,'ATTACK',99],[1,'DECAY',99],[3,'RELEASE',99]].map(([offset,label,max])=>`<label>${label}<input type="range" min="0" max="${max}" value="${patch[base+offset]}" data-dx-param="${base+offset}" aria-label="Operatore ${operator} ${label}"><output>${patch[base+offset]}</output></label>`).join('');
      container.querySelectorAll('[data-dx-op]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.dxOp)===operator)));
      $('[data-dx-name]').textContent=name(patch);$('[data-dx-number]').textContent=String(voice+1).padStart(2,'0');$('[data-dx-alg]').value=patch[134];$('[data-dx-feedback]').value=patch[135];$('[data-dx-feedback-value]').textContent=patch[135];
    }
    function patchToEngine(){if(node)node.port.postMessage({type:'patch',data:Array.from(patch)});}
    function panic(){held.clear();pointers.clear();win.clearTimeout(previewTimer);node?.port.postMessage({type:'panic'});container.querySelectorAll('[data-dx-note]').forEach(b=>b.classList.remove('down'));}
    async function audio(){
      if(starting)return starting;
      starting=(async()=>{
        if(!ctx){
          const Audio=win.AudioContext||win.webkitAudioContext;if(!Audio)throw Error('Web Audio non disponibile.');ctx=new Audio({sampleRate:44100,latencyHint:'interactive'});
          if(!ctx.audioWorklet)throw Error('AudioWorklet non disponibile: apri l’app in un browser aggiornato.');
          await ctx.audioWorklet.addModule(new URL('vendor/dx7/dx7-worklet.js',doc.baseURI).href);
          node=new win.AudioWorkletNode(ctx,'virus-dx7',{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[1]});
          await new Promise((resolve,reject)=>{const timer=win.setTimeout(()=>reject(Error('Il motore FM non risponde.')),12000);node.port.onmessage=event=>{const m=event.data;if(m.type==='ready'){win.clearTimeout(timer);resolve();}else if(m.type==='error'){win.clearTimeout(timer);reject(Error(m.message));}else if(m.type==='meter'){latestPeak=m.peak;$('[data-dx-meter]').value=m.peak;$('[data-dx-meter]').dataset.peak=String(m.peak);}};node.onprocessorerror=()=>reject(Error('Errore nel motore FM.'));});
          gain=ctx.createGain();gain.gain.value=Number($('[data-dx-volume]').value)/100*.6;node.connect(gain);await routeOutput(outputId);gain.connect(outputStream||ctx.destination);patchToEngine();
        }
        gain.gain.setTargetAtTime(Number($('[data-dx-volume]').value)/100*.6,ctx.currentTime,.01);await ctx.resume();if(outputElement)await outputElement.play();enabled=true;$('[data-dx-action=audio]').textContent='Audio attivo';$('[data-dx-status]').textContent='Motore FM attivo · uscita audio del computer';report('');return true;
      })().catch(async error=>{enabled=false;report(error.message);if(ctx){await ctx.close().catch(()=>{});ctx=null;node=null;gain=null;if(outputElement){outputElement.pause();outputElement.srcObject=null;}outputElement=null;outputStream=null;}return false;}).finally(()=>{starting=null;});return starting;
    }
    function noteOn(note,velocity=100){if(!enabled||!node||note<0||note>127)return;held.set(note,velocity);node.port.postMessage({type:'midi',data:[144,note,velocity]});container.querySelector(`[data-dx-note="${note}"]`)?.classList.add('down');}
    function noteOff(note){held.delete(note);node?.port.postMessage({type:'midi',data:[128,note,0]});container.querySelector(`[data-dx-note="${note}"]`)?.classList.remove('down');}
    function choose(){panic();patch=Uint8Array.from(bank().voices[voice].patch);patchToEngine();library();controls();}
    async function importFiles(files){
      try{
        root.VirusAccess?.requireWrite();
        const additions=[];for(const file of files){let bytes=new Uint8Array(await file.arrayBuffer());if(bytes[0]===77&&bridge.extractMidi){const frames=bridge.extractMidi(bytes);bytes=Uint8Array.from(frames.flatMap(b=>Array.from(b)));}
          const voices=parse(bytes);let hash=2166136261;for(const b of bytes){hash^=b;hash=Math.imul(hash,16777619);}const id='dx7-'+(hash>>>0).toString(16);if(!banks.some(b=>b.id===id)&&!additions.some(b=>b.id===id))additions.push({id,name:file.name.replace(/\.(syx|mid|midi)$/i,''),voices});
        }
        const next=[...banks,...additions];storage.setItem(KEY,JSON.stringify(next.filter(b=>b.id!=='init')));banks=next;if(additions.length){selectedBank=additions[0].id;voice=0;choose();}report(additions.length?'Banchi importati nella libreria locale.':'Questi banchi sono già presenti.');
      }catch(error){report('Importazione non completata: '+error.message);}
    }
    container.addEventListener('change',async event=>{const t=event.target;if(t.matches('[data-dx-output]')){try{await routeOutput(t.value);outputStatus('Uscita selezionata: '+t.selectedOptions[0].textContent);}catch(error){t.value=outputId;outputStatus('Uscita non modificata: '+error.message);}return;}if(t.matches('[data-dx-bank]')){selectedBank=t.value;voice=0;choose();t.blur();}else if(t.matches('[data-dx-voice]')){voice=Number(t.value);choose();t.blur();}else if(t.matches('[data-dx-file]')){importFiles([...t.files]);t.value='';}});
    container.addEventListener('input',event=>{const t=event.target;let index;if(t.matches('[data-dx-param]')){index=Number(t.dataset.dxParam);t.nextElementSibling.textContent=t.value;}else if(t.matches('[data-dx-alg]'))index=134;else if(t.matches('[data-dx-feedback]')){index=135;$('[data-dx-feedback-value]').textContent=t.value;}else if(t.matches('[data-dx-volume]')){if(gain)gain.gain.setTargetAtTime(Number(t.value)/100*.6,ctx.currentTime,.01);return;}else return;patch[index]=Number(t.value);node?.port.postMessage({type:'param',index,value:patch[index]});});
    container.addEventListener('click',async event=>{const b=event.target.closest('button');if(!b)return;if(b.dataset.dxOp){operator=Number(b.dataset.dxOp);controls();return;}const a=b.dataset.dxAction;
      if(a==='audio'){if(enabled){panic();enabled=false;gain.gain.value=0;b.textContent='Attiva audio';$('[data-dx-status]').textContent='Audio disattivato';}else{if(gain)gain.gain.value=Number($('[data-dx-volume]').value)/100*.6;await audio();}}
      if(a==='output')await chooseOutput();if(a==='panic')panic();if(a==='import')$('[data-dx-file]').click();if(a==='export')bridge.download?.(sysex(patch),name(patch).replace(/[^\w-]/g,'_')+'.syx');
      if(a==='midi'){midi=!midi;b.setAttribute('aria-pressed',String(midi));b.textContent='Tastiera MIDI: '+(midi?'attivata':'disattivata');if(!midi)panic();}
      if(a==='mac'){doc.activeElement?.blur();if(await audio())report('Tastiera Mac pronta · A S D F G H J K L · Z/X ottava · C/V intensità.');}
      if(a==='preview'&&await audio()){panic();noteOn(60,100);previewTimer=win.setTimeout(()=>noteOff(60),650);}
    });
    const overlay=$('.vxd-key-overlay');let white=0;const keyData=[];
    for(let note=36;note<=96;note++){const black=[1,3,6,8,10].includes(note%12);keyData.push({note,black,position:black?white-.31:white++});}
    overlay.innerHTML=keyData.map(k=>`<button type="button" class="vxd-key ${k.black?'black':'white'}" style="left:${k.position/36*100}%;width:${(k.black?.62:1)/36*100}%" data-dx-note="${k.note}" aria-label="${names[k.note%12]}${Math.floor(k.note/12)-1}"></button>`).join('');
    overlay.addEventListener('pointerdown',async event=>{const key=event.target.closest('[data-dx-note]');if(!key)return;event.preventDefault();const note=Number(key.dataset.dxNote);pointers.set(event.pointerId,note);key.setPointerCapture(event.pointerId);if(await audio()&&pointers.has(event.pointerId))noteOn(note);});
    const release=e=>{const note=pointers.get(e.pointerId);if(note!==undefined){noteOff(note);pointers.delete(e.pointerId);}};['pointerup','pointercancel','lostpointercapture'].forEach(type=>overlay.addEventListener(type,release));
    container.addEventListener('keydown',e=>{if(e.target.matches('input:not([type=range]),select,textarea'))e.stopPropagation();});win.addEventListener('blur',panic);doc.addEventListener('visibilitychange',()=>{if(doc.hidden)panic();});
    library();controls();
    const active=()=>enabled&&container.getClientRects().length>0;
    return {active,selected:()=>container.getClientRects().length>0,start:audio,noteOn,noteOff,panic,importFiles,deactivate:()=>{panic();enabled=false;if(gain)gain.gain.value=0;$('[data-dx-action=audio]').textContent='Attiva audio';},midi:bytes=>{if(!active()||!midi)return false;const type=bytes[0]&240;if(![128,144,176,224].includes(type))return false;if(type===144&&bytes[2]>0)noteOn(bytes[1],bytes[2]);else if(type===128||type===144)noteOff(bytes[1]);else if([176,224].includes(type))node?.port.postMessage({type:'midi',data:Array.from(bytes.slice(0,3))});return true;}};
  }
  const api={create,parse,unpack,validate,sysex,initial,name,KEY};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VirusDx7Studio=api;
})(typeof window!=='undefined'?window:globalThis);
