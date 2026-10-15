/* Original hardware-style panels controlling real Virus A-page parameters. */
(function(root){
  'use strict';
  const control=(id,label,index,group)=>({id,label,offset:9+index,group});
  const poly=[control('rate','RATE',79,'LFO'),control('pitch','LFO',74,'DCO'),control('pwm','PWM',76,'DCO'),control('pulse','PULSE WIDTH',23,'DCO'),control('sub','SUB',34,'DCO'),control('noise','NOISE',37,'DCO'),control('hpf','FREQ',41,'HPF'),control('cutoff','FREQ',40,'VCF'),control('resonance','RES',42,'VCF'),control('env','ENV',44,'VCF'),control('lfo','LFO',88,'VCF'),control('key','KYBD',46,'VCF'),control('level','LEVEL',91,'VCA'),control('attack','A',59,'ENV'),control('decay','D',60,'ENV'),control('sustain','S',61,'ENV'),control('release','R',63,'ENV')];
  const phase=[control('fm','FM amount',27,'TIMBRE'),control('shape1','Mod shape',17,'TIMBRE'),control('shape2','Carrier shape',22,'TIMBRE'),control('tune','Mod tune',20,'TIMBRE'),control('detune','Detune',26,'TIMBRE'),control('balance','Osc balance',33,'TIMBRE'),control('cutoff','Cutoff',40,'FILTER'),control('resonance','Resonance',42,'FILTER'),control('attack','Attack',59,'ENVELOPE'),control('decay','Decay',60,'ENVELOPE'),control('sustain','Sustain',61,'ENVELOPE'),control('release','Release',63,'ENVELOPE'),control('rate','LFO rate',79,'MOD / FX'),control('depth','LFO → filter',88,'MOD / FX'),control('chorus','Chorus mix',105,'MOD / FX'),control('delay','Delay send',113,'MOD / FX')];
  const definitions={poly:{name:'FORMA / P',subtitle:'POLYPHONIC SYNTHESIZER',base:'velvet-air',controls:poly},phase:{name:'PRISMA / D',subtitle:'DIGITAL MODULATION SYNTHESIZER',base:'dew-keys',controls:phase}};
  const allowed=new Set([...poly,...phase].map(c=>c.offset).concat([9+91,9+105,9+106,9+107,9+20,9+25,9+33,9+22]));
  function apply(bytes,edits,mode){
    const result=Uint8Array.from(bytes);
    for(const [offset,value] of Object.entries(edits)){
      if(!allowed.has(Number(offset))||!Number.isInteger(value)||value<0||value>127)throw Error('Parametro dello strumento non valido.');
      result[Number(offset)]=value;
      // The poly panel shares one envelope between filter and amplifier.
      const linked={68:63,69:64,70:65,72:67};
      if(mode==='poly'&&linked[offset])result[linked[offset]]=value;
      if(mode==='poly'&&Number(offset)===83)result[84]=value; // LFO pitch on both oscillators.
      if(mode==='poly'&&Number(offset)===88)result[76]=value; // Shared LFO rate.
      if(mode==='poly'&&Number(offset)===50){result[61]=1;result[62]=1;result[169]=0;} // Independent serial HPF.
      if(mode==='poly'&&Number(offset)===29)result[34]=value; // DCO octave on both oscillators.
    }
    return result;
  }
  function chorus(mode){
    if(![0,1,2].includes(mode))throw Error('Chorus non valido.');
    return {[114]:mode===0?0:mode===1?48:60,...(mode?{[115]:mode===1?22:35,[116]:mode===1?33:48}:{})};
  }
  function render(mode,bytes,active='fm',options={}){
    const d=definitions[mode];if(!d)return '';
    const slider=c=>`<label class="vsi-fader"><span>${c.label}</span><input type="range" min="0" max="127" value="${bytes[c.offset]}" data-instrument-param="${c.offset}" aria-label="${d.name} · ${mode==='poly'?c.group+' · ':''}${c.label}" style="--level:${bytes[c.offset]/127*100}%"><output data-instrument-output="${c.offset}">${bytes[c.offset]}</output></label>`;
    const branding=`<header class="vsi-brand"><div><small>VIRUS-H INSTRUMENTS</small><h3>${d.name}</h3></div><span>${d.subtitle}</span></header>`;
    if(mode==='poly'){
      const escape=text=>String(text||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      const choices=options.presets||[],selectedIndex=choices.findIndex(p=>p.id===options.id);
      const group=key=>`<fieldset class="vsi-poly-${key.toLowerCase()}"><legend>${key}</legend><div>${poly.filter(c=>c.group===key).map(slider).join('')}</div></fieldset>`;
      const wave=bytes[42]<16?'saw':bytes[42]>111?'pulse':'both';
      const switches=`<div class="vsi-dco-switches"><div><small>RANGE</small><div>${[[52,"16′"],[64,"8′"],[76,"4′"]].map(([v,label])=>`<button type="button" data-instrument-switch="octave:${v}" aria-pressed="${bytes[29]===v}">${label}</button>`).join('')}</div></div><div><small>WAVEFORM</small><div>${[['saw','SAW'],['pulse','PULSE'],['both','BOTH']].map(([v,label])=>`<button type="button" data-instrument-switch="wave:${v}" aria-pressed="${wave===v}">${label}</button>`).join('')}</div></div></div>`;
      const keyNames=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];let white=0;
      const keys=Array.from({length:61},(_,i)=>{const n=i+36,black=[1,3,6,8,10].includes(n%12),position=black?white-.31:white++;return `<button type="button" class="vxd-key ${black?'black':'white'}" style="left:${position/36*100}%;width:${(black?.62:1)/36*100}%" data-studio-note="${n}" aria-label="FORMA / P · ${keyNames[n%12]}${Math.floor(n/12)-1}"></button>`;}).join('');
      return `<section class="vsi-panel vsi-poly" aria-label="FORMA / P · pannello polifonico"><header class="vsi-poly-brand"><div><small>VIRUS-H INSTRUMENTS</small><span>PROGRAMMABLE POLYPHONIC SYNTHESIZER</span></div><h3>FORMA / P</h3></header><div class="vsi-poly-controls">${group('LFO')}<div class="vsi-dco-unit">${group('DCO')}${switches}</div>${group('HPF')}${group('VCF')}${group('VCA')}${group('ENV')}<fieldset class="vsi-chorus"><legend>CHORUS</legend><div>${[0,1,2].map((v,i)=>`<button type="button" data-instrument-chorus="${v}" aria-pressed="${bytes[114]===0?v===0:v===(bytes[115]<29?1:2)}"><i></i>${['OFF','I','II'][i]}</button>`).join('')}</div><small>STEREO</small></fieldset></div><div class="vsi-program-strip"><div class="vsi-program-display"><small>PATCH</small><output>${selectedIndex>=0?String(selectedIndex+1).padStart(2,'0'):'--'}</output><span>${escape(options.name||'MANUAL')}</span></div><label>SUONO<select data-instrument-preset aria-label="Suono FORMA / P">${choices.map(p=>`<option value="${escape(p.id)}" ${options.id===p.id?'selected':''}>${escape(p.name)}</option>`).join('')}</select></label><button type="button" data-studio-action="load">CARICA</button><button type="button" data-studio-action="save">SALVA</button><button type="button" data-studio-action="forma-bank">BANCO .MID</button></div><div class="vsi-poly-playbar"><button type="button" data-studio-action="mac">Tastiera Mac · A–L</button><span>CLASSIC STUDIES · INTERPRETAZIONI PER VIRUS</span><button type="button" data-studio-action="preview-note">Prova nota</button></div><div class="vsi-poly-keyboard"><img class="vsi-keyboard" src="assets/studio-instruments/keyboard-poly.webp" alt=""><div class="vxd-key-overlay" aria-label="Tastiera FORMA / P">${keys}</div></div></section>`;
    }
    const selected=phase.find(c=>c.id===active)||phase[0];
    return `<section class="vsi-panel vsi-phase" aria-label="PRISMA / D · pannello digitale">${branding}<div class="vsi-dx-face"><fieldset class="vsi-data-entry"><legend>LEVEL / DATA</legend><div>${slider(control('volume','Volume',91,'LEVEL'))}${slider(selected)}</div></fieldset><div class="vsi-display-unit"><span class="vsi-display-caption">PARAMETER / VALUE</span><div class="vsi-display-recess"><output class="vsi-param-number">${String(phase.indexOf(selected)+1).padStart(2,'0')}</output><div class="vsi-lcd" aria-live="polite"><small>EDIT / VIRUS</small><div><span data-instrument-lcd-label>${selected.label}</span><strong data-instrument-lcd-value>${bytes[selected.offset]}</strong></div><span class="vsi-lcd-bar" style="--level:${bytes[selected.offset]/127*100}%"></span></div></div><div class="vsi-edit-modes">${[['fm','TONE'],['attack','ENV'],['chorus','FX']].map(([id,label])=>`<button type="button" data-instrument-edit="${id}">${label}</button>`).join('')}</div></div><div class="vsi-dx-matrix"><div class="vsi-printed-flow" aria-hidden="true"><span>OSC 1<br>↓ FM<br>OSC 2 → FILTER → AMP</span><span>ENVELOPE<br>╱╲____<br>ATTACK / DECAY / SUSTAIN / RELEASE</span></div><div class="vsi-parameter-grid">${phase.map(c=>`<button type="button" data-instrument-edit="${c.id}" aria-pressed="${selected.id===c.id}"><small>${String(phase.indexOf(c)+1).padStart(2,'0')}</small><span>${c.label}</span><output data-instrument-output="${c.offset}">${bytes[c.offset]}</output></button>`).join('')}</div></div></div><footer><span>FM DEL VIRUS · DUE OSCILLATORI, FILTRO ED EFFETTI</span><span>POWERED BY VIRUS</span></footer><img class="vsi-keyboard" src="assets/studio-instruments/keyboard-phase.webp" alt="Tastiera dello strumento"></section>`;
  }
  function presets(bank){
    const voices=[
      ['forma-cloud','Cloud Ensemble','poly','velvet-air','Pad',{17:64,22:127,26:4,34:16,40:76,42:12,59:55,60:96,61:110,63:79,105:48,106:22,107:33}],
      ['forma-brass','Soft Brass','poly','after-keys','Keys',{17:64,22:64,26:3,40:52,44:54,54:9,55:62,56:28,59:8,60:70,61:82,63:32,105:35}],
      ['forma-bass','Round Sub','poly','night-drive','Basso',{17:64,22:64,26:2,34:44,40:40,42:18,44:60,59:0,60:58,61:94,63:15,105:0}],
      ['forma-pluck','Chorus Pluck','poly','glass-run','Pluck',{17:127,22:64,26:3,40:65,44:50,59:0,60:55,61:0,63:30,105:48,106:22,107:33}],
      ['prisma-keys','Electric Tines','phase','dew-keys','Keys',{17:0,19:0,22:0,24:0,20:83,25:64,26:1,27:34,33:127,40:110,59:0,60:84,61:0,63:55,105:17}],
      ['prisma-bell','Copper Bell','phase','dew-keys','Keys',{17:0,19:0,22:0,24:0,20:92,25:64,26:1,27:58,33:127,40:118,59:0,60:98,61:0,63:87,105:0}],
      ['prisma-bass','Wire Bass','phase','orbit-sub','Basso',{17:0,19:0,22:0,24:0,20:76,25:64,26:0,27:42,33:127,40:92,59:0,60:62,61:38,63:12,105:0}],
      ['prisma-mallet','Crystal Mallet','phase','neon-seed','Pluck',{17:0,19:0,22:0,24:0,20:88,25:64,26:1,27:45,33:127,40:108,59:0,60:57,61:0,63:43,105:12}]
    ];
    const pack=typeof module!=='undefined'&&module.exports?require('./forma-bank'):root.VirusFormaBank;
    const basePresets=voices.map(([id,name,instrument,base,role,a])=>{
      const bytes=instrument==='poly'&&pack?pack.build(bank,{name,a}):bank.buildBase(base);for(const [index,value] of Object.entries({91:100,...a}))bytes[9+Number(index)]=value;
      return {id:'instrument:'+id,name,instrument,role,style:instrument==='poly'?'synthwave':'ambient',description:instrument==='poly'?'Oscillatori, sub e chorus stereo.':'Sine, modulazione FM e inviluppo percussivo.',origin:'factory',tags:[instrument==='poly'?'Polifonico':'Digitale',role],bytes:Array.from(bytes)};
    });
    return [...basePresets,...(pack?.presets(bank)||[])];
  }
  function switches(key,value){if(key==='octave'&&[52,64,76].includes(Number(value)))return {[29]:Number(value)};if(key==='wave'&&['saw','pulse','both'].includes(value))return {[26]:64,[31]:127,[42]:value==='saw'?0:value==='pulse'?127:64};throw Error('Selettore FORMA / P non valido.');}
  const api={definitions,apply,chorus,switches,render,presets};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VirusStudioInstruments=api;
})(typeof window!=='undefined'?window:globalThis);
