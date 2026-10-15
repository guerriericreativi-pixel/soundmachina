/* Original sound recipes for the Virus engine. No third-party patches or skins. */
(function (root) {
  'use strict';
  const parameter = (index, name, value, page = 0x70) => ({page, index, name, value});
  const envelope = (a, d, s, r) => [parameter(59,'Attack',a),parameter(60,'Decay',d),parameter(61,'Sustain',s),parameter(63,'Release',r)];
  const filter = (cutoff, resonance) => [parameter(40,'Cutoff',cutoff),parameter(42,'Resonance',resonance)];
  const space = (send, time) => [parameter(2,'Reverb send',send,0x6e),parameter(4,'Reverb time',time,0x6e)];
  const paths = [
    {id:'trance',group:'styles',name:'Trance',tag:'Aperto · melodico',color:'#65d9e4',tempo:'136',title:'Lascia aprire il suono.',description:'Lead luminosi, arpeggi e accordi larghi. Parti da un suono a dente di sega e costruisci il movimento con filtro e inviluppo.',steps:['Scegli una patch saw in SINGLE.','Applica i parametri alla parte attiva.','Costruisci il movimento in ARP o SEQ.'],parts:['Basso pulsante','Lead aperto','Arpeggio','Pad largo'],writes:[...filter(96,24),...envelope(5,60,100,50),parameter(26,'Detune',14),parameter(105,'Chorus mix',28)]},
    {id:'psytrance',group:'styles',name:'Psytrance',tag:'Serrato · psichedelico',color:'#e5b75e',tempo:'145',title:'Ogni nota lascia una traccia.',description:'Attacchi rapidi, bassi precisi e una punta di FM. Questi parametri accorciano la coda del suono corrente e mettono il filtro in primo piano.',steps:['Parti da una patch di basso o da un lead corto.','Applica i parametri e ascolta le note separate.','Prova un pattern in ARP; rifinisci gate e ottave.'],parts:['Basso corto','Lead modulato','Sequenza','Texture'],writes:[...filter(64,56),...envelope(0,42,78,12),parameter(27,'FM amount',20),parameter(105,'Chorus mix',0)]},
    {id:'techno',group:'styles',name:'Techno',tag:'Scuro · ritmico',color:'#b8d66a',tempo:'130',title:'Poche note. Più tensione.',description:'Un filtro più chiuso, risonanza e inviluppi brevi per lavorare su bassi, stab e sequenze. Il carattere di partenza resta quello della tua patch.',steps:['Scegli un basso o uno stab in SINGLE.','Applica i parametri e regola il cutoff.','Apri SEQ per costruire una figura ripetitiva.'],parts:['Basso','Stab','Sequenza','Rumore / FX'],writes:[...filter(48,44),...envelope(0,46,72,18),parameter(105,'Chorus mix',0),parameter(27,'FM amount',12)]},
    {id:'ambient',group:'styles',name:'Ambient',tag:'Lento · immersivo',color:'#aaa4ed',tempo:'80',title:'Dai tempo al suono.',description:'Attacco progressivo, rilascio lungo e riverbero per lasciare evolvere pad e accordi. Parti da una patch morbida e ascolta come si sovrappongono le voci.',steps:['Scegli un pad con una forma morbida.','Applica i parametri e suona poche note.','Apri FX RACK per bilanciare lo spazio.'],parts:['Fondamentale','Pad','Motivo lento','Atmosfera'],writes:[...filter(76,18),...envelope(76,95,108,100),parameter(105,'Chorus mix',46),...space(42,85)]},
    {id:'synthwave',group:'styles',name:'Synthwave',tag:'Caldo · notturno',color:'#e69bab',tempo:'104',title:'Un impulso nella notte.',description:'Detune contenuto, chorus e inviluppo morbido per accordi, brass e lead rétro. Usa le forme classiche del Virus come punto di partenza.',steps:['Scegli una patch saw o pulse.','Applica i parametri e prova accordi aperti.','Aggiungi un basso e un arpeggio in MULTI.'],parts:['Basso in ottave','Brass / lead','Arpeggio','Pad con chorus'],writes:[...filter(78,20),...envelope(6,65,100,48),parameter(105,'Chorus mix',48),parameter(106,'Chorus rate',24),parameter(26,'Detune',8)]},
    {id:'materia',group:'characters',name:'Materia',tag:'Analogico · caldo',color:'#d7ab7e',title:'La forma prende corpo.',description:'Filtri morbidi, un leggero detune e chorus misurato. Una direzione per bassi, brass e accordi dal carattere analogico del Virus.',steps:['Scegli le forme Classic in SINGLE / WAVES.','Applica i parametri alla parte attiva.','Regola cutoff e detune ascoltando il Virus.'],writes:[...filter(74,18),...envelope(4,62,104,40),parameter(26,'Detune',7),parameter(105,'Chorus mix',24)]},
    {id:'prisma',group:'characters',name:'Prisma',tag:'FM · metallico',color:'#94bfe4',title:'Metti a fuoco le armoniche.',description:'FM e ring modulation aggiungono tensione al suono corrente. Rapporti e forme degli oscillatori determinano il risultato: parti da una patch semplice.',steps:['Scegli una patch semplice in SINGLE.','Applica i parametri, poi ascolta FM e ring modulation.','Varia gli intervalli degli oscillatori per cercare nuove armoniche.'],writes:[...filter(96,14),...envelope(2,66,64,34),parameter(27,'FM amount',44),parameter(50,'Ring mod mix',18)]},
    {id:'vetro',group:'characters',name:'Vetro',tag:'Digitale · wavetable',color:'#83cdb8',title:'Una forma, molte sfumature.',description:'Un inviluppo definito e chorus leggero lasciano spazio al dettaglio digitale. Scegli la wavetable in WAVES: queste impostazioni conservano le forme degli oscillatori.',steps:['Apri SINGLE / WAVES e scegli una wavetable.','Applica i parametri per definire inviluppo e filtro.','Esplora la forma e la sua modulazione nel Virus.'],writes:[...filter(108,22),...envelope(3,76,88,55),parameter(105,'Chorus mix',22),parameter(106,'Chorus rate',36)]},
    {id:'orizzonte',group:'characters',name:'Orizzonte',tag:'Pad · atmosfere',color:'#c0b7d9',title:'Allunga il respiro.',description:'Inviluppi lenti e spazio per trasformare la patch corrente in una tessitura sostenuta. Lascia respirare accordi semplici e intervalli lunghi.',steps:['Scegli un pad o una texture in SINGLE.','Applica i parametri e lascia terminare le code.','Apri FX RACK per dosare il riverbero.'],writes:[...filter(68,12),...envelope(90,100,112,108),parameter(105,'Chorus mix',40),...space(48,94)]}
  ];

  function validateRecipe(writes) {
    if (!Array.isArray(writes) || !writes.length) throw Error('Nessun parametro da applicare.');
    const a = new Set([26,27,50,40,42,59,60,61,63,105,106]);
    const addresses = new Set();
    for (const p of writes) {
      if (!p || !(p.page === 0x70 && a.has(p.index) || p.page === 0x6e && [2,4].includes(p.index)) ||
          !Number.isInteger(p.value) || p.value < 0 || p.value > 127) throw Error('Parametro non valido.');
      const address = `${p.page}:${p.index}`;
      if (addresses.has(address)) throw Error('Parametro duplicato.');
      addresses.add(address);
    }
    return writes;
  }

  function create(container, bridge) {
    const document = container.ownerDocument;
    let selected = paths[0], busy = false;
    // Each direction keeps its own editable draft; browsing never writes MIDI.
    const drafts = new Map(paths.map(p => [p.id, p.writes.map(v => ({...v}))]));
    const currentWrites = () => drafts.get(selected.id);
    const bank = bridge.bank;
    function readySoundsMarkup(p) {
      const sounds = bank?.programs.filter(sound=>sound.style===p.id) || [];
      if (!sounds.length) return '';
      return `<section class="vsp-ready-sounds" aria-label="Suoni pronti ${p.name}"><header><div><h4>Parti da un suono pronto.</h4><p>DIRECTIONS 01 · REV. 3 · 4 patch complete e originali</p></div><button type="button" data-vsp-action="add-sounds">Aggiungi alla libreria</button></header><div class="vsp-sound-grid">${sounds.map(sound=>`<article><div class="vsp-sound-title"><small>${sound.role}</small><strong>${sound.name}</strong></div><p>${sound.description}</p><div><button type="button" data-vsp-load="${sound.id}">Carica suono</button><button type="button" data-vsp-export="${sound.id}" aria-label="Scarica ${sound.name} in formato syx">.syx ↓</button></div></article>`).join('')}</div><p class="vsp-sound-note">Suona con la velocity e trasforma il suono con la modulation wheel. Sul Virus: manopola 1 timbro, 2 espressione, 3 spazio dove previsto. Carica sostituisce il suono della sola parte attiva. Revisione da verificare all’ascolto sul Virus.</p></section>`;
    }
    const family = p => ['materia','synthwave'].includes(p.id) ? 'analog' : ['prisma','vetro'].includes(p.id) ? 'digital' : 'studio';
    function consoleMarkup(p) {
      const groups = [['Filtro',v=>[40,42].includes(v.index)&&v.page===0x70],['Inviluppo',v=>[59,60,61,63].includes(v.index)&&v.page===0x70],['Timbro',v=>[26,27,50].includes(v.index)&&v.page===0x70],['Effetti',v=>v.page===0x6e||[105,106].includes(v.index)]];
      const writes = currentWrites();
      return `<section class="vsp-console" data-console-family="${family(p)}" aria-label="Consolle ${p.name}"><header class="vsp-console-header"><div><small>VIRUS ENGINE / SOUND SHAPING</small><h5>${p.name} <span>CONTROL</span></h5></div><button type="button" data-vsp-action="reset">Ripristina valori</button></header><div class="vsp-control-groups">${groups.map(([label,match])=> {
        const params = writes.filter(match);
        if (!params.length) return '';
        const fader = label === 'Inviluppo';
        return `<fieldset><legend>${label}</legend><div class="vsp-control-row">${params.map(v=>{
          const i=writes.indexOf(v), id='vsp-control-'+i;
          return `<label class="vsp-control ${fader?'is-fader':'is-knob'}" for="${id}"><span class="vsp-control-name">${v.name}</span><span class="vsp-control-mechanism" style="--vsp-frame-x:${Math.round(v.value/127*31)%8};--vsp-frame-y:${Math.floor(Math.round(v.value/127*31)/8)};--vsp-value:${v.value/127}"><span class="vsp-control-art" aria-hidden="true"></span><input type="range" id="${id}" data-vsp-control="${i}" min="0" max="127" step="1" value="${v.value}" aria-label="${v.name}" aria-describedby="vsp-console-note"></span><output for="${id}">${v.value}</output></label>`;
        }).join('')}</div></fieldset>`;
      }).join('')}</div><p id="vsp-console-note">Regola i controlli, poi premi Applica al suono. Valori 0–127.</p></section>`;
    }
    container.innerHTML = `<div class="hardware-chassis vsp-shell"><div class="chassis-logo">VIRUS-H PERCORSI</div><header class="vsp-intro"><h2>Trova una direzione.</h2><p>Il tuo Virus. Cinque stili, quattro caratteri da esplorare.</p></header><div class="vsp-workspace"><nav class="vsp-navigation" aria-label="Percorsi sonori">${[['styles','Stili musicali'],['characters','Caratteri sonori']].map(([group,label])=>`<section><h3>${label}</h3><div class="vsp-path-list">${paths.filter(p=>p.group===group).map(p=>`<button type="button" data-vsp-path="${p.id}" aria-pressed="false" style="--vsp-accent:${p.color}"><img class="vsp-thumbnail" src="assets/sound-paths/${p.id}.webp" alt="" loading="lazy" width="44" height="38"><span><strong>${p.name}</strong><small>${p.tag}</small></span><span class="vsp-nav-arrow" aria-hidden="true">↗</span></button>`).join('')}</div></section>`).join('')}</nav><div class="vsp-detail" id="vspDetail"></div></div></div>`;
    const detail = container.querySelector('#vspDetail');
    function refresh() {
      const context = bridge.context();
      const apply = detail.querySelector('[data-vsp-action="apply"]');
      if (!apply) return;
      apply.disabled = busy || !context.connected;
      apply.textContent = busy ? 'Invio in corso…' : `Applica al suono · ${context.label}`;
      detail.querySelector('.vsp-context').textContent = context.connected ? `MIDI OUT collegata · ${context.label}` : context.message || 'Collega un’uscita MIDI per applicare i parametri.';
      container.querySelectorAll('[data-vsp-path], [data-vsp-control], [data-vsp-action=reset], [data-vsp-action=add-sounds]').forEach(b=>{b.disabled=busy;});
      container.querySelectorAll('[data-vsp-load]').forEach(b=>{b.disabled=busy||!context.connected;b.textContent='Carica → '+context.label;});
    }
    function render() {
      const p=selected, index=paths.indexOf(p);
      detail.style.setProperty('--vsp-accent',p.color);
      container.querySelectorAll('[data-vsp-path]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.vspPath===p.id)));
      detail.innerHTML = `<div class="vsp-cover"><img class="vsp-cover-image" src="assets/sound-paths/${p.id}.webp" alt="" width="1536" height="1024"><div class="vsp-cover-top"><span>${p.group==='styles'?'STILE MUSICALE':'CARATTERE SONORO'}</span><span>VIRUS / ${String(index+1).padStart(2,'0')}</span></div><h3>${p.name}</h3><p>${p.tag}</p><div class="vsp-cover-space" aria-hidden="true"></div><div class="vsp-cover-bottom"><span>${p.title}</span>${p.tempo?`<span>${p.tempo} BPM <small>suggeriti</small></span>`:'<span>VIRUS ENGINE</span>'}</div></div><div class="vsp-recipe"><h4>Dal suono corrente alla tua direzione.</h4><p>${p.description}</p><ol class="vsp-steps">${p.steps.map(step=>`<li>${step}</li>`).join('')}</ol>${readySoundsMarkup(p)}${consoleMarkup(p)}${p.parts?`<div class="vsp-parts" aria-label="Idea per un setup a quattro parti">${p.parts.map((role,i)=>`<div><span>P${i+1}</span><strong>${role}</strong></div>`).join('')}</div><p class="vsp-plan-note">Idea di arrangiamento: assegna i suoni alle parti in MULTI.</p>`:''}<div class="vsp-actions"><button type="button" class="vsp-primary" data-vsp-action="apply">Applica al suono</button><button type="button" data-vsp-action="single">Apri SINGLE ↗</button>${p.parts?'<button type="button" data-vsp-action="multi">Apri MULTI ↗</button>':''}</div><div class="vsp-context-row"><span class="vsp-context"></span><button type="button" data-vsp-action="midi">Configura MIDI</button></div><p class="vsp-edit-note">Le modifiche si applicano solo alla parte attiva. Il risultato dipende dalla patch di partenza.</p><p class="vsp-status" role="status" aria-live="polite"></p></div>`;
      refresh();
    }
    container.addEventListener('click', async event=> {
      const path=event.target.closest('[data-vsp-path]');
      if(path && !busy) {selected=paths.find(p=>p.id===path.dataset.vspPath);render();return;}
      const exportId=event.target.closest('[data-vsp-export]')?.dataset.vspExport;
      if(exportId){bridge.exportSound(exportId);return;}
      const loadId=event.target.closest('[data-vsp-load]')?.dataset.vspLoad;
      if(loadId && !busy) {
        if(!bridge.context().connected){detail.querySelector('.vsp-status').textContent='Collega prima un’uscita MIDI.';refresh();return;}
        busy=true;refresh();
        detail.querySelector('.vsp-status').textContent='Invio del suono completo al Virus…';
        try {
          const result=await bridge.loadSound(loadId);
          const dump=bank.build(loadId);
          drafts.set(selected.id,currentWrites().map(p=>({...p,value:dump[bank.offsets[p.page]+p.index]})));
          busy=false;render();
          detail.querySelector('.vsp-status').textContent=bank.programs.find(p=>p.id===loadId).name+' inviato a '+result.label+'. Ora puoi rifinire il suono con la consolle.';
          detail.querySelector(`[data-vsp-load="${loadId}"]`).focus();
        } catch(error){detail.querySelector('.vsp-status').textContent='Invio interrotto: '+error.message;}
        finally{busy=false;refresh();}
        return;
      }
      const action=event.target.closest('[data-vsp-action]')?.dataset.vspAction;
      if (!action || busy) return;
      if(action==='single'||action==='multi'){bridge.open(action);return;}
      if(action==='midi'){bridge.configureMidi();return;}
      if(action==='add-sounds'){
        const status=detail.querySelector('.vsp-status');
        try{const added=bridge.addSounds(bank.programs.filter(p=>p.style===selected.id).map(p=>p.id));status.textContent=added?added+' suoni aggiunti alla libreria PATCH. Nessun invio MIDI.':'Questi nomi sono già in libreria. I tuoi suoni sono stati conservati.';}
        catch(error){status.textContent='Salvataggio non riuscito: '+error.message;}
        return;
      }
      if(action==='reset'){drafts.set(selected.id,selected.writes.map(v=>({...v})));render();detail.querySelector('[data-vsp-action=reset]').focus();return;}
      if(action!=='apply')return;
      const status=detail.querySelector('.vsp-status');
      if(!bridge.context().connected){status.textContent='Collega prima un’uscita MIDI.';refresh();return;}
      busy=true;refresh();status.textContent='Invio dei parametri al Virus…';
      try {
        validateRecipe(currentWrites());
        const result=await bridge.apply(currentWrites().map(p=>({...p})));
        status.textContent=`${selected.writes.length} parametri inviati · ${result.label}. Continua in SINGLE e ascolta il Virus.`;
      } catch(error) {
        status.textContent=`Invio interrotto: ${error.message} Controlla il suono corrente prima di riprovare.`;
      } finally {busy=false;refresh();}
    });
    function updateControl(input) {
      if (busy) return;
      const value = Math.max(0, Math.min(127, Math.round(Number(input.value))));
      if (!Number.isFinite(value)) return;
      const parameter = currentWrites()[Number(input.dataset.vspControl)];
      if (!parameter) return;
      parameter.value = value;
      input.value = value;
      const mechanism = input.closest('.vsp-control-mechanism');
      const frame = Math.round(value / 127 * 31);
      mechanism.style.setProperty('--vsp-frame-x', frame % 8);
      mechanism.style.setProperty('--vsp-frame-y', Math.floor(frame / 8));
      mechanism.style.setProperty('--vsp-value', value / 127);
      input.closest('label').querySelector('output').textContent = value;
      detail.querySelector('.vsp-status').textContent = '';
    }
    container.addEventListener('input', event => {
      if (event.target.matches('[data-vsp-control]')) updateControl(event.target);
    });
    // Knobs use vertical drag; native range inputs retain keyboard access.
    let drag = null;
    container.addEventListener('pointerdown', event => {
      const input = event.target.closest('.is-knob input');
      if (!input || busy || event.button !== 0) return;
      event.preventDefault();
      input.focus();
      input.setPointerCapture(event.pointerId);
      drag = {input, id:event.pointerId, y:event.clientY, value:Number(input.value)};
    });
    container.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      drag.input.value = drag.value + (drag.y - event.clientY) * (event.shiftKey ? .15 : .8);
      updateControl(drag.input);
    });
    const endDrag = event => {if (drag && event.pointerId === drag.id) drag = null;};
    container.addEventListener('pointerup', endDrag);
    container.addEventListener('pointercancel', endDrag);
    container.addEventListener('lostpointercapture', endDrag);
    container.addEventListener('dblclick', event => {
      const input = event.target.closest('[data-vsp-control]');
      if (!input || busy) return;
      input.value = selected.writes[Number(input.dataset.vspControl)].value;
      updateControl(input);
    });
    // Navigation within the recipe must not trigger the computer-keyboard piano.
    container.addEventListener('keydown',event=>event.stopPropagation());
    document.addEventListener('change',refresh);
    container.addEventListener('focusin',refresh);
    container.addEventListener('pointerenter',refresh);
    render();
    return {refresh};
  }
  const api={paths,validateRecipe,create};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.VirusSoundPaths=api;
})(typeof window!=='undefined'?window:globalThis);
