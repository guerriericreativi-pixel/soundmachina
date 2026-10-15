/* Native Virus TI effects. Offsets skip the intermediate TI checksum. */
(function(root){
 'use strict';
 const c=(id,label,offset,center=0)=>({id,label,offset,center,max:127});
 const groups=[
  {name:'CHORUS',hint:'Corpo e apertura',controls:[c('chorus','Mix',114),c('chorus-rate','Rate',115),c('chorus-depth','Depth',116)]},
  {name:'DELAY',hint:'Ripetizioni e ritmo',controls:[c('delay','Send',122),c('delay-time','Time',123),c('feedback','Feedback',124)]},
  {name:'REVERB',hint:'Ambiente e profondità',controls:[c('reverb','Send',268),c('reverb-time','Time',270),c('damping','Damping',271)]},
  {name:'DRIVE',hint:'Presenza e grana',controls:[c('drive','Intensity',238)]},
  {name:'PHASER',hint:'Movimento stereo',controls:[c('phaser','Mix',222),c('phaser-rate','Rate',223),c('phaser-depth','Depth',224)]},
  {name:'EQ',hint:'Equilibrio del timbro',controls:[c('eq-low','Low',232,64),c('eq-mid','Mid',229,64),c('eq-high','High',233,64)]}
 ];
 const driveTypes=['Off','Light','Soft','Medium','Hard','Digital','Wave Shaper','Rectifier','Bit Reducer Old','Rate Reducer Old','Low Pass','High Pass','Wide','Soft Bounce','Hard Bounce','Sine Fold','Triangle Fold','Sawtooth Fold','Rate Reducer','Bit Reducer','Mint Overdrive','Curry Overdrive','Saffron Overdrive','Onion Overdrive','Pepper Overdrive','Chili Overdrive'];
 const specs=new Map(groups.flatMap(g=>g.controls.map(c=>[c.offset,c])));specs.set(237,{max:25});specs.set(269,{max:3});
 function apply(bytes,edits={}){
  const next=Uint8Array.from(bytes);
  for(const [key,value] of Object.entries(edits)){
   const offset=Number(key),spec=specs.get(offset);
   if(!spec||!Number.isInteger(value)||value<0||value>spec.max||offset>=next.length-2)throw Error('Parametro FX non compatibile con questa patch.');
   next[offset]=value;
   if(offset===268&&value>0&&next[267]===0)next[267]=1;
   if(offset===122&&value>0&&next[121]===0)next[121]=1;
   if(offset===238&&value>0&&next[237]===0&&!Object.hasOwn(edits,237))next[237]=1;
   if(offset===114&&value>0&&next[112]===0)next[112]=1;
  }
  return next;
 }
 function dry(bytes){const next=Uint8Array.from(bytes);for(const [i,value] of [[114,0],[122,0],[222,0],[237,0],[232,64],[229,64],[233,64],...(next.length===524?[[268,0]]:[])])next[i]=value;return next;}
 function suggested(role){
  const common={114:38,115:22,116:33,122:0,124:25,268:14,270:48,271:32,269:1,237:0,238:0,222:0,232:64,229:64,233:64};
  return {...common,...({Pad:{114:55,115:35,116:47,268:30,270:78,271:40,269:3},Lead:{114:22,122:22,123:66,124:35,268:14,237:2,238:15},Basso:{114:0,268:0,237:2,238:20,232:68,229:66},Keys:{114:32,268:18,270:50,233:67},Pluck:{114:24,122:20,123:64,124:28,268:17,270:53},FX:{114:30,222:26,223:22,224:70,268:30,270:80,269:3}}[role]||{})};
 }
 const display=(control,value)=>control.id.startsWith('eq-')?((value-64)/4>0?'+':'')+((value-64)/4)+' dB':String(value);
 function render(bytes,{open=false}={}){
  const select=(offset,label,names)=>`<label class="vsfx-type">${label}<select data-fx-param="${offset}" aria-label="FX · ${label}" ${offset>=bytes.length-2?'disabled':''}>${names.map((name,i)=>`<option value="${i}" ${bytes[offset]===i?'selected':''}>${name}</option>`).join('')}</select></label>`;
  return `<details class="vsfx" data-studio-fx ${open?'open':''}><summary><span>FX <small>VIRUS ENGINE</small></span><span>Chorus · Delay · Reverb · Drive · Phaser · EQ</span></summary><div class="vsfx-toolbar"><p>Effetti reali del Virus · salvati con il suono.</p><div><button type="button" data-studio-action="fx-suggest">FX suggeriti</button><button type="button" data-studio-action="fx-bypass" aria-pressed="false">Ascolta senza FX</button></div></div><div class="vsfx-groups">${groups.map(group=>`<section><header><h4>${group.name}</h4><small>${group.hint}</small></header>${group.name==='DRIVE'?select(237,'Tipo drive',driveTypes):group.name==='REVERB'?select(269,'Ambiente',['Ambience','Small Room','Large Room','Hall']):''}<div class="vsfx-knobs">${group.controls.map(control=>{const value=bytes[control.offset]||0,frame=Math.round(value/127*31);return `<label><span>${control.label}</span><span class="vss-dial" style="--frame-x:${frame%8};--frame-y:${Math.floor(frame/8)}"><span class="vss-dial-art" aria-hidden="true"></span><input type="range" min="0" max="127" value="${value}" data-fx-param="${control.offset}" aria-label="FX · ${group.name} · ${control.label}" ${control.offset>=bytes.length-2?'disabled':''} title="Trascina in verticale. Shift: precisione. Doppio clic: neutro."></span><output data-fx-output="${control.offset}">${display(control,value)}</output></label>`;}).join('')}</div></section>`).join('')}</div><p class="vsfx-state" data-fx-state role="status"></p></details>`;
 }
 function sync(container,bytes,{bypassed=false,live=false,compareReady=live,busy=false}={}){
  container.querySelectorAll('[data-fx-param]').forEach(input=>{const offset=Number(input.dataset.fxParam);input.value=bytes[offset]||0;input.disabled=busy||offset>=bytes.length-2;if(input.type==='range'){const frame=Math.round(Number(input.value)/127*31);input.parentElement.style.setProperty('--frame-x',frame%8);input.parentElement.style.setProperty('--frame-y',Math.floor(frame/8));container.querySelector(`[data-fx-output="${offset}"]`).textContent=display(specs.get(offset),Number(input.value));}});
  const bypass=container.querySelector('[data-studio-action=fx-bypass]');if(!bypass)return;bypass.disabled=busy||!compareReady;bypass.setAttribute('aria-pressed',String(bypassed));bypass.textContent=bypassed?'Riascolta con FX':'Ascolta senza FX';
  container.querySelector('[data-studio-action=fx-suggest]').disabled=busy;
  container.querySelector('[data-fx-state]').textContent=bypassed?'Confronto: FX esclusi all’ascolto. Le regolazioni sono conservate nella variante.':live?'LIVE · regola gli effetti mentre suoni.':'Carica il suono nel Virus una volta per regolare e confrontare gli effetti in tempo reale.';
 }
 const api={groups,specs,apply,dry,suggested,render,sync};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VirusStudioEffects=api;
})(typeof window!=='undefined'?window:globalThis);
