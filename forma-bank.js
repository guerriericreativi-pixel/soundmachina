/* Original Virus programs studying the subtractive palette of the JUNO-106.
 * No Roland preset data, ROMs or recordings are included. Not factory conversions. */
(function(root){
  'use strict';
  const programs=[
    ['bronze','Bronze Brass','Keys','Brass analogico, attacco rapido e filtro che si richiude.',{40:54,44:57,59:4,60:65,61:82,63:25,34:8}],
    ['swell','Rising Brass','Pad','Brass morbido con apertura progressiva e chorus I.',{40:47,44:47,59:40,60:88,61:103,63:56,105:43,106:22,107:32}],
    ['reed','Reed Ensemble','Keys','Pulse nasale e registro medio, con poco chorus.',{33:127,23:33,40:69,42:17,44:18,59:10,60:72,61:96,63:35,105:24}],
    ['velvet','Velvet Strings','Pad','Saw e pulse, inviluppo lento e chorus II ampio.',{40:67,44:18,59:58,60:96,61:112,63:77,76:69,105:60,106:35,107:48}],
    ['motion','Moving Silk','Pad','Archi in movimento: PWM lenta e chorus stereo.',{23:40,40:77,59:46,60:100,61:115,63:86,67:20,79:20,76:78,88:68,105:60,106:35,107:48}],
    ['low-string','Low Ensemble','Pad','Archi scuri al registro basso, con sub discreto.',{20:52,25:52,34:17,40:58,59:45,60:90,61:110,63:68,105:48,106:22,107:33}],
    ['round','Round Foundation','Basso','Saw e sub all’ottava inferiore, coda corta e asciutta.',{20:52,25:52,33:0,34:53,40:37,42:14,44:49,59:0,60:49,61:88,63:10,105:0}],
    ['pulse','Narrow Pulse','Basso','Pulse stretta e inviluppo netto per linee compatte.',{20:52,25:52,33:127,23:30,34:25,40:46,42:22,44:55,59:0,60:56,61:72,63:14,105:0}],
    ['resonant','Resonant Step','Basso','Basso risonante con decadimento marcato del filtro.',{20:52,25:52,33:0,34:18,40:32,42:68,44:74,59:0,60:51,61:17,63:12,105:0}],
    ['piano','Soft Poly Keys','Keys','Tastiera sintetica percussiva, filtro morbido e chorus I.',{33:127,23:61,40:73,44:24,59:0,60:85,61:0,63:40,105:38}],
    ['glass','Glass Chime','Keys','Timbro brillante e delicato, senza FM, con rilascio lungo.',{20:76,25:76,33:127,23:47,40:101,42:23,44:16,59:0,60:87,61:0,63:72,105:42}],
    ['organ','Chapel Organ','Keys','Due registri a un’ottava, attacco immediato e sustain pieno.',{17:127,22:127,20:64,25:76,23:64,18:64,34:21,40:86,59:0,60:0,61:127,63:12,105:22}],
    ['pipes','Hollow Pipes','Keys','Pulse scura e sub: un organo morbido e raccolto.',{33:127,23:62,34:34,40:60,59:2,60:0,61:127,63:21,105:31}],
    ['harp','Plucked Wire','Pluck','Pizzicato corto, pulse sottile e un’ombra di chorus.',{33:127,23:29,40:67,44:46,59:0,60:64,61:0,63:40,105:27}],
    ['sweep','Blue Sweep','Pad','Accordo ampio con apertura del filtro e lunga coda.',{40:31,44:78,42:26,59:81,60:100,61:103,63:94,105:60,106:35,107:48}],
    ['surf','Noise Shore','FX','Rumore filtrato e risonanza per onde e transizioni.',{33:0,34:0,37:110,40:48,42:47,44:34,59:78,60:100,61:102,63:98,88:77,105:16}]
  ].map(([id,name,role,description,a],i)=>Object.freeze({id:'forma-study-'+id,name,role,description,a:Object.freeze(a),number:i+1}));
  function build(bank,program){
    const bytes=bank.buildBase('velvet-air');
    const a={5:0,17:64,18:64,19:0,20:64,22:127,23:48,24:0,25:64,26:0,27:0,28:0,29:64,30:64,33:64,34:0,37:0,40:70,41:0,42:10,43:0,44:20,45:0,46:96,47:64,48:64,49:0,50:0,51:0,52:1,53:1,54:0,55:75,56:100,57:0,58:28,59:0,60:75,61:100,62:0,63:28,67:28,68:1,69:0,70:0,71:64,72:0,73:0,74:64,75:64,76:64,77:64,78:64,79:28,80:1,81:0,82:0,83:64,84:0,85:0,86:64,87:64,88:64,89:64,90:64,91:100,94:0,105:48,106:22,107:33,108:50,109:64,110:1,111:64,112:1,113:0,...program.a};
    // One shared ADSR, as on the reference instrument; no inherited pad envelope.
    for(const [amp,filter] of [[59,54],[60,55],[61,56],[63,58]])a[filter]=a[amp];
    for(const [i,v] of Object.entries(a))bytes[9+Number(i)]=v;
    const b={15:0,19:0,25:0,26:64,27:64,28:0,30:1,31:1,32:0,35:0,36:0,41:0,62:0,63:0,64:0,65:64,66:64,67:64,68:0,69:64,70:0,71:64,72:0,73:64,74:0,75:64,76:0,77:64,78:64,81:0,82:64,84:0,85:0,89:64,90:100,98:0};
    for(const [i,v] of Object.entries(b))bytes[137+Number(i)]=v;
    for(const [i,v] of Object.entries({1:0,2:0,30:0,35:0,109:0}))bytes[266+Number(i)]=v;
    bytes[394+120]=0;bytes[394+121]=0;
    const title=program.name.replace(/[^\x20-\x7e]/g,'').slice(0,10).padEnd(10,' ');for(let i=0;i<10;i++)bytes[249+i]=title.charCodeAt(i);
    const sum=end=>Array.from(bytes.slice(5,end)).reduce((x,y)=>x+y,0)&127;bytes[265]=sum(265);bytes[522]=sum(522);return bytes;
  }
  function presets(bank){return programs.map(p=>({id:'instrument:'+p.id,name:p.name,instrument:'poly',role:p.role,style:'synthwave',description:p.description,origin:'factory',collection:'FORMA / P · Classic Studies',tags:['Classic Studies','Interpretazione Virus',p.role],bytes:Array.from(build(bank,p))}));}
  function midi(bank){return bank.midiFromDumps(programs.map(p=>build(bank,p)),'VIRUS-H FORMA P Classic Studies');}
  const api={programs,build,presets,midi};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VirusFormaBank=api;
})(typeof window!=='undefined'?window:globalThis);
