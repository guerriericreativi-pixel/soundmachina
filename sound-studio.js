/* VIRUS-H Studio: original catalog, local drafts and non-destructive variants.
 * The model never talks to MIDI. Only explicit UI actions call the bridge. */
(function(root){
  'use strict';
  const KEY='virusH_soundStudio_v1';
  const styles=['trance','psytrance','techno','ambient','synthwave'];
  const titles={trance:'Trance',psytrance:'Psytrance',techno:'Techno',ambient:'Ambient',synthwave:'Synthwave',personal:'Personale'};
  const macroNames=['Corpo','Brillantezza','Movimento','Spazio'];
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const clone=value=>JSON.parse(JSON.stringify(value));
  function canonical(input){
    const bytes=Uint8Array.from(input||[]);
    if(![267,524].includes(bytes.length)||![240,0,32,51,1].every((n,i)=>bytes[i]===n)||bytes[6]!==16||bytes.at(-1)!==247||bytes.slice(1,-1).some(n=>n>127))throw Error('Patch Virus incompleta o non valida.');
    bytes[5]=16;bytes[7]=0;bytes[8]=64;
    let sum=0;
    for(let i=5;i<bytes.length-2;i++){
      if(bytes.length===524&&i===265)bytes[i]=sum&127;
      sum+=bytes[i];
    }
    bytes[bytes.length-2]=sum&127;
    return bytes;
  }
  function signature(bytes){
    const data=canonical(bytes);let hash=2166136261;
    for(const n of data){hash^=n;hash=Math.imul(hash,16777619);}
    return (hash>>>0).toString(16);
  }
  function named(bytes,name){
    const data=canonical(bytes);
    const ascii=name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7e]/g,'').slice(0,10).padEnd(10,' ');
    for(let i=0;i<10;i++)data[249+i]=ascii.charCodeAt(i);
    return canonical(data);
  }
  function macros(bytes,values,role){
    const data=canonical(bytes),base=canonical(bytes);
    if(!Array.isArray(values)||values.length!==4||values.some(n=>!Number.isInteger(n)||n<0||n>100))throw Error('Macro non valida.');
    const relative=(i)=> (values[i]-50)/50;
    const change=(offset,amount,limit=127)=>{if(amount===0)return;data[offset]=clamp(Math.round(data[offset]+amount),0,Math.max(base[offset],limit));};
    if(role==='Basso')change(9+34,relative(0)*30,68);
    else if(role==='Pad'){change(9+26,relative(0)*12,32);change(9+107,relative(0)*18,70);}
    else if(role==='Lead')change(9+26,relative(0)*14,35);
    else change(9+33,relative(0)*22,110);
    change(9+40,relative(1)*40);
    change(9+44,relative(1)*15,100);
    if(relative(2)!==0){
      const depth=base[9+88]-64,direction=depth<0?-1:1;
      data[9+88]=64+direction*clamp(Math.round(Math.abs(depth)+relative(2)*12),0,Math.max(Math.abs(depth),26));
    }
    change(9+107,relative(2)*18,80);
    change(9+113,relative(3)*26,55);
    if(data.length===524){change(266+2,relative(3)*32,60);if(relative(3)>0&&data[268]>0)data[267]=1;}
    else change(9+105,relative(3)*20,65);
    return canonical(data);
  }
  function parameterChanges(previous,next){
    const before=canonical(previous),after=canonical(next);
    if(before.length!==after.length)throw Error('Formato della patch cambiato: ricarica il suono.');
    const changes=[];
    for(const [page,start] of [[0x70,9],[0x71,137],...(after.length===524?[[0x6e,266],[0x6f,394]]:[])]){
      for(let index=0;index<128;index++)if(before[start+index]!==after[start+index])changes.push({page,index,value:after[start+index]});
    }
    return changes;
  }
  function createModel({bank,storage,instruments,id=()=>root.crypto?.randomUUID?.()||'s-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)}){
    let state={version:1,records:[],meta:{}},storageError='';
    const factory=bank.programs.map(p=>({id:'directions:'+p.id,name:p.name,style:p.style,role:p.role,description:p.description,origin:'factory',bytes:Array.from(bank.build(p.id)),tags:[p.style,p.role]}));
    if(instruments)factory.push(...instruments.presets(bank).map(r=>({...r,bytes:Array.from(named(r.bytes,r.name))})));
    function validate(value){
      if(value?.version!==1||!Array.isArray(value.records)||!value.meta||typeof value.meta!=='object'||Array.isArray(value.meta))throw Error('Backup Studio non valido.');
      const seen=new Set();
      const records=value.records.map(r=>{
        if(!r||typeof r.id!=='string'||!r.id||(r.id.startsWith('directions:')||r.id.startsWith('instrument:'))||seen.has(r.id)||typeof r.name!=='string'||!r.name.trim())throw Error('Suono nel backup non valido.');
        seen.add(r.id);
        return {...r,instrument:['poly','phase'].includes(r.instrument)?r.instrument:null,name:r.name.trim().slice(0,48),style:styles.includes(r.style)?r.style:'personal',role:['Basso','Lead','Pad','Keys','Pluck','FX','Suono'].includes(r.role)?r.role:'Suono',origin:r.origin==='import'?'import':'user',bytes:Array.from(canonical(r.bytes)),tags:Array.isArray(r.tags)?r.tags.filter(t=>typeof t==='string').slice(0,12):[]};
      });
      const meta=Object.create(null);
      for(const [key,m] of Object.entries(value.meta))if(m&&typeof m==='object')meta[key]={favorite:!!m.favorite};
      return {version:1,records,meta};
    }
    try{const saved=storage.getItem(KEY);if(saved)state=validate(JSON.parse(saved));}
    catch(error){storageError='Archivio locale non leggibile: ripristina un backup prima di salvare.';}
    function commit(next){
      if(storageError)throw Error(storageError);
      storage.setItem(KEY,JSON.stringify(next));state=next;
    }
    const entries=()=>[...factory,...state.records];
    const all=()=>entries().map(r=>({...r,bytes:[...r.bytes],tags:[...r.tags],favorite:!!state.meta[r.id]?.favorite}));
    const catalog=()=>entries().map(({bytes,...r})=>({...r,tags:[...r.tags],favorite:!!state.meta[r.id]?.favorite}));
    const get=id=>{const r=entries().find(r=>r.id===id);return r?{...r,bytes:[...r.bytes],tags:[...r.tags],favorite:!!state.meta[r.id]?.favorite}:undefined;};
    const factoryKeys=new Set(factory.map(r=>r.name+':'+signature(r.bytes)));
    function importLegacy(library){
      root.VirusAccess?.requireWrite();
      const added=[];let skipped=0;const known=new Set(state.records.map(r=>r.source));
      for(const [name,raw] of Object.entries(library||{})){
        let bytes;try{bytes=canonical(raw);}catch(error){skipped++;continue;}
        const key=name+':'+signature(bytes),source='legacy:'+key;
        if(known.has(source)||factoryKeys.has(key))continue;
        known.add(source);
        added.push({id:id(),name:String(name).slice(0,48),style:'personal',role:'Suono',origin:'import',source,bytes:Array.from(bytes),tags:[]});
      }
      if(added.length)commit({...state,records:[...state.records,...added]});
      return {added:added.length,skipped};
    }
    function saveVariant({parentId,name,bytes,style,role,tags=[]}){
      root.VirusAccess?.requireWrite();
      name=String(name||'').trim();if(!name)throw Error('Dai un nome al suono.');
      if(name.length>48)throw Error('Il nome può contenere al massimo 48 caratteri.');
      const parent=get(parentId);
      const record={id:id(),parentId:parent?.id||null,instrument:parent?.instrument||null,name,style:styles.includes(style)?style:parent?.style||'personal',role:role||parent?.role||'Suono',origin:'user',description:parent?'Variante di '+parent.name:'Letto dal Virus',tags:tags.filter(t=>typeof t==='string').slice(0,12),bytes:Array.from(named(bytes,name)),createdAt:new Date().toISOString()};
      commit({...state,records:[...state.records,record]});return get(record.id);
    }
    function favorite(recordId){if(!get(recordId))return;commit({...state,meta:{...state.meta,[recordId]:{favorite:!state.meta[recordId]?.favorite}}});}
    function importState(value){
      root.VirusAccess?.requireWrite();
      const incoming=validate(value);
      const existing=new Set(state.records.map(r=>r.id));
      const next={version:1,records:[...state.records,...incoming.records.filter(r=>!existing.has(r.id))],meta:{...incoming.meta,...state.meta}};
      // Explicit restore also recovers a corrupt local archive, without silently
      // replacing it during normal browsing or initialization.
      storage.setItem(KEY,JSON.stringify(next));state=next;storageError='';
    }
    return {all,catalog,get,importLegacy,saveVariant,favorite,exportState:()=>clone(state),importState,error:()=>storageError};
  }

  function create(container,bridge){
    const document=container.ownerDocument,bank=bridge.bank,instruments=bridge.instruments||root.VirusStudioInstruments;
    const effects=bridge.effects||(instruments?(typeof module!=='undefined'&&module.exports?require('./studio-effects'):root.VirusStudioEffects):null);
    const model=createModel({bank,instruments,storage:bridge.storage||document.defaultView.localStorage});
    let limit=100,selectedId='directions:skyline',filter='all',search='',role='',busy=false,message=model.error(),saveOpen=false;
    let panel=instruments?'poly':'macro',activeParam='fm',edits={},fxEdits={},fxBypassed=false,fxOpen=false;
    if(instruments)selectedId='instrument:forma-cloud';
    let selected=model.get(selectedId),values=[50,50,50,50],lastSent=null;
    const drafts=new Map();
    const clock=document.defaultView;let liveTimer=null;let softwareActive=false;let browserCollapsed=Boolean(instruments);
    try{const saved=clock.localStorage.getItem('virusH_studio_browser_collapsed_v1');if(saved!==null)browserCollapsed=saved==='1';}catch(error){}
    function cancelLive(){clock.clearTimeout(liveTimer);liveTimer=null;}
    const esc=text=>String(text||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const current=()=>{const bytes=instruments?instruments.apply(macros(selected.bytes,values,selected.role),edits,panel):macros(selected.bytes,values,selected.role);return canonical(effects?effects.apply(bytes,fxEdits):bytes);};
    const audible=()=>fxBypassed&&effects?canonical(effects.dry(current())):current();
    container.innerHTML=`<div class="vss-root hardware-chassis"><div class="chassis-logo">VIRUS-H STUDIO</div><header class="vss-top"><div><h2>Il tuo suono. A portata di mano.</h2><p>Scegli uno strumento. Costruisci il tuo suono.</p></div><div class="vss-top-actions"><button type="button" data-studio-action="toggle-library" aria-expanded="false" aria-controls="studioSoundBrowser">Mostra suoni</button><button type="button" data-studio-action="guided">Percorsi guidati</button><button type="button" data-studio-action="archive">File e banchi ↗</button></div></header>${instruments?`<nav class="vsi-rack" aria-label="Strumenti dello Studio"><button type="button" data-studio-instrument="poly"><span>01 / POLIFONICO</span><strong>FORMA / P</strong><small>Oscillatori · filtro · chorus</small></button><button type="button" data-studio-instrument="phase"><span>02 / DIGITALE</span><strong>PRISMA / D</strong><small>FM · tasti elettrici · metalli</small></button><button type="button" data-studio-instrument="dx7"><span>03 / FM SOFTWARE</span><strong>PRISMA / X</strong><small>Patch DX7 · sei operatori</small></button><button type="button" data-studio-instrument="macro"><span>04 / LIBRERIA</span><strong>VIRUS ENGINE</strong><small>Tutti i suoni · quattro macro</small></button></nav>`:''}<div class="vss-layout"><aside id="studioSoundBrowser" class="vss-browser" aria-label="Libreria suoni" data-open="false"><button type="button" class="vss-mobile-browser-toggle" data-studio-action="toggle-browser" aria-expanded="false">Sfoglia i suoni</button><label class="vss-search">Cerca un suono<input type="search" placeholder="Nome, stile o carattere…" data-studio-search></label><div class="vss-collections" aria-label="Collezioni">${[['all','Tutti i suoni'],['favorite','Preferiti'],['user','Le mie varianti'],['factory','Suoni originali'],...styles.map(s=>[s,titles[s]])].map(([id,name])=>`<button type="button" data-studio-filter="${id}" aria-pressed="false">${name}</button>`).join('')}</div><select aria-label="Tipo di suono" data-studio-role><option value="">Tutti i tipi</option>${['Basso','Lead','Pad','Pluck','Keys','FX'].map(v=>`<option>${v}</option>`).join('')}</select><div class="vss-list-heading"><span>SUONI</span><output data-studio-count></output></div><div class="vss-results" role="list" aria-label="Risultati suoni"></div><footer><button type="button" data-studio-action="capture">Leggi il suono dal Virus</button><button type="button" data-studio-action="import">Importa .mid / .syx</button></footer></aside><main class="vss-instrument" aria-label="Strumento selezionato"></main></div><div class="vss-dx7" data-studio-dx7 hidden></div><footer class="vss-footer"><span data-studio-connection></span><div><button type="button" data-studio-action="backup">Backup Studio</button><button type="button" data-studio-action="restore">Ripristina</button><button type="button" data-studio-action="midi">Configura MIDI</button></div></footer><input type="file" accept=".json" data-studio-backup-file hidden></div><div class="vss-guided" hidden><button type="button" class="vss-back" data-studio-action="library">← Torna allo Studio Suoni</button><div data-studio-guided></div></div>`;
    const shell=container.querySelector('.vss-root'),instrument=container.querySelector('.vss-instrument');
    const guide=bridge.createGuide?.(container.querySelector('[data-studio-guided]'));
    const dx7=bridge.createDx7?.(container.querySelector('[data-studio-dx7]'));
    if(!dx7)container.querySelector('[data-studio-instrument=dx7]')?.remove();
    function syncBrowser(){
      shell.classList.toggle('vss-browser-collapsed',browserCollapsed);
      container.querySelector('.vss-browser').hidden=browserCollapsed||softwareActive;
      const toggle=container.querySelector('[data-studio-action=toggle-library]');toggle.hidden=softwareActive;toggle.setAttribute('aria-expanded',String(!browserCollapsed));toggle.textContent=browserCollapsed?'Mostra suoni':'Nascondi suoni';
    }
    syncBrowser();
    function syncLibrary(){if(root.VirusAccess?.isAdmin===false)return;try{const result=model.importLegacy(bridge.library?.()||{});if(result.skipped)message=result.skipped+' file non compatibili non sono stati importati nello Studio.';}catch(error){message=error.message;}}
    function filtered(){const q=search.trim().toLowerCase();return model.catalog().filter(r=>(panel==='macro'||r.instrument===panel||r.origin!=='factory'&&!r.instrument)&&(!role||r.role===role)&&(!q||[r.name,r.style,r.role,r.description,...r.tags].join(' ').toLowerCase().includes(q))&&(filter==='all'||filter==='favorite'&&r.favorite||filter==='user'&&r.origin==='user'||filter==='factory'&&r.origin==='factory'||r.style===filter));}
    function renderList(){
      const records=filtered();
      if(filter==='user')records.sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
      container.querySelector('[data-studio-count]').textContent=records.length;
      container.querySelector('.vss-mobile-browser-toggle').textContent='Cambia suono · '+records.length+' disponibili';
      container.querySelectorAll('[data-studio-filter]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.studioFilter===filter));b.hidden=panel!=='macro'&&styles.includes(b.dataset.studioFilter);});
      container.querySelector('.vss-results').innerHTML=records.length?records.slice(0,limit).map(r=>`<div class="vss-sound-row" role="listitem"><button type="button" data-studio-select="${esc(r.id)}" aria-pressed="${r.id===selectedId}"><span class="vss-sound-dot" data-style="${esc(r.style)}"></span><span><strong>${esc(r.name)}</strong><small>${esc(r.role)} · ${esc(titles[r.style]||'Personale')}${r.parentId?' · variante':''}</small></span></button><button type="button" class="vss-favorite" data-studio-favorite="${esc(r.id)}" aria-label="Preferito: ${esc(r.name)}" aria-pressed="${r.favorite}"><img src="assets/icons/lucide/star.svg" alt="" width="14" height="14"></button></div>`).join('')+(records.length>limit?'<button type="button" data-studio-action="more">Mostra altri suoni</button>':''):'<div class="vss-empty">Nessun suono trovato.<button type="button" data-studio-action="clear">Mostra tutti i suoni</button></div>';
    }
    const renderPanel=()=>{const presets=model.catalog().filter(r=>r.instrument===panel);if(!presets.some(r=>r.id===selectedId))presets.unshift(selected);return instruments.render(panel,current(),activeParam,{id:selectedId,name:selected.name,presets});};
    function renderInstrument(){
      shell.dataset.style=selected.style;
      shell.dataset.instrument=panel;
      container.querySelectorAll('[data-studio-instrument]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.studioInstrument===(softwareActive?'dx7':panel))));
      const style=styles.includes(selected.style)?selected.style:'materia';
      const family=['synthwave','personal'].includes(selected.style)?'analog':'digital';
      instrument.innerHTML=`<div class="vss-cover"><img src="assets/sound-paths/${style}.webp" alt="" class="vss-cover-image"><div><span>${esc(selected.role)} / ${esc(titles[selected.style]||'Personale')}</span><h3>${esc(selected.name)}</h3><p>${esc(selected.description||'Il tuo suono, pronto per una nuova direzione.')}</p><small>${selected.origin==='factory'?(selected.instrument?'VIRUS-H INSTRUMENTS · ORIGINALE':'DIRECTIONS 01 · ORIGINALE'):selected.parentId?'LA TUA VARIANTE':'DALLA TUA LIBRERIA'}</small></div></div><section class="vss-workbench"><div class="vss-patch-bar"><div><span data-studio-draft-state></span><small data-studio-edit-mode></small></div><div class="vss-patch-buttons"><button type="button" class="vss-send-primary" data-studio-action="load">Carica nel Virus</button><button type="button" data-studio-action="save">Salva variante</button></div></div>${instruments&&panel!=='macro'?`<div data-studio-hardware>${renderPanel()}</div>${effects&&panel==='poly'?effects.render(current(),{open:fxOpen}):''}<p class="vsi-local-note">Controlli del motore Virus · carica il suono una volta, poi regolalo in tempo reale. I suoni di partenza sono originali e da verificare all’ascolto.</p>`:''}<div class="vss-macro-panel" ${panel!=='macro'?'hidden':''} data-family="${family}"><header><strong>MODELLA IL SUONO</strong><span>VIRUS ENGINE</span></header><div class="vss-macros">${macroNames.map((name,i)=>`<label><span>${name}</span><span class="vss-dial" style="--frame-x:0;--frame-y:2"><span class="vss-dial-art" aria-hidden="true"></span><input type="range" min="0" max="100" step="1" value="${values[i]}" data-studio-macro="${i}" aria-label="${name}" title="Trascina in verticale. Shift: precisione. Doppio clic: ripristina."></span><output data-studio-value="${i}"></output><small>${['Peso e ampiezza','Filtro e apertura','LFO e modulazione','Riverbero ed eco'][i]}</small></label>`).join('')}</div><p>Macro relative al suono scelto · 0 conserva il timbro di partenza.</p></div><div class="vss-compare"><div><span>CONFRONTO A/B</span><p>Invia una versione al Virus e suonala dalla tastiera.</p></div><div><button type="button" data-studio-action="a">A · Originale</button><button type="button" class="vss-send-primary" data-studio-action="b">Invia B · La tua versione</button></div></div><p class="vss-transmission" data-studio-transmission role="status"></p><div class="vss-save-form" ${saveOpen?'':'hidden'}><form data-studio-save-form><h4>Conserva questa versione.</h4><label>Nome della variante<input required maxlength="48" name="soundName" value="${esc(selected.name+' v2')}" aria-label="Nome della variante"></label><label>Carattere<input name="soundTags" maxlength="120" placeholder="Caldo, morbido, pulsante…" aria-label="Carattere della variante"></label><div class="vss-save-categories"><label>Tipo<select name="soundRole" aria-label="Tipo della variante">${['Suono','Basso','Lead','Pad','Pluck','Keys','FX'].map(v=>`<option ${v===selected.role?'selected':''}>${v}</option>`).join('')}</select></label><label>Stile<select name="soundStyle" aria-label="Stile della variante">${['personal',...styles].map(v=>`<option value="${v}" ${v===selected.style?'selected':''}>${titles[v]}</option>`).join('')}</select></label></div><p>L’originale resta al suo posto. Il salvataggio è nella libreria di questo browser. Sul Virus il nome usa i primi 10 caratteri.</p><div><button type="submit" class="vss-save-primary">Salva nella mia libreria</button><button type="button" data-studio-action="cancel-save">Annulla</button></div></form></div><div class="vss-secondary-actions"><button type="button" data-studio-action="reset">${panel==='macro'?'Ripristina macro':'Ripristina pannello'}</button><button type="button" data-studio-action="advanced">Invia B e apri editor ↗</button><button type="button" data-studio-action="export">Esporta suono .mid</button></div><p data-studio-message class="vss-message" role="status" aria-live="polite"></p></section>`;
      updateControls();refresh();
    }
    function updateControls(){
      values.forEach((value,i)=>{
        const input=instrument.querySelector(`[data-studio-macro="${i}"]`);input.value=value;
        const frame=Math.round(value/100*31);
        input.parentElement.style.setProperty('--frame-x',frame%8);input.parentElement.style.setProperty('--frame-y',Math.floor(frame/8));
        instrument.querySelector(`[data-studio-value="${i}"]`).textContent=value===50?'0':(value>50?'+':'')+(value-50);
      });
      instrument.querySelector('[data-studio-draft-state]').textContent=(values.some(v=>v!==50)||Object.keys(edits).length||Object.keys(fxEdits).length)?'BOZZA · MODIFICHE LOCALI':'BASE · '+selected.name;
    }
    function refresh(){
      const context=bridge.context();
      if(lastSent&&(!context.connected||lastSent.target!==context.targetKey||context.signature&&context.signature!==lastSent.signature)){cancelLive();lastSent=null;}
      container.querySelector('[data-studio-connection]').textContent=context.connected?'MIDI OUT · '+context.label:'MIDI non collegato · puoi creare e salvare i suoni';
      instrument.querySelectorAll('[data-studio-action=a],[data-studio-action=b],[data-studio-action=advanced],[data-studio-action=load]').forEach(b=>b.disabled=busy||!context.connected);
      container.querySelector('[data-studio-action=capture]').disabled=busy||!context.connected;
      container.querySelectorAll('[data-studio-macro],[data-studio-action=save],[data-studio-select],[data-studio-action=reset],[data-instrument-param],[data-instrument-edit],[data-instrument-chorus],[data-instrument-switch],[data-instrument-preset],[data-studio-instrument]').forEach(b=>b.disabled=busy);
      const transmission=instrument.querySelector('[data-studio-transmission]');
      if(lastSent&&lastSent.target===context.targetKey&&context.connected){
        transmission.textContent=context.signature&&context.signature!==lastSent.signature?'Il suono del Virus è cambiato. Leggilo per continuare da lì.':lastSent.side+' inviato a '+lastSent.label+(lastSent.signature!==signature(audible())?' · le nuove modifiche B sono ancora locali.':'.');
      }else transmission.textContent=context.connected?'Destinazione: '+context.label+' · nessun invio. Premi Carica nel Virus per ascoltare questo suono.':'Collega il Virus per ascoltare e confrontare A/B.';
      instrument.querySelectorAll('[data-studio-action=a],[data-studio-action=b]').forEach(b=>b.setAttribute('aria-pressed',String(!!lastSent&&context.connected&&(!context.signature||context.signature===lastSent.signature)&&lastSent.target===context.targetKey&&lastSent.side===(b.dataset.studioAction==='a'?'A':'B'))));
      const live=!!bridge.update&&lastSent&&context.connected&&lastSent.target===context.targetKey&&(!context.signature||context.signature===lastSent.signature);
      instrument.querySelector('[data-studio-edit-mode]').textContent=live?'LIVE · i controlli modificano il Virus in tempo reale.':'Premi Carica nel Virus per attivare i controlli in tempo reale.';
      if(live&&signature(audible())===lastSent.signature&&lastSent.side==='B')instrument.querySelector('[data-studio-draft-state]').textContent='LIVE · '+selected.name;
      instrument.querySelector('[data-studio-message]').textContent=message;
      effects?.sync(instrument,current(),{bypassed:fxBypassed,live:!!live,compareReady:!!live&&lastSent.side==='B',busy});
      if(panel==='poly'){const bytes=current();instrument.querySelectorAll('[data-instrument-chorus]').forEach(b=>b.setAttribute('aria-pressed',String(bytes[114]===0?b.dataset.instrumentChorus==='0':Number(b.dataset.instrumentChorus)===(bytes[115]<29?1:2))));}
      guide?.refresh();
    }
    // Coalesce fast pointer events into one parameter batch; never reload a dump.
    function queueLive(){
      if(!bridge.update||!lastSent||busy)return;
      cancelLive();liveTimer=clock.setTimeout(()=>{
        liveTimer=null;
        const context=bridge.context();
        if(!lastSent||busy)return;
        if(!context.connected||context.targetKey!==lastSent.target||context.signature&&context.signature!==lastSent.signature){
          lastSent=null;message='Controlli live sospesi: ricarica il suono nella destinazione attiva.';refresh();return;
        }
        try{
          const bytes=audible();
          if(signature(bytes)===lastSent.signature)return;
          const result=bridge.update(bytes,lastSent.bytes,lastSent.target);
          lastSent={target:result.targetKey,label:result.label,signature:signature(bytes),bytes:Array.from(bytes),side:'B'};
          message='';updateControls();refresh();
        }catch(error){lastSent=null;message='Controlli live interrotti: '+error.message;refresh();}
      },32);
    }
    function select(id){
      if(busy)return;cancelLive();
      container.querySelector('.vss-browser').dataset.open='false';container.querySelector('.vss-mobile-browser-toggle').setAttribute('aria-expanded','false');
      drafts.set(selectedId,{values:[...values],edits:{...edits},fxEdits:{...fxEdits}});fxBypassed=false;selectedId=id;selected=model.get(id);values=drafts.get(id)?.values||[50,50,50,50];edits=drafts.get(id)?.edits||{};fxEdits=drafts.get(id)?.fxEdits||{};if(selected.instrument&&instruments)panel=selected.instrument;saveOpen=false;message='';lastSent=null;
      renderList();renderInstrument();
    }
    async function send(side){
      if(busy||!bridge.context().connected){message='Collega MIDI OUT prima di inviare il suono.';refresh();return false;}
      fxBypassed=false;cancelLive();busy=true;message='Invio della versione '+side+'…';refresh();
      try{
        const bytes=side==='A'?canonical(selected.bytes):current();
        const result=await bridge.load(bytes);
        lastSent={target:result.targetKey,signature:signature(bytes),bytes:Array.from(bytes),label:result.label,side};message='';return true;
      }catch(error){lastSent=null;message='Invio interrotto: '+error.message;return false;}
      finally{busy=false;refresh();}
    }
    async function capture(){
      if(busy)return;cancelLive();const captureTarget=bridge.context().targetKey;busy=true;message='Lettura del suono dal Virus…';refresh();
      try{
        const result=await bridge.capture();
        if(bridge.context().targetKey!==captureTarget)throw Error('La destinazione è cambiata durante la lettura.');
        const record=model.saveVariant({name:result.name||'Dal Virus',bytes:result.bytes,style:'personal',role:'Suono'});
        busy=false;select(record.id);
        const context=bridge.context();
        lastSent={target:context.targetKey,label:context.label,signature:signature(record.bytes),bytes:[...record.bytes],side:'B'};
        filter='user';renderList();message='Suono letto da '+result.label+' e conservato nella libreria.';
      }catch(error){message='Lettura non completata: '+error.message;}
      finally{busy=false;refresh();}
    }
    const keyPointers=new Map();
    const releaseKey=event=>{const note=keyPointers.get(event.pointerId);if(note===undefined)return;keyPointers.delete(event.pointerId);bridge.stopNote?.(note);container.querySelectorAll('[data-studio-note="'+note+'"]').forEach(k=>k.classList.remove('down'));};
    container.addEventListener('pointerdown',event=>{const key=event.target.closest('[data-studio-note]');if(!key||!bridge.playNote)return;event.preventDefault();const note=Number(key.dataset.studioNote);keyPointers.set(event.pointerId,note);key.setPointerCapture?.(event.pointerId);key.classList.add('down');bridge.playNote(note,100);});
    ['pointerup','pointercancel','lostpointercapture'].forEach(type=>container.addEventListener(type,releaseKey));
    clock.addEventListener('pointerup',releaseKey);clock.addEventListener('blur',()=>{for(const [pointerId] of keyPointers)releaseKey({pointerId});});
    const editFX=(input,value)=>{
      if(!effects||busy)return;const offset=Number(input.dataset.fxParam),spec=effects.specs.get(offset);if(!spec)return;
      fxBypassed=false;if(offset===238&&Number(value)>0&&current()[237]===0)fxEdits[237]=1;fxEdits[offset]=clamp(Math.round(Number(value)),0,spec.max);message='';updateControls();refresh();queueLive();
      // Chorus buttons and the rack always describe the same native effect.
      if([114,115,116].includes(offset)){const bytes=current();instrument.querySelectorAll('[data-instrument-chorus]').forEach(b=>b.setAttribute('aria-pressed',String(bytes[114]===0?b.dataset.instrumentChorus==='0':Number(b.dataset.instrumentChorus)===(bytes[115]<29?1:2))));}
    };
    container.addEventListener('toggle',event=>{if(container.contains(event.target)&&event.target.matches('[data-studio-fx]'))fxOpen=event.target.open;},true);
    container.addEventListener('input',event=>{
      if(event.target.matches('[data-fx-param]')){editFX(event.target,event.target.value);return;}
      if(event.target.matches('[data-studio-search]')){search=event.target.value;limit=100;renderList();return;}
      if(event.target.matches('[data-instrument-param]')&&!busy){
        fxBypassed=false;const offset=Number(event.target.dataset.instrumentParam),value=clamp(Math.round(Number(event.target.value)),0,127);edits[offset]=value;
        event.target.style.setProperty('--level',value/127*100+'%');
        instrument.querySelectorAll('[data-instrument-output="'+offset+'"]').forEach(o=>o.textContent=value);
        const lcd=instrument.querySelector('[data-instrument-lcd-value]');if(lcd&&offset!==100){lcd.textContent=value;instrument.querySelector('.vsi-lcd-bar').style.setProperty('--level',value/127*100+'%');}
        updateControls();refresh();queueLive();return;
      }
      if(!event.target.matches('[data-studio-macro]')||busy)return;
      values[Number(event.target.dataset.studioMacro)]=clamp(Math.round(Number(event.target.value)),0,100);message='';updateControls();refresh();queueLive();
    });
    container.addEventListener('change',event=>{if(event.target.matches('select[data-fx-param]')){editFX(event.target,event.target.value);event.target.blur();return;}if(event.target.matches('[data-instrument-preset]')&&!busy){select(event.target.value);return;}if(event.target.matches('[data-studio-role]')){role=event.target.value;limit=100;renderList();}});
    container.addEventListener('submit',event=>{
      if(!event.target.matches('[data-studio-save-form]'))return;event.preventDefault();if(busy)return;
      const form=event.target;
      try{
        const record=model.saveVariant({parentId:selectedId,name:form.elements.soundName.value,bytes:current(),style:form.elements.soundStyle.value,role:form.elements.soundRole.value,tags:form.elements.soundTags.value.split(',').map(t=>t.trim()).filter(Boolean)});
        select(record.id);filter='user';search='';container.querySelector('[data-studio-search]').value='';role='';container.querySelector('[data-studio-role]').value='';renderList();message='Variante salvata. L’originale è conservato.';refresh();
      }catch(error){message='Salvataggio non riuscito: '+error.message;refresh();}
    });
    container.addEventListener('click',async event=>{
      const target=event.target.closest('button');if(!target)return;
      if(busy&&!['backup','export'].includes(target.dataset.studioAction))return;
      if(target.dataset.studioInstrument){
        const software=target.dataset.studioInstrument==='dx7';cancelLive();
        if(!software)dx7?.deactivate();softwareActive=software;syncBrowser();
        container.querySelector('.vss-layout').hidden=software;container.querySelector('.vss-footer').hidden=software;container.querySelector('[data-studio-dx7]').hidden=!software;
        if(software){shell.dataset.instrument='dx7';container.querySelectorAll('[data-studio-instrument]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.studioInstrument==='dx7')));return;}
        panel=target.dataset.studioInstrument;filter='all';search='';role='';container.querySelector('[data-studio-search]').value='';container.querySelector('[data-studio-role]').value='';if(panel==='macro'){renderList();renderInstrument();return;}select('instrument:'+(panel==='poly'?'forma-cloud':'prisma-keys'));return;}
      if(target.dataset.instrumentSwitch&&!busy){fxBypassed=false;const [key,value]=target.dataset.instrumentSwitch.split(':');Object.assign(edits,instruments.switches(key,value));instrument.querySelector('[data-studio-hardware]').innerHTML=renderPanel();updateControls();refresh();queueLive();return;}
      if(target.dataset.instrumentEdit){activeParam=target.dataset.instrumentEdit;instrument.querySelector('[data-studio-hardware]').innerHTML=renderPanel();return;}
      if(target.dataset.instrumentChorus!==undefined){fxBypassed=false;for(const offset of [114,115,116])delete fxEdits[offset];Object.assign(edits,instruments.chorus(Number(target.dataset.instrumentChorus)));instrument.querySelector('[data-studio-hardware]').innerHTML=renderPanel();updateControls();refresh();queueLive();return;}
      if(target.dataset.studioSelect){select(target.dataset.studioSelect);return;}
      if(target.dataset.studioFavorite){try{model.favorite(target.dataset.studioFavorite);renderList();}catch(error){message=error.message;refresh();}return;}
      if(target.dataset.studioFilter){filter=target.dataset.studioFilter;limit=100;renderList();return;}
      const action=target.dataset.studioAction;
      if(action==='fx-suggest'&&effects){fxBypassed=false;const suggested=effects.suggested(selected.role);fxEdits={...fxEdits,...Object.fromEntries(Object.entries(suggested).filter(([offset])=>Number(offset)<current().length-2))};message='FX suggeriti per '+selected.role+' · salva una variante per conservarli.';updateControls();refresh();queueLive();return;}
      if(action==='fx-bypass'&&effects){if(!lastSent||lastSent.side!=='B'||!bridge.context().connected)return;fxBypassed=!fxBypassed;refresh();queueLive();return;}
      if(action==='toggle-library'){browserCollapsed=!browserCollapsed;syncBrowser();try{clock.localStorage.setItem('virusH_studio_browser_collapsed_v1',browserCollapsed?'1':'0');}catch(error){}return;}
      if(action==='forma-bank'){bridge.downloadForma?.();return;}
      if(action==='mac'){document.activeElement?.blur();bridge.keyboard?.();message='Tastiera Mac pronta · A–L note · Z/X ottava · C/V intensità.';refresh();return;}
      if(action==='preview-note'){bridge.playNote?.(60,100);clock.setTimeout(()=>bridge.stopNote?.(60),600);return;}
      if(action==='load'){await send('B');return;}
      if(action==='a'||action==='b'){await send(action.toUpperCase());return;}
      if(action==='capture'){await capture();return;}
      if(action==='advanced'){if(await send('B'))bridge.advanced();return;}
      if(action==='save'){saveOpen=true;renderInstrument();instrument.querySelector('[name=soundName]').focus();return;}
      if(action==='cancel-save'){saveOpen=false;renderInstrument();return;}
      if(action==='reset'){values=[50,50,50,50];edits={};fxEdits={};fxBypassed=false;renderInstrument();queueLive();return;}
      if(action==='more'){limit+=100;renderList();return;}
      if(action==='clear'){filter='all';role='';search='';container.querySelector('[data-studio-search]').value='';container.querySelector('[data-studio-role]').value='';renderList();return;}
      if(action==='toggle-browser'){const browser=container.querySelector('.vss-browser');browser.dataset.open=String(browser.dataset.open!=='true');target.setAttribute('aria-expanded',browser.dataset.open);return;}
      if(action==='guided'){shell.hidden=true;container.querySelector('.vss-guided').hidden=false;guide?.refresh();return;}
      if(action==='library'){shell.hidden=false;container.querySelector('.vss-guided').hidden=true;refresh();return;}
      if(action==='restore'){container.querySelector('[data-studio-backup-file]').click();return;}
      if(action==='backup'){bridge.download(new TextEncoder().encode(JSON.stringify(model.exportState(),null,2)),'VIRUS-H-Studio.json','application/json');return;}
      if(action==='export'){bridge.download(bank.midiFromDumps([named(current(),selected.name)],selected.name),selected.name.replace(/[^a-zA-Z0-9_-]/g,'_')+'.mid','audio/midi');return;}
      if(['archive','import','midi'].includes(action))bridge[action]();
    });
    container.querySelector('[data-studio-backup-file]').addEventListener('change',async event=>{
      const file=event.target.files[0];if(!file)return;
      try{model.importState(JSON.parse(await file.text()));renderList();message='Backup Studio ripristinato. I suoni già presenti sono conservati.';}
      catch(error){message='Ripristino non riuscito: '+error.message;}
      finally{event.target.value='';refresh();}
    });
    let drag=null;
    container.addEventListener('pointerdown',event=>{
      const input=event.target.closest('[data-studio-macro],input[data-fx-param]');if(!input||busy||event.button!==0)return;
      event.preventDefault();input.focus();input.setPointerCapture(event.pointerId);drag={input,id:event.pointerId,y:event.clientY,value:Number(input.value)};
    });
    container.addEventListener('pointermove',event=>{
      if(!drag||event.pointerId!==drag.id)return;
      const value=clamp(Math.round(drag.value+(drag.y-event.clientY)*(event.shiftKey?.1:.65)),0,drag.input.matches('[data-fx-param]')?127:100);
      if(drag.input.matches('[data-fx-param]')){editFX(drag.input,value);return;}
      values[Number(drag.input.dataset.studioMacro)]=value;updateControls();refresh();queueLive();
    });
    const end=event=>{if(drag&&event.pointerId===drag.id)drag=null;};
    ['pointerup','pointercancel','lostpointercapture'].forEach(name=>container.addEventListener(name,end));
    container.addEventListener('dblclick',event=>{if(event.target.matches('input[data-fx-param]')&&!busy){const spec=effects.specs.get(Number(event.target.dataset.fxParam));editFX(event.target,spec.center||0);return;}if(event.target.matches('[data-studio-macro]')&&!busy){values[Number(event.target.dataset.studioMacro)]=50;updateControls();refresh();queueLive();}});
    container.addEventListener('keydown',event=>{
      const input=event.target;
      if(!input.matches('[data-studio-macro]')||busy)return;
      const steps={ArrowUp:1,ArrowRight:1,ArrowDown:-1,ArrowLeft:-1,PageUp:10,PageDown:-10};
      if(event.key in steps||['Home','End'].includes(event.key)){
        event.stopPropagation();event.preventDefault();
        const i=Number(input.dataset.studioMacro);
        values[i]=event.key==='Home'?0:event.key==='End'?100:clamp(values[i]+steps[event.key],0,100);
        updateControls();refresh();queueLive();
      }
    });
    document.addEventListener('change',refresh);
    document.addEventListener('virus-studio-context',refresh);
    container.addEventListener('pointerenter',refresh);
    syncLibrary();renderList();renderInstrument();
    return {refresh:()=>{syncLibrary();renderList();refresh();},exportState:model.exportState,importState:value=>{model.importState(value);renderList();refresh();},model};
  }
  const api={create,createModel,canonical,signature,named,macros,parameterChanges,KEY};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VirusSoundStudio=api;
})(typeof window!=='undefined'?window:globalThis);
