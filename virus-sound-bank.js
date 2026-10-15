/* VIRUS-H Directions 01: original sound design, no imported preset data.
 * TI wire format has an intermediate checksum between pages B and E.
 * Protocol references and listening status: docs/original-sound-bank.md. */
(function(root) {
  'use strict';
  const programs = [
    {id:'pulse-root',style:'trance',role:'Basso',name:'PulseRoot',description:'Due saw, sub e inviluppo corto per un basso pulsante.',a:{20:52,25:52,26:9,34:34,40:48,42:18,44:60,55:43,59:0,60:58,61:92,63:14,94:1}},
    {id:'skyline',style:'trance',role:'Lead',name:'Skyline',description:'HyperSaw aperta, detune e delay stereo per melodie ampie.',a:{17:92,18:42,22:64,23:34,26:14,40:96,42:14,44:22,55:70,59:3,60:82,61:110,63:43,91:71,105:22,113:24,114:65,115:34},e:{2:20,3:3,4:66,30:1,35:1}},
    {id:'ion-cloud',style:'trance',role:'Pad',name:'IonCloud',description:'Saw sovrapposte, attacco morbido e movimento lento del filtro.',a:{26:20,40:80,42:14,44:20,54:65,55:90,56:70,59:62,60:100,61:112,63:88,79:22,88:70,91:67,105:35},e:{2:30,3:3,4:83},f:{120:1,121:24,122:95}},
    {id:'glass-run',style:'trance',role:'Pluck',name:'GlassRun',description:'Attacco brillante e coda breve, con eco leggero.',a:{17:105,22:64,26:8,40:58,42:28,44:70,55:39,56:0,59:0,60:52,61:0,63:30,113:21,114:60,115:29},e:{2:17,3:1,4:47}},
    {id:'orbit-sub',style:'psytrance',role:'Basso',name:'OrbitSub',description:'Fondamentale compatta, attacco netto e rilascio minimo.',a:{20:52,25:52,26:3,33:38,34:28,40:40,42:12,44:66,55:30,56:0,59:0,60:42,61:78,63:5,94:1},b:{35:32,36:28}},
    {id:'acid-trail',style:'psytrance',role:'Lead',name:'AcidTrail',description:'Pulse risonante con FM moderata e inviluppo incisivo.',a:{17:112,18:36,22:64,25:76,26:8,27:26,40:50,42:64,44:55,55:45,56:22,59:0,60:55,61:82,63:17,91:70,94:1,113:16,115:22},e:{2:10,4:42}},
    {id:'spore-mist',style:'psytrance',role:'Pad',name:'SporeMist',description:'Texture scura con rumore discreto e modulazione del filtro.',a:{17:95,22:64,26:15,37:9,40:66,42:35,44:25,54:66,55:92,56:70,59:72,60:96,61:108,63:83,79:31,88:73,91:65,105:28},e:{2:30,3:3,4:80}},
    {id:'neon-seed',style:'psytrance',role:'Pluck',name:'NeonSeed',description:'Pluck metallico: FM, ottava superiore e filtro veloce.',a:{17:0,19:0,22:64,25:76,27:35,33:48,40:70,42:26,44:42,55:26,56:0,59:0,60:37,61:0,63:19,91:73,113:14,115:20},e:{2:12,4:42}},
    {id:'iron-pulse',style:'techno',role:'Basso',name:'IronPulse',description:'Saw bassa, filtro chiuso e sub per note secche.',a:{20:52,25:52,26:6,34:38,40:37,42:24,44:44,55:38,56:0,59:0,60:54,61:96,63:11,94:1},b:{36:22}},
    {id:'flux-wire',style:'techno',role:'Lead',name:'FluxWire',description:'Intervallo di quinta, FM e risonanza per linee tese.',a:{17:64,22:95,25:71,26:11,27:22,40:56,42:48,44:33,55:58,56:20,59:1,60:65,61:96,63:25,91:71,94:1,113:13,115:20}},
    {id:'smoke-room',style:'techno',role:'Pad',name:'SmokeRoom',description:'Accordi ombrosi e lenti, chorus contenuto e riverbero corto.',a:{17:127,18:38,22:64,26:16,40:48,42:20,44:13,54:70,55:88,56:64,59:53,60:96,61:102,63:76,79:17,88:69,91:68,105:24},e:{2:23,3:2,4:62}},
    {id:'steel-stab',style:'techno',role:'Keys',name:'SteelStab',description:'Stab asciutto con due saw e decadimento marcato.',a:{26:13,40:45,42:30,44:65,55:35,56:0,59:0,60:48,61:0,63:20,91:76,105:12},e:{2:12,3:1,4:39}},
    {id:'deep-tide',style:'ambient',role:'Basso',name:'DeepTide',description:'Sine e saw filtrata, attacco progressivo e coda morbida.',a:{17:0,19:0,20:52,25:52,26:5,33:32,40:43,42:8,44:12,54:52,55:80,56:65,59:32,60:90,61:112,63:67,91:77},e:{2:17,3:2,4:72}},
    {id:'halo-line',style:'ambient',role:'Lead',name:'HaloLine',description:'Linea rotonda e sospesa, con eco e spazio ampio.',a:{17:0,19:1,22:64,26:7,33:42,40:86,42:12,59:21,60:85,61:96,63:75,91:73,94:1,105:20,113:24,114:88,115:43},e:{2:35,3:3,4:88}},
    {id:'slow-bloom',style:'ambient',role:'Pad',name:'SlowBloom',description:'Pad HyperSaw lento, filtro in movimento e riverbero esteso.',a:{17:82,18:40,22:71,23:35,26:17,40:73,42:15,44:28,54:95,55:104,56:82,59:88,60:105,61:114,63:104,79:14,88:72,91:64,105:27},e:{2:40,3:3,4:99,30:1,35:1}},
    {id:'dew-keys',style:'ambient',role:'Keys',name:'DewKeys',description:'Timbro percussivo di sine e FM, con decadimento lungo.',a:{17:0,19:0,22:0,24:0,25:83,26:2,27:30,40:99,42:7,59:2,60:83,61:0,63:61,91:76,105:15,113:18,114:78,115:30},e:{2:32,3:3,4:85}},
    {id:'night-drive',style:'synthwave',role:'Basso',name:'NightDrive',description:'Basso saw e pulse, sub presente e filtro elastico.',a:{17:64,20:52,22:127,23:38,25:52,26:7,34:28,40:43,42:18,44:53,55:49,56:10,59:0,60:64,61:98,63:19,94:1}},
    {id:'rose-lead',style:'synthwave',role:'Lead',name:'RoseLead',description:'Due saw con portamento leggero, chorus ed eco.',a:{5:12,26:10,40:84,42:16,44:20,55:68,56:30,59:4,60:84,61:107,63:39,91:72,94:1,105:36,106:23,113:19,114:66,115:26},e:{2:18,3:2,4:59}},
    {id:'velvet-air',style:'synthwave',role:'Pad',name:'VelvetAir',description:'Pulse e saw, chorus largo e inviluppo vellutato.',a:{17:127,18:42,22:64,26:12,40:70,42:12,44:19,54:58,55:87,56:73,59:57,60:98,61:112,63:80,79:18,88:68,91:67,105:48,106:22,107:33},e:{2:27,3:3,4:78}},
    {id:'after-keys',style:'synthwave',role:'Keys',name:'AfterKeys',description:'Accordi brass con attacco morbido e filtro che si richiude.',a:{17:64,22:127,23:46,26:9,40:53,42:16,44:46,54:8,55:61,56:24,59:6,60:72,61:75,63:41,91:74,105:33,106:27},e:{2:18,3:2,4:57}}
  ];
  // Original revision 2 designs. Values are authored here; no commercial dump
  // is used at build time. Routes describe performance rather than fixed FX.
  const designs = {
    'pulse-root': {a:{33:56,49:1,53:1,76:68,91:102,103:0,105:0},b:{35:24,36:25,49:80,95:68,96:60},e:{2:0,26:6},wheel:22,touch:9,velocity:14,tone:18,space:0,motion:[26,34,-7]},
    'skyline': {a:{49:1,53:1,74:65,75:63,91:91,103:3,105:28,112:2,113:32,115:35},b:{49:79,95:60,96:70},e:{2:25,26:5},f:{120:1,121:18,122:90},wheel:15,touch:25,velocity:11,tone:15,space:15,motion:[38,20,-12],env3:[0,66,0,64,44]},
    'ion-cloud': {a:{53:2,76:75,79:17,88:67,90:69,91:89,103:2,105:39,112:2,113:20,115:29},b:{49:76,95:61,96:68},e:{2:34,26:1},f:{120:1,121:15,122:85},wheel:17,touch:14,velocity:8,tone:13,space:17,motion:[38,20,16],env3:[90,108,96,64,90]},
    'glass-run': {a:{17:0,19:2,22:64,27:18,30:83,53:1,91:100,103:1,105:13,112:2,113:27,115:31},b:{34:1,49:80,50:73,95:60,96:69},e:{2:21,26:2},wheel:19,touch:12,velocity:22,tone:15,space:18,motion:[24,16,12]},
    'orbit-sub': {a:{17:0,19:0,22:64,33:41,49:1,53:1,91:104,103:0,105:0,113:0},b:{35:1,36:37,49:76,95:66,96:60},e:{2:0,26:6},wheel:16,touch:6,velocity:8,tone:12,space:0,motion:[26,34,-8]},
    'acid-trail': {a:{49:3,53:1,67:48,76:72,91:98,103:0,105:0,112:2,113:21,115:24},b:{34:1,49:81,100:2,101:13,95:60,96:67},e:{2:12,26:5},wheel:25,touch:19,velocity:15,tone:22,space:12,motion:[38,16,13],env3:[0,27,0,64,20]},
    'spore-mist': {a:{49:1,53:3,76:72,79:24,88:70,90:71,91:92,103:4,105:28,112:2,113:23,115:37},b:{49:73,85:12,95:59,96:65},e:{2:32,26:7},f:{120:1,121:12,122:64},wheel:18,touch:14,velocity:9,tone:16,space:19,motion:[38,23,12],env3:[76,102,74,64,89]},
    'neon-seed': {a:{22:0,24:0,33:105,30:87,49:1,53:1,91:101,103:1,105:9,112:2,113:19,115:24},b:{34:1,49:78,50:80,95:59,96:69},e:{2:15,26:2},wheel:20,touch:11,velocity:18,tone:18,space:14,motion:[24,18,15]},
    'iron-pulse': {a:{49:3,53:1,91:101,103:0,105:0,113:0},b:{35:8,36:32,49:75,100:2,101:10,95:68,96:58},e:{2:0,26:6},wheel:19,touch:8,velocity:10,tone:17,space:0,motion:[26,34,-9]},
    'flux-wire': {a:{30:76,49:2,53:2,76:69,91:97,103:0,105:0,112:3,113:22,115:29},b:{34:1,49:78,85:10,95:60,96:66},e:{2:8,26:3},wheel:21,touch:17,velocity:13,tone:21,space:13,motion:[24,16,11]},
    'smoke-room': {a:{49:1,53:0,76:77,90:68,91:94,103:2,105:30,112:1,113:11,115:19},b:{49:74,95:60,96:58},e:{2:24,26:1},wheel:14,touch:11,velocity:8,tone:12,space:13,motion:[38,24,-10],env3:[81,104,94,64,82]},
    'steel-stab': {a:{49:2,53:2,91:100,103:2,105:18,112:2,113:15,115:23},b:{49:84,95:60,92:68,96:66},e:{2:13,26:3},f:{120:1,121:9,122:48},wheel:18,touch:13,velocity:21,tone:14,space:12,motion:[26,42,-12]},
    'deep-tide': {a:{49:1,53:1,91:102,103:0,105:0,112:1,113:0},b:{49:73,95:66,96:58},e:{2:15,26:1},wheel:12,touch:8,velocity:6,tone:12,space:9,motion:[38,24,9],env3:[64,100,90,64,77]},
    'halo-line': {a:{53:2,74:65,75:63,91:98,103:4,105:25,112:3,113:30,115:40},b:{49:76,95:60,96:67},e:{2:38,26:2},wheel:13,touch:19,velocity:10,tone:14,space:17,motion:[38,20,12],env3:[58,96,80,64,85]},
    'slow-bloom': {a:{53:2,79:13,88:69,90:70,91:88,103:3,105:32,112:2,113:26,115:42},b:{49:74,95:59,96:66},e:{2:40,26:4},f:{120:1,121:10,122:82},wheel:15,touch:12,velocity:7,tone:12,space:17,motion:[38,20,19],env3:[106,116,101,64,110]},
    'dew-keys': {a:{20:83,25:64,33:119,27:19,30:86,53:1,91:100,103:4,105:20,112:2,113:23,115:31},b:{34:1,49:76,50:79,95:61,96:68},e:{2:34,26:2},wheel:13,touch:11,velocity:18,tone:15,space:15,motion:[24,18,11]},
    'night-drive': {a:{49:2,53:1,67:28,76:72,91:103,103:0,105:0,113:0},b:{35:16,36:21,49:78,95:68,96:61},e:{2:0,26:2},wheel:22,touch:8,velocity:13,tone:17,space:0,motion:[26,34,-6]},
    'rose-lead': {a:{49:1,53:2,74:65,75:63,91:98,103:2,105:39,112:2,113:24,115:29},b:{49:80,95:61,96:68},e:{2:20,26:2},f:{120:1,121:9,122:45},wheel:19,touch:23,velocity:12,tone:14,space:14,motion:[26,42,-7]},
    'velvet-air': {a:{49:1,53:1,67:21,76:78,90:68,91:92,103:2,105:51,112:2,113:14,115:25},b:{49:78,95:61,96:67},e:{2:25,26:1},f:{120:1,121:7,122:67},wheel:17,touch:13,velocity:9,tone:13,space:13,motion:[38,20,11],env3:[68,98,93,64,84]},
    'after-keys': {a:{49:1,53:2,76:69,91:99,103:2,105:35,112:1,113:12,115:18},b:{49:84,60:77,95:62,92:67,96:67},e:{2:18,26:2},wheel:23,touch:17,velocity:21,tone:17,space:12,motion:[26,42,-9]}
  };
  // Revision 3: independently authored performance shapes. Study references:
  // docs/sound-design/online-reference-banks.md. No reference bank is bundled.
  const gestures={
    'pulse-root':[[24,20],[28,12],[89,8]], 'skyline':[[24,14],[58,11],[42,-7]],
    'ion-cloud':[[32,18],[40,9],[24,11]], 'glass-run':[[40,24],[35,17],[42,-10]],
    'orbit-sub':[[24,15],[28,10],[89,12]], 'acid-trail':[[24,22],[26,9],[18,13]],
    'spore-mist':[[6,19],[32,13],[23,7]], 'neon-seed':[[18,17],[40,13],[42,-9]],
    'iron-pulse':[[24,18],[95,11],[89,10]], 'flux-wire':[[25,22],[27,7],[58,9]],
    'smoke-room':[[24,12],[35,17],[40,12]], 'steel-stab':[[40,24],[35,18],[42,-11]],
    'deep-tide':[[24,10],[28,8],[40,7]], 'halo-line':[[24,11],[58,12],[67,9]],
    'slow-bloom':[[6,17],[32,14],[72,9]], 'dew-keys':[[18,13],[40,17],[42,-9]],
    'night-drive':[[24,20],[28,13],[89,7]], 'rose-lead':[[24,17],[58,14],[42,-6]],
    'velvet-air':[[24,14],[35,12],[40,10]], 'after-keys':[[28,18],[40,17],[42,-8]]
  };
  const refinements={
    'pulse-root':{a:{55:37,58:20,60:72,63:12},b:{100:1,101:8}},
    'skyline':{a:{55:52,58:48,60:108,61:116},f:{120:0}},
    'ion-cloud':{a:{54:79,55:104,56:88,58:86},e:{80:84,81:112}},
    'glass-run':{a:{17:28,19:2,55:34,58:43},e:{30:2}},
    'orbit-sub':{a:{55:26,58:10,60:55,61:104},b:{100:2,101:12}},
    'acid-trail':{a:{30:78,55:36,58:29},b:{36:21}},
    'spore-mist':{a:{17:49,19:16,54:83,55:110},e:{30:3}},
    'neon-seed':{a:{30:92,55:21,58:24,60:44},b:{36:19}},
    'iron-pulse':{a:{55:29,58:14,60:68},b:{101:16}},
    'flux-wire':{a:{55:43,56:11,58:37},b:{100:1,101:10}},
    'smoke-room':{a:{54:84,55:107,56:85,58:88},b:{85:8}},
    'steel-stab':{a:{55:29,58:28,60:63,61:7},f:{120:0}},
    'deep-tide':{a:{54:67,55:100,56:92,58:80},b:{49:75}},
    'halo-line':{a:{54:42,55:96,56:75,58:83},b:{13:24}},
    'slow-bloom':{a:{17:35,19:1,54:104,55:115,56:91},e:{30:2,35:1}},
    'dew-keys':{a:{55:54,56:0,58:84,60:94,63:68},b:{50:82}},
    'night-drive':{a:{55:38,58:19,60:81},b:{100:2,101:7}},
    'rose-lead':{a:{55:76,56:43,58:58},b:{13:17}},
    'velvet-air':{a:{54:71,55:103,56:91,58:83},b:{49:80}},
    'after-keys':{a:{54:11,55:72,56:35,58:51,60:83},b:{49:87}}
  };
  for(const p of programs){const d=designs[p.id];for(const page of ['a','b','e','f'])d[page]={...d[page],...refinements[p.id][page]};}
  const descriptions={
    'glass-run':'Pluck wavetable e FM dinamica; la wheel allunga il corpo della nota.',
    'spore-mist':'Wave PWM, rumore e filtri separati per una texture in evoluzione.',
    'slow-bloom':'Wavetable e HyperSaw con apertura lenta e movimento di bilanciamento.',
    'steel-stab':'Stab senza unison: inviluppi articolati, saturazione e wheel da corto a sostenuto.'
  };
  programs.forEach(p=>{p.revision=3;if(descriptions[p.id])p.description=descriptions[p.id];for(const page of ['a','b','e','f'])if(p[page])Object.freeze(p[page]);Object.freeze(p);});
  Object.freeze(programs);
  const offsets = {0x70:9,0x71:137,0x6e:266,0x6f:394};
  const sum = (bytes,start,end) => {let n=0;for(let i=start;i<end;i++)n+=bytes[i];return n&127;};
  function checksum(bytes) {
    if(bytes.length===524)bytes[265]=sum(bytes,5,265);
    bytes[bytes.length-2]=sum(bytes,5,bytes.length-2);
    return bytes;
  }
  function buildProgram(id, enhanced) {
    const program=programs.find(p=>p.id===id);
    if(!program)throw Error('Suono originale non trovato.');
    // All four pages start deterministic. Explicit centers prevent accidental
    // modulation, pitch offsets, input/vocoder routing or effect feedback.
    const data=new Uint8Array(512);
    function put(page,values) {for(const [key,value] of Object.entries(values)) {
      const index=Number(key);
      if(!Number.isInteger(index)||index<0||index>127||!Number.isInteger(value)||value<0||value>127)throw Error('Parametro del suono non valido.');
      data[page*128+index]=value;
    }}
    put(0,{0:12,6:64,7:127,10:64,11:127,17:64,18:48,20:64,21:96,22:64,23:48,25:64,26:8,29:64,30:64,31:96,33:64,36:64,39:64,40:90,41:64,43:0,46:64,47:64,48:64,51:0,52:0,53:0,55:58,57:0,58:35,59:0,60:75,61:100,62:0,63:28,67:38,68:1,71:64,74:64,75:64,76:64,77:64,78:64,79:28,80:0,83:64,86:64,87:64,88:64,89:64,90:64,91:78,93:64,106:30,107:24,108:50,109:64,110:1,111:64,112:1,114:65,116:14,117:8,118:1,119:64});
    put(1,{2:1,5:64,7:50,8:1,11:1,16:{trance:73,psytrance:82,techno:67,ambient:17,synthwave:41}[program.style],17:4,25:1,26:66,27:62,28:1,30:1,31:1,32:1,33:60,36:12,42:64,43:64,44:32,45:40,46:92,47:64,48:64,49:64,50:64,54:64,55:64,56:64,57:64,60:80,61:64,64:3,65:24,66:83,69:64,71:64,74:64,76:64,78:64,80:64,82:64,84:3,86:26,87:62,88:64,89:64,90:100,92:64,93:75,94:38,95:64,96:64,98:32,105:64,108:64,111:64,122:2});
    put(2,{1:1,3:2,4:60,5:25,6:64,7:12,9:64,10:1,12:3,13:4,14:2,17:80,22:64,25:64,42:64,62:64,71:110,72:127,73:127,74:64,80:20,81:70,84:70,85:20,86:70,89:70,91:64,93:64,95:64,97:64,99:64,101:64,103:64,105:64,107:64,122:1,123:1,124:1,127:31});
    put(3,{121:28,122:100,123:64,125:1});
    for(let step=0;step<32;step++)put(3,{[step*3]:64,[step*3+1]:96,[step*3+2]:1});
    ['a','b','e','f'].forEach((page,i)=>put(i,program[page]||{}));
    if(enhanced) {
      const design=designs[id];
      ['a','b','e','f'].forEach((page,i)=>put(i,design[page]||{}));
      // Six independent slots; reset legacy routes before assigning new ones.
      // Each tuple is page, destination index, amount index (E continues B).
      const slots=[{s:64,d:[[1,65,66],[2,90,91],[2,92,93]]},{s:67,d:[[1,68,69],[1,70,71],[2,94,95]]},{s:72,d:[[1,73,74],[1,75,76],[1,77,78]]},{s:103,d:[[1,104,105],[2,96,97],[2,98,99]]},{s:106,d:[[1,107,108],[2,100,101],[2,102,103]]},{s:109,d:[[1,110,111],[2,104,105],[2,106,107]]}];
      const route=(slot,source,targets)=>{
        put(1,{[slot.s]:source});
        slot.d.forEach(([page,dest,amount],i)=>put(page,{[dest]:targets[i]?.[0]||0,[amount]:64+(targets[i]?.[1]||0)}));
      };
      route(slots[0],3,gestures[id]); // patch-specific performance, not a universal cutoff macro
      route(slots[1],24,[[28,design.velocity],[34,-Math.round(design.velocity/3)]]); // touch articulation
      route(slots[2],2,[[58,design.touch]]); // pressure: vibrato depth
      route(slots[3],design.motion[0],[[design.motion[1],design.motion[2]]]);
      route(slots[4],11,[[24,design.tone],[26,Math.round(design.tone/4)]]); // soft knob 1: timbre
      route(slots[5],design.space?13:0,design.space?[[67,design.space],[72,Math.round(design.space*.7)]]:[]);
      put(1,{7:83,11:1,12:0,62:9,63:1}); // LFO3 > pitch; knobs: Control12 / wheel
      put(2,{28:design.space?11:0}); // third knob: Control14, unused on dry basses
      if(design.env3)put(2,Object.fromEntries(design.env3.map((v,i)=>[80+i,v])));
    }
    const name=program.name.padEnd(10,' ');
    for(let i=0;i<10;i++)data[240+i]=name.charCodeAt(i);
    const bytes=new Uint8Array(524);
    bytes.set([0xf0,0,0x20,0x33,1,0x10,0x10,0,0x40]);
    bytes.set(data.subarray(0,256),9);
    bytes.set(data.subarray(256),266);
    bytes[523]=0xf7;
    return checksum(bytes);
  }
  function build(id) {return buildProgram(id,true);}
  // Isolated foundation for other instruments; Percorsi revisions must not
  // leak new matrix routes or processing into FORMA / P and PRISMA presets.
  function buildBase(id) {return buildProgram(id,false);}
  function bankBytes() {
    const bank=new Uint8Array(programs.length*524);
    programs.forEach((p,i)=>bank.set(build(p.id),i*524));
    return bank;
  }
  function variableLength(value) {
    const result=[value&127];
    while((value=Math.floor(value/128))>0)result.unshift((value&127)|128);
    return result;
  }
  function midiBytes(ids=programs.map(p=>p.id)) {
    if(!ids.length)throw Error('Nessun suono da esportare.');
    return midiFromDumps(ids.map(build));
  }
  function midiFromDumps(dumps,titleText='VIRUS-H Directions 01') {
    if(!dumps.length)throw Error('Nessun suono da esportare.');
    // SMF type 0, 480 PPQN, 120 BPM. Half a second separates dumps,
    // including over a traditional 31.25 kbit/s MIDI connection.
    const track=[0,255,81,3,7,161,32];
    const title=Array.from(String(titleText).normalize('NFKD').replace(/[^\x20-\x7e]/g,'').slice(0,80),c=>c.charCodeAt(0));
    track.push(0,255,3,...variableLength(title.length),...title);
    dumps.forEach((dump,i)=>{
      const bytes=Uint8Array.from(dump);
      if(![267,524].includes(bytes.length)||bytes[0]!==240||bytes.at(-1)!==247)throw Error('Patch da esportare non valida.');
      const payload=bytes.subarray(1);
      track.push(...variableLength(i?480:0),240,...variableLength(payload.length),...payload);
    });
    track.push(...variableLength(480),255,47,0);
    const size=track.length;
    return new Uint8Array([77,84,104,100,0,0,0,6,0,0,0,1,1,224,
      77,84,114,107,(size>>>24)&255,(size>>>16)&255,(size>>>8)&255,size&255,...track]);
  }
  function extractSysEx(input) {
    const bytes=new Uint8Array(input),messages=[];
    const invalid=()=>{throw Error('File MIDI/SysEx incompleto o non valido.');};
    const tag=(at)=>String.fromCharCode(...bytes.slice(at,at+4));
    const u32=at=>bytes[at]*16777216+bytes[at+1]*65536+bytes[at+2]*256+bytes[at+3];
    function raw(data) {
      let start=-1;
      for(let i=0;i<data.length;i++){
        if(data[i]===240){if(start>=0)invalid();start=i;}
        else if(data[i]===247&&start>=0){messages.push(data.slice(start,i+1));start=-1;}
      }
      if(start>=0)invalid();
    }
    if(tag(0)!=='MThd'){raw(bytes);return messages;}
    if(bytes.length<14)invalid();
    const headerLength=u32(4),tracks=bytes[10]*256+bytes[11];
    if(headerLength<6||8+headerLength>bytes.length||bytes[8]!==0||bytes[9]>2||!tracks)invalid();
    let chunk=8+headerLength,found=0;
    while(chunk<bytes.length){
      if(chunk+8>bytes.length)invalid();
      const end=chunk+8+u32(chunk+4);
      if(end>bytes.length)invalid();
      if(tag(chunk)==='MTrk'){
        found++;
        let cursor=chunk+8,running=0,pending=[];
        const read=()=>{if(cursor>=end)invalid();return bytes[cursor++];};
        const vlq=()=>{let n=0;for(let i=0;i<4;i++){const b=read();n=n*128+(b&127);if(b<128)return n;}invalid();};
        while(cursor<end){
          vlq();
          let status=read();
          if(status<128){if(!running)invalid();cursor--;status=running;}
          if(status===255){
            running=0;const type=read(),length=vlq();
            if(cursor+length>end)invalid();cursor+=length;
            if(type===47){if(length!==0||pending.length)invalid();break;}
          }else if(status===240||status===247){
            running=0;const length=vlq();
            if(cursor+length>end)invalid();
            const payload=bytes.slice(cursor,cursor+length);cursor+=length;
            if(status===240){if(pending.length)invalid();pending=[240,...payload];}
            else if(pending.length)pending=pending.concat(Array.from(payload));
            else{raw(payload);continue;}
            if(pending.at(-1)===247){messages.push(Uint8Array.from(pending));pending=[];}
          }else if(status>=128&&status<240){
            running=status;
            const length=[192,208].includes(status&240)?1:2;
            for(let i=0;i<length;i++)if(read()>127)invalid();
          }else invalid();
        }
        if(pending.length)invalid();
      }
      chunk=end;
    }
    if(found!==tracks)invalid();
    return messages;
  }
  function addToLibrary(existing,ids=programs.map(p=>p.id)) {
    const library={...existing};let added=0;
    for(const id of ids){const p=programs.find(p=>p.id===id);if(!p)throw Error('Suono originale non trovato.');
      // Never replace a user-edited sound, including one sharing our name.
      if(Object.hasOwn(library,p.name))continue;
      Object.defineProperty(library,p.name,{value:Array.from(build(id)),enumerable:true,writable:true,configurable:true});added++;
    }
    return {library,added};
  }
  const api={programs,build,buildBase,bankBytes,midiBytes,midiFromDumps,extractSysEx,addToLibrary,checksum,offsets};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.VirusSoundBank=api;
})(typeof window!=='undefined'?window:globalThis);
