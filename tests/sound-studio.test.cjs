const {test}=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const fs=require('node:fs');
const vm=require('node:vm');
const acorn=require('acorn');
const bank=require('../virus-sound-bank');
const studio=require('../sound-studio');
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};};
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('Neutral macros preserve every program, including imported high parameter values',()=>{
  for(const p of bank.programs)assert.deepEqual(studio.macros(bank.build(p.id),[50,50,50,50],p.role),studio.canonical(bank.build(p.id)));
  const imported=bank.build('velvet-air');imported[35]=105;imported[116]=110;imported[268]=90;imported[267]=0;
  assert.deepEqual(studio.macros(imported,[50,50,50,50],'Pad'),studio.canonical(imported));
});
test('Macro changes are bounded, deterministic, independent of originals, and keep both checksums',()=>{
  const original=bank.build('pulse-root'),snapshot=original.slice();
  for(const p of bank.programs){
    for(const values of [[0,0,0,0],[100,100,100,100],[63,27,81,92]]){
      const bytes=studio.macros(bank.build(p.id),values,p.role);
      assert.ok(bytes.slice(1,-1).every(v=>v<128));
      assert.equal(bytes[265],Array.from(bytes.slice(5,265)).reduce((a,b)=>a+b,0)&127);
      assert.equal(bytes[522],Array.from(bytes.slice(5,522)).reduce((a,b)=>a+b,0)&127);
      assert.deepEqual(bytes,studio.macros(bank.build(p.id),values,p.role));
    }
  }
  const changed=studio.macros(original,[100,100,100,100],'Basso');
  assert.notEqual(changed[43],original[43]);assert.notEqual(changed[49],original[49]);
  assert.deepEqual(original,snapshot);
  assert.throws(()=>studio.macros(original,[128,0,0,0],'Basso'));
  assert.throws(()=>studio.canonical([240,247]));
});
test('Variants have independent stable IDs, preserve parent bytes, favorites and tags across reloads',()=>{
  const storage=memory();let n=0;const model=studio.createModel({bank,storage,id:()=>String(++n)});
  const parent=model.get('directions:skyline');
  const child=model.saveVariant({parentId:parent.id,name:'La mia versione',bytes:studio.macros(parent.bytes,[80,70,50,60],parent.role),tags:['Caldo','Notturno']});
  assert.equal(child.parentId,parent.id);assert.notEqual(child.id,parent.id);
  assert.equal(child.name,'La mia versione');assert.deepEqual(model.get(parent.id).bytes,parent.bytes);
  assert.equal(String.fromCharCode(...child.bytes.slice(249,259)),'La mia ver');
  model.favorite(child.id);
  const sameName=model.saveVariant({parentId:child.id,name:child.name,bytes:child.bytes});
  assert.notEqual(sameName.id,child.id);
  const restored=studio.createModel({bank,storage});
  assert.equal(restored.get(child.id).favorite,true);assert.deepEqual(restored.get(child.id).tags,['Caldo','Notturno']);
  const external=restored.get(child.id);external.bytes[0]=0;
  assert.equal(restored.get(child.id).bytes[0],240);
});
test('Legacy library migration is repeatable and preserves personal patches sharing a factory name',()=>{
  const storage=memory();let n=0;const model=studio.createModel({bank,storage,id:()=>String(++n)});
  const other=bank.build('skyline');other[49]=31;
  const result=model.importLegacy({Skyline:other,VelvetAir:bank.build('velvet-air'),Bad:[1,2]});
  assert.deepEqual(result,{added:1,skipped:1});assert.equal(model.all().length,21);
  assert.equal(model.importLegacy({Skyline:other}).added,0);
  assert.equal(model.all().filter(r=>r.name==='Skyline').length,2);
  assert.equal(model.get('directions:skyline').bytes[49],96);
});
test('Backup restore merges by stable ID and corrupt storage is never silently replaced',()=>{
  const storage=memory(),model=studio.createModel({bank,storage});
  const child=model.saveVariant({name:'Personal',bytes:bank.build('rose-lead')});model.favorite(child.id);
  const backup=model.exportState(),fresh=studio.createModel({bank,storage:memory()});
  fresh.importState(backup);fresh.importState(backup);assert.equal(fresh.all().length,21);assert.equal(fresh.get(child.id).favorite,true);
  assert.throws(()=>fresh.importState({version:1,records:[{id:'x',name:'Broken',bytes:[]}],meta:{}}));
  storage.setItem(studio.KEY,'broken');const broken=studio.createModel({bank,storage});
  assert.ok(broken.error());assert.throws(()=>broken.favorite('directions:skyline'));
  assert.equal(storage.getItem(studio.KEY),'broken');broken.importState(backup);assert.equal(broken.error(),'');
});

function ui(connected=false,instruments){
  const dom=new JSDOM('<main></main>',{url:'http://studio.test'}),root=dom.window.document.querySelector('main');
  const writes=[],downloads=[],actions=[];
  const bridge={bank,instruments,storage:memory(),library:()=>({}),context:()=>({connected,label:'P3',targetKey:'port:multi:2'}),
    load:async bytes=>{writes.push(Array.from(bytes));return {label:'P3',targetKey:'port:multi:2'};},
    capture:async()=>({bytes:bank.build('deep-tide'),name:'DeepTide',label:'P3'}),
    download:(...args)=>downloads.push(args),archive:()=>actions.push('archive'),import:()=>actions.push('import'),advanced:()=>actions.push('advanced'),midi:()=>actions.push('midi')};
  const app=studio.create(root,bridge);
  return {dom,root,bridge,writes,downloads,actions,app};
}
const click=(root,action)=>root.querySelector(`[data-studio-action="${action}"]`).click();
test('MIDI connection changes immediately refresh Studio without pointer interaction or transmission',()=>{
  const e=ui();
  e.bridge.context=()=>({connected:true,label:'Single',targetKey:'port:single:64'});
  e.dom.window.document.dispatchEvent(new e.dom.window.CustomEvent('virus-studio-context'));
  assert.equal(e.root.querySelector('[data-studio-action=b]').disabled,false);
  assert.equal(e.root.querySelector('[data-studio-action=capture]').disabled,false);
  e.bridge.context=()=>({connected:false,label:'Single',targetKey:'offline:single:64'});
  e.dom.window.document.dispatchEvent(new e.dom.window.CustomEvent('virus-studio-context'));
  assert.equal(e.root.querySelector('[data-studio-action=b]').disabled,true);
  assert.equal(e.writes.length,0);e.dom.window.close();
});
function changeMacro(env,index,value){const input=env.root.querySelector(`[data-studio-macro="${index}"]`);input.value=value;input.dispatchEvent(new env.dom.window.Event('input',{bubbles:true}));}
test('Browsing, search, favorites and macro edits never send MIDI; local drafts survive navigation',()=>{
  const e=ui();changeMacro(e,1,85);
  e.root.querySelector('[data-studio-select="directions:velvet-air"]').click();
  e.root.querySelector('[data-studio-select="directions:skyline"]').click();
  assert.equal(e.root.querySelector('[data-studio-macro="1"]').value,'85');
  e.root.querySelector('[data-studio-favorite="directions:skyline"]').click();
  e.root.querySelector('[data-studio-filter=favorite]').click();assert.equal(e.root.querySelectorAll('[data-studio-select]').length,1);
  assert.equal(e.writes.length,0);assert.equal(e.root.querySelector('[data-studio-action=b]').disabled,true);
  click(e.root,'import');assert.deepEqual(e.actions,['import']);e.dom.window.close();
});
test('Large libraries use metadata browsing, incremental results and search across all imported sounds',()=>{
  const e=ui(),library={};
  for(let i=0;i<160;i++)library['Custom '+i]=bank.build('skyline');
  e.bridge.library=()=>library;e.app.refresh();
  assert.equal(e.app.model.catalog().length,180);
  assert.ok(e.app.model.catalog().every(r=>!('bytes' in r)));
  assert.equal(e.root.querySelectorAll('[data-studio-select]').length,100);
  click(e.root,'more');assert.equal(e.root.querySelectorAll('[data-studio-select]').length,180);
  const search=e.root.querySelector('[data-studio-search]');search.value='Custom 159';search.dispatchEvent(new e.dom.window.Event('input',{bubbles:true}));
  assert.equal(e.root.querySelectorAll('[data-studio-select]').length,1);
  assert.match(e.root.querySelector('.vss-results').textContent,/Custom 159/);assert.equal(e.writes.length,0);e.dom.window.close();
});
test('Save variant is usable offline and its MIDI export contains the exact modified sound',()=>{
  const e=ui();changeMacro(e,1,90);click(e.root,'save');
  const form=e.root.querySelector('[data-studio-save-form]');form.elements.soundName.value='Skyline Night';form.elements.soundTags.value='caldo, spazioso';
  form.dispatchEvent(new e.dom.window.Event('submit',{bubbles:true,cancelable:true}));
  const record=e.app.model.all().find(r=>r.name==='Skyline Night');assert.ok(record);assert.equal(record.parentId,'directions:skyline');
  assert.match(e.root.querySelector('[data-studio-message]').textContent,/Variante salvata/);assert.equal(e.writes.length,0);
  click(e.root,'export');assert.equal(e.downloads[0][1],'Skyline_Night.mid');
  assert.deepEqual(bank.extractSysEx(e.downloads[0][0])[0],studio.named(record.bytes,record.name));e.dom.window.close();
});
test('A/B are explicit full-program sends and lost connections cannot trigger a stale enabled action',async()=>{
  const e=ui(true);changeMacro(e,1,95);click(e.root,'a');await flush();
  assert.deepEqual(e.writes[0],Array.from(studio.canonical(bank.build('skyline'))));
  click(e.root,'b');await flush();assert.notEqual(e.writes[1][49],e.writes[0][49]);
  assert.match(e.root.querySelector('[data-studio-transmission]').textContent,/B inviato a P3/);
  e.bridge.context=()=>({connected:false,label:'P3',targetKey:'offline'});click(e.root,'a');await flush();assert.equal(e.writes.length,2);e.dom.window.close();
});
test('Keyboard macro steps are precise and the full editor opens only after a successful explicit send',async()=>{
  const e=ui(true),input=e.root.querySelector('[data-studio-macro="1"]');
  input.dispatchEvent(new e.dom.window.KeyboardEvent('keydown',{key:'ArrowUp',bubbles:true,cancelable:true}));
  assert.equal(input.value,'51');
  input.dispatchEvent(new e.dom.window.KeyboardEvent('keydown',{key:'PageDown',bubbles:true,cancelable:true}));
  assert.equal(input.value,'41');assert.equal(e.writes.length,0);
  click(e.root,'advanced');await flush();assert.equal(e.writes.length,1);assert.deepEqual(e.actions,['advanced']);
  e.bridge.load=async()=>{throw Error('Disconnected');};click(e.root,'advanced');await flush();assert.deepEqual(e.actions,['advanced']);e.dom.window.close();
});
test('Failed sends cannot claim transmission and destination changes invalidate A/B status',async()=>{
  const e=ui(true);e.bridge.load=async()=>{throw Error('Porta scollegata');};click(e.root,'b');await flush();
  assert.match(e.root.querySelector('[data-studio-message]').textContent,/Invio interrotto/);
  assert.doesNotMatch(e.root.querySelector('[data-studio-transmission]').textContent,/B inviato/);
  e.bridge.load=async()=>({label:'P3',targetKey:'port:multi:2'});click(e.root,'b');await flush();
  e.bridge.context=()=>({connected:true,label:'Single',targetKey:'port:single:64'});e.app.refresh();
  assert.match(e.root.querySelector('[data-studio-transmission]').textContent,/Single.*nessun invio/);e.dom.window.close();
});
test('Failed saves retain the editable draft; failed captures never add a fake hardware sound',async()=>{
  const e=ui(true);e.bridge.storage.setItem=()=>{throw Error('Quota exceeded');};changeMacro(e,2,73);click(e.root,'save');
  e.root.querySelector('[data-studio-save-form]').dispatchEvent(new e.dom.window.Event('submit',{bubbles:true,cancelable:true}));
  assert.match(e.root.querySelector('[data-studio-message]').textContent,/Quota exceeded/);
  assert.equal(e.root.querySelector('[data-studio-macro="2"]').value,'73');assert.equal(e.app.model.all().length,20);
  e.bridge.capture=async()=>{throw Error('Timeout');};click(e.root,'capture');await flush();assert.equal(e.app.model.all().length,20);assert.match(e.root.querySelector('[data-studio-message]').textContent,/Lettura non completata/);e.dom.window.close();
});
test('Reading a full hardware sound creates an independent user record without changing factory patches',async()=>{
  const e=ui(true);click(e.root,'capture');await flush();
  const record=e.app.model.all().find(r=>r.origin==='user');assert.equal(record.name,'DeepTide');assert.equal(record.parentId,null);
  assert.equal(e.writes.length,0);assert.equal(e.app.model.all().length,21);e.dom.window.close();
});

const source=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const functions=new Map();
for(const m of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){
  function visit(node){if(!node||typeof node!=='object')return;if(node.type==='FunctionDeclaration')functions.set(node.id.name,m[1].slice(node.start,node.end));Object.values(node).forEach(v=>Array.isArray(v)?v.forEach(visit):visit(v));}
  visit(acorn.parse(m[1],{ecmaVersion:'latest'}));
}
function captureBridge(){
  const dom=new JSDOM(''),sent=[],timers=new Map();let target='port:multi:2';
  const c=vm.createContext({document:dom.window.document,CustomEvent:dom.window.CustomEvent,Uint8Array,Error,
    studioContext:()=>({connected:true,label:'P3',targetKey:target}),getSoundEditBuffer:()=>2,
    selectedOutput:{send:b=>sent.push([...b])},deviceId:()=>0,SYSEX_PREFIX:[240,0,32,51,1],recordMidiTx:()=>{},
    extractPatchName:b=>String.fromCharCode(...b.slice(249,259)).trim(),
    setTimeout:fn=>{timers.set(1,fn);return 1;},clearTimeout:id=>timers.delete(id)});
  vm.runInContext(functions.get('captureStudioSound'),c);
  return {dom,c,sent,timers,retarget:()=>{target='port:single:64';}};
}
test('Real capture bridge waits for the requested part, cleans up and rejects a changed destination',async()=>{
  const e=captureBridge();const promise=e.c.captureStudioSound();assert.deepEqual(e.sent,[[240,0,32,51,1,0,48,0,2,247]]);
  const bytes=bank.build('skyline');bytes[8]=1;e.dom.window.document.dispatchEvent(new e.dom.window.CustomEvent('virus-studio-received',{detail:{bytes}}));assert.equal(e.timers.size,1);
  bytes[8]=2;e.dom.window.document.dispatchEvent(new e.dom.window.CustomEvent('virus-studio-received',{detail:{bytes}}));
  assert.equal((await promise).name,'Skyline');assert.equal(e.timers.size,0);
  const changed=e.c.captureStudioSound();e.retarget();e.dom.window.document.dispatchEvent(new e.dom.window.CustomEvent('virus-studio-received',{detail:{bytes}}));await assert.rejects(changed,/destinazione è cambiata/);
  e.dom.window.close();
});
test('Real capture bridge times out without manufacturing patch data',async()=>{
  const e=captureBridge();const promise=e.c.captureStudioSound();e.timers.get(1)();await assert.rejects(promise,/non ha risposto/);assert.equal(e.timers.size,0);e.dom.window.close();
});

const instruments=require('../studio-instruments');
test('Instrument panels preserve independent drafts, export edited parameters and only send explicitly',async()=>{
  const e=ui(true,instruments);
  assert.equal(e.root.querySelector('.vss-root').dataset.instrument,'poly');
  assert.equal(e.app.model.catalog().length,bank.programs.length+instruments.presets(bank).length);
  const input=e.root.querySelector('[data-instrument-param="49"]');input.value=91;input.dispatchEvent(new e.dom.window.Event('input',{bubbles:true}));
  assert.equal(e.writes.length,0);
  click(e.root,'b');await flush();assert.equal(e.writes.at(-1)[49],91);
  e.root.querySelector('[data-studio-instrument=phase]').click();
  assert.equal(e.root.querySelector('.vss-root').dataset.instrument,'phase');
  const fm=e.root.querySelector('[data-instrument-param="36"]');fm.value=72;fm.dispatchEvent(new e.dom.window.Event('input',{bubbles:true}));
  click(e.root,'export');assert.equal(bank.extractSysEx(e.downloads.at(-1)[0])[0][36],72);
  e.root.querySelector('[data-studio-instrument=poly]').click();
  assert.equal(e.root.querySelector('[data-instrument-param="49"]').value,'91');
  click(e.root,'a');await flush();assert.notEqual(e.writes.at(-1)[49],91);
  assert.equal(e.app.model.get('instrument:forma-cloud').bytes[49],76);
  click(e.root,'save');e.root.querySelector('[data-studio-save-form]').dispatchEvent(new e.dom.window.Event('submit',{bubbles:true,cancelable:true}));
  const saved=e.app.model.catalog().find(r=>r.origin==='user');assert.equal(saved.instrument,'poly');assert.equal(e.app.model.get(saved.id).bytes[49],91);
  e.dom.window.close();
});
test('Instrument mappings reject invalid writes, create valid original programs and chorus edits are bounded',()=>{
  for(const preset of instruments.presets(bank)){
    assert.equal(preset.bytes[100],100);
    const bytes=studio.named(preset.bytes,preset.name);assert.deepEqual(studio.canonical(bytes),bytes);
    for(const c of instruments.definitions[preset.instrument].controls){
      for(const n of [0,127]){const changed=studio.canonical(instruments.apply(bytes,{[c.offset]:n}));assert.equal(changed[c.offset],n);}
    }
  }
  const linked=instruments.apply(bank.build('skyline'),{68:80,69:90,70:99,72:45},'poly');
  assert.equal(linked[63],80);assert.equal(linked[64],90);assert.equal(linked[65],99);assert.equal(linked[67],45);
  for(const voice of instruments.presets(bank).filter(p=>p.instrument==='phase')){assert.equal(voice.bytes[34],64);assert.equal(voice.bytes[42],127);}
  const bytes=bank.build('skyline');assert.throws(()=>instruments.apply(bytes,{1:127}),/non valido/);
  assert.throws(()=>instruments.apply(bytes,{49:128}),/non valido/);
  assert.equal(instruments.chorus(0)[114],0);assert.equal(instruments.chorus(1)[114],48);assert.equal(instruments.chorus(2)[115],35);
  assert.throws(()=>instruments.chorus(3));
});
test('Digital volume changes the exported Virus patch without replacing the selected parameter readout',()=>{
  const e=ui(false,instruments);e.root.querySelector('[data-studio-instrument=phase]').click();
  e.root.querySelector('[data-instrument-edit=attack]').click();
  const original=e.root.querySelector('[data-instrument-lcd-value]').textContent;
  const volume=e.root.querySelector('[data-instrument-param="100"]');volume.value=81;volume.dispatchEvent(new e.dom.window.Event('input',{bubbles:true}));
  assert.equal(e.root.querySelector('[data-instrument-lcd-value]').textContent,original);
  assert.equal(e.root.querySelector('[data-instrument-lcd-label]').textContent,'Attack');
  click(e.root,'export');assert.equal(bank.extractSysEx(e.downloads.at(-1)[0])[0][100],81);
  assert.equal(e.writes.length,0);e.dom.window.close();
});
test('Visible Load action sends the selected Single draft explicitly and is disabled offline',async()=>{
  const e=ui(true,instruments);
  assert.equal(e.root.querySelector('[data-studio-action=load]').textContent,'Carica nel Virus');
  assert.match(e.root.querySelector('[data-studio-transmission]').textContent,/Premi Carica nel Virus/);
  assert.equal(e.writes.length,0);click(e.root,'load');await flush();
  assert.equal(e.writes.length,1);assert.equal(e.writes[0][8],64);
  assert.equal(studio.signature(e.writes[0]),studio.signature(e.app.model.get('instrument:forma-cloud').bytes));
  e.bridge.context=()=>({connected:false,label:'Single',targetKey:'offline'});e.app.refresh();
  assert.equal(e.root.querySelector('[data-studio-action=load]').disabled,true);e.dom.window.close();
});
function liveFixture(){
  const e=ui(true,instruments),pending=new Map();let timerId=0;
  e.dom.window.setTimeout=fn=>{pending.set(++timerId,fn);return timerId;};e.dom.window.clearTimeout=id=>pending.delete(id);
  e.updates=[];e.bridge.update=(next,previous,target)=>{e.updates.push(studio.parameterChanges(previous,next));return {label:'P3',targetKey:target};};
  e.runLive=()=>{const callbacks=[...pending.values()];pending.clear();callbacks.forEach(fn=>fn());};
  e.edit=(offset,value)=>{const input=e.root.querySelector(`[data-instrument-param="${offset}"]`);input.value=value;input.dispatchEvent(new e.dom.window.Event('input',{bubbles:true}));};
  return e;
}
test('Live edits are coalesced parameter writes after loading, without repeated program dumps',async()=>{
  const e=liveFixture();e.edit(49,78);e.runLive();assert.equal(e.updates.length,0);
  click(e.root,'load');await flush();assert.match(e.root.querySelector('[data-studio-edit-mode]').textContent,/LIVE/);
  e.edit(49,80);e.edit(49,85);e.runLive();
  assert.equal(e.writes.length,1);assert.deepEqual(e.updates,[[{page:112,index:40,value:85}]]);
  e.root.querySelector('[data-instrument-chorus="2"]').click();e.runLive();assert.ok(e.updates.at(-1).some(p=>p.index===105));
  e.edit(68,90);e.runLive();assert.deepEqual(e.updates.at(-1).map(p=>p.index),[54,59]);
  click(e.root,'a');await flush();e.edit(49,88);e.runLive();assert.equal(e.writes.length,2);assert.ok(e.updates.at(-1).some(p=>p.index===40&&p.value===88));
  click(e.root,'reset');e.runLive();assert.ok(e.updates.at(-1).some(p=>p.index===40&&p.value===76));e.dom.window.close();
});
test('Queued live writes stop on sound selection, destination change, disconnection or an external edit',async()=>{
  const e=liveFixture();click(e.root,'load');await flush();e.edit(49,81);
  e.root.querySelector('[data-studio-select="instrument:forma-brass"]').click();e.runLive();assert.equal(e.updates.length,0);
  click(e.root,'load');await flush();e.edit(49,82);e.bridge.context=()=>({connected:true,label:'Single',targetKey:'other'});e.runLive();assert.equal(e.updates.length,0);
  click(e.root,'load');await flush();e.edit(49,83);e.bridge.context=()=>({connected:false,label:'Single',targetKey:'other'});e.dom.window.document.dispatchEvent(new e.dom.window.Event('change'));e.runLive();assert.equal(e.updates.length,0);
  e.bridge.context=()=>({connected:true,label:'P3',targetKey:'port:multi:2'});click(e.root,'load');await flush();e.edit(49,84);
  e.bridge.context=()=>({connected:true,label:'P3',targetKey:'port:multi:2',signature:'externally-changed'});e.runLive();assert.equal(e.updates.length,0);e.dom.window.close();
});
test('Live MIDI errors disable further sends and retain the local draft',async()=>{
  const e=liveFixture();click(e.root,'load');await flush();e.bridge.update=()=>{throw Error('Disconnected');};e.edit(49,88);e.runLive();
  assert.match(e.root.querySelector('[data-studio-message]').textContent,/live interrotti/);assert.equal(e.root.querySelector('[data-instrument-param="49"]').value,'88');
  e.edit(49,89);e.runLive();assert.equal(e.writes.length,1);e.dom.window.close();
});
test('Parameter deltas skip both TI checksums and route extended pages correctly',()=>{
  const before=bank.build('skyline'),after=Uint8Array.from(before);after[49]=99;after[268]=45;after[515]=44;
  assert.deepEqual(studio.parameterChanges(before,after),[{page:112,index:40,value:99},{page:110,index:2,value:45},{page:111,index:121,value:44}]);
  assert.equal(studio.parameterChanges(before,studio.canonical(before)).length,0);
});
test('The real live bridge pins every parameter to the active Single or Multi buffer',()=>{
  for(const buffer of [64,2]){
    const sent=[],cached=[];const c=vm.createContext({VirusSoundStudio:studio,studioContext:()=>({connected:true,label:'target',targetKey:'p'}),getSoundEditBuffer:()=>buffer,
      sendVirusParam:(...args)=>sent.push(args),cacheHardwareValue:(p,v)=>cached.push([p,v]),window:{},setLastAction(){}});
    vm.runInContext(functions.get('updateStudioSound'),c);
    const a=bank.build('skyline'),b=Uint8Array.from(a);b[49]=101;b[268]=37;c.updateStudioSound(b,a,'p');
    assert.deepEqual(sent.map(s=>s.slice(0,4)),[[112,buffer,40,101],[110,buffer,2,37]]);assert.equal(cached.length,2);
    assert.throws(()=>c.updateStudioSound(b,a,'wrong'),/destinazione MIDI/);
  }
});
test('Reading the actual Virus sound arms live editing without sending a program dump',async()=>{
  const e=liveFixture();click(e.root,'capture');await flush();
  assert.match(e.root.querySelector('[data-studio-edit-mode]').textContent,/LIVE/);
  e.edit(49,87);e.runLive();assert.equal(e.writes.length,0);assert.deepEqual(e.updates.at(-1),[{page:112,index:40,value:87}]);e.dom.window.close();
});
test('FORMA program selector is local; waveform and range switches write live parameter deltas',async()=>{
 const e=liveFixture(),select=e.root.querySelector('[data-instrument-preset]');select.value='instrument:forma-study-bronze';select.dispatchEvent(new e.dom.window.Event('change',{bubbles:true}));assert.equal(e.writes.length,0);assert.equal(e.root.querySelector('.vsi-program-display>span').textContent,'Bronze Brass');
 click(e.root,'load');await flush();assert.equal(e.writes.length,1);
 e.root.querySelector('[data-instrument-switch="wave:pulse"]').click();e.runLive();assert.ok(e.updates.at(-1).some(p=>p.index===33&&p.value===127));
 e.root.querySelector('[data-instrument-switch="octave:52"]').click();e.runLive();assert.deepEqual(e.updates.at(-1).filter(p=>[20,25].includes(p.index)).map(p=>[p.index,p.value]),[[20,52],[25,52]]);assert.equal(e.writes.length,1);e.dom.window.close();
});
test('FORMA on-panel keys release the same MIDI note and bank export does not load a program',()=>{
 const e=ui(true,instruments),notes=[];e.bridge.playNote=(n,v)=>notes.push(['on',n,v]);e.bridge.stopNote=n=>notes.push(['off',n]);e.bridge.downloadForma=()=>e.actions.push('forma-bank');
 const key=e.root.querySelector('[data-studio-note="60"]');const event=type=>{const ev=new e.dom.window.Event(type,{bubbles:true,cancelable:true});Object.defineProperty(ev,'pointerId',{value:1});return ev;};
 key.dispatchEvent(event('pointerdown'));e.dom.window.dispatchEvent(event('pointerup'));assert.deepEqual(notes,[['on',60,100],['off',60]]);click(e.root,'forma-bank');assert.ok(e.actions.includes('forma-bank'));assert.equal(e.writes.length,0);e.dom.window.close();
});
test('Instrument library collapses without losing search or selection and remembers its state',()=>{
 const e=ui(false,instruments),aside=e.root.querySelector('.vss-browser'),button=e.root.querySelector('[data-studio-action=toggle-library]');assert.equal(aside.hidden,true);assert.equal(button.getAttribute('aria-expanded'),'false');assert.ok(e.root.querySelector('.vss-root').classList.contains('vss-browser-collapsed'));
 button.click();assert.equal(aside.hidden,false);const search=e.root.querySelector('[data-studio-search]');search.value='Brass';search.dispatchEvent(new e.dom.window.Event('input',{bubbles:true}));const before=e.root.querySelector('.vss-results').textContent;
 button.click();assert.equal(aside.hidden,true);assert.equal(e.dom.window.localStorage.getItem('virusH_studio_browser_collapsed_v1'),'1');button.click();assert.equal(search.value,'Brass');assert.equal(e.root.querySelector('.vss-results').textContent,before);assert.equal(button.getAttribute('aria-expanded'),'true');assert.equal(e.writes.length,0);e.dom.window.close();
});
test('FX writes use live deltas, dry comparison is reversible and exports always retain wet settings',async()=>{
 const e=liveFixture(),edit=(offset,value)=>{const el=e.root.querySelector(`[data-fx-param="${offset}"]`);el.value=value;el.dispatchEvent(new e.dom.window.Event('input',{bubbles:true}));};
 edit(268,31);e.runLive();assert.equal(e.writes.length,0);assert.equal(e.updates.length,0);assert.equal(e.root.querySelector('[data-studio-action=fx-bypass]').disabled,true);
 click(e.root,'load');await flush();assert.equal(e.writes[0][268],31);edit(270,83);e.runLive();assert.ok(e.updates.at(-1).some(p=>p.page===110&&p.index===4&&p.value===83));assert.equal(e.writes.length,1);
 click(e.root,'fx-bypass');e.runLive();assert.equal(e.root.querySelector('[data-studio-action=fx-bypass]').getAttribute('aria-pressed'),'true');assert.ok(e.updates.at(-1).some(p=>p.page===110&&p.index===2&&p.value===0));
 click(e.root,'export');const exported=bank.extractSysEx(e.downloads.at(-1)[0])[0];assert.equal(exported[268],31);assert.equal(exported[270],83);assert.equal(exported[114],48);
 click(e.root,'fx-bypass');e.runLive();assert.ok(e.updates.at(-1).some(p=>p.page===110&&p.index===2&&p.value===31));assert.equal(e.writes.length,1);
 click(e.root,'save');e.root.querySelector('[data-studio-save-form]').dispatchEvent(new e.dom.window.Event('submit',{bubbles:true,cancelable:true}));const saved=e.app.model.catalog().find(r=>r.origin==='user');assert.equal(e.app.model.get(saved.id).bytes[268],31);assert.equal(e.app.model.get(saved.id).bytes[270],83);e.dom.window.close();
});
test('FX suggestions follow the selected role and chorus stays synchronized with panel buttons',()=>{
 const e=ui(false,instruments);click(e.root,'fx-suggest');assert.equal(e.root.querySelector('[data-fx-param="268"]').value,'30');assert.equal(e.root.querySelector('[data-instrument-chorus="2"]').getAttribute('aria-pressed'),'true');
 e.root.querySelector('[data-instrument-chorus="0"]').click();assert.equal(e.root.querySelector('[data-fx-param="114"]').value,'0');assert.equal(e.writes.length,0);
 e.root.querySelector('[data-studio-select="instrument:forma-study-round"]').click();click(e.root,'fx-suggest');assert.equal(e.root.querySelector('[data-fx-param="268"]').value,'0');assert.equal(e.root.querySelector('[data-fx-param="238"]').value,'20');e.dom.window.close();
});
test('Studio buttons and sliders do not swallow Mac note keys',()=>{
 const e=ui(false,instruments);let reached=0;e.dom.window.addEventListener('keydown',event=>{if(event.code==='KeyA')reached++;});e.root.querySelector('[data-studio-action=mac]').dispatchEvent(new e.dom.window.KeyboardEvent('keydown',{bubbles:true,code:'KeyA',key:'a'}));e.root.querySelector('[data-fx-param="114"]').dispatchEvent(new e.dom.window.KeyboardEvent('keydown',{bubbles:true,code:'KeyA',key:'a'}));assert.equal(reached,2);e.dom.window.close();
});
test('Drive Off remains explicit; moving intensity reactivates the native effect',()=>{
 const e=ui(false,instruments),change=(offset,value,type='input')=>{const input=e.root.querySelector(`[data-fx-param="${offset}"]`);input.value=value;input.dispatchEvent(new e.dom.window.Event(type,{bubbles:true}));};
 change(238,20);assert.equal(e.root.querySelector('[data-fx-param="237"]').value,'1');change(237,0,'change');change(268,15);assert.equal(e.root.querySelector('[data-fx-param="237"]').value,'0');change(238,21);assert.equal(e.root.querySelector('[data-fx-param="237"]').value,'1');e.dom.window.close();
});
