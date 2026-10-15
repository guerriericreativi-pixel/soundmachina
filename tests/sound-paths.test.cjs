const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const acorn=require('acorn');
const {JSDOM}=require('jsdom');
const api=require('../sound-paths');

function setup(connected=false, apply=async()=>({label:'P3'})) {
  const dom=new JSDOM('<main id="paths"></main>');
  const actions=[];
  const bridge={context:()=>({connected,label:'P3'}),apply:writes=>{actions.push(writes);return apply(writes);},open:v=>actions.push(v),configureMidi:()=>actions.push('midi')};
  const root=dom.window.document.getElementById('paths');
  const ui=api.create(root,bridge);
  return {dom,root,actions,ui,bridge};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('Five styles and four original characters contain valid, unique Virus addresses',()=>{
  assert.equal(api.paths.filter(p=>p.group==='styles').length,5);
  assert.equal(api.paths.filter(p=>p.group==='characters').length,4);
  assert.equal(new Set(api.paths.map(p=>p.id)).size,9);
  api.paths.forEach(p=>assert.doesNotThrow(()=>api.validateRecipe(p.writes)));
  const reverb=api.paths.find(p=>p.id==='ambient').writes.filter(p=>p.name.startsWith('Reverb'));
  assert.deepEqual(reverb.map(p=>[p.page,p.index]),[[0x6e,2],[0x6e,4]]);
});
test('Invalid recipes fail before transmission',()=>{
  for(const recipe of [[],[{page:0x73,index:127,value:127}],[{page:0x70,index:40,value:128}],[{page:0x70,index:40,value:1.5}],[{page:0x70,index:40,value:1},{page:0x70,index:40,value:2}]])assert.throws(()=>api.validateRecipe(recipe));
});
test('Exploring every path sends nothing; disconnected users can open existing editors',()=>{
  const {root,actions,dom}=setup();
  for(const p of api.paths)root.querySelector(`[data-vsp-path="${p.id}"]`).click();
  assert.equal(actions.length,0);
  assert.equal(root.querySelector('[data-vsp-action="apply"]').disabled,true);
  root.querySelector('[data-vsp-action="single"]').click();
  root.querySelector('[data-vsp-action="midi"]').click();
  assert.deepEqual(actions,['single','midi']);
  dom.window.close();
});
test('One explicit action sends the selected recipe and reports transmission',async()=>{
  const {root,actions,dom}=setup(true);
  root.querySelector('[data-vsp-path="prisma"]').click();
  assert.equal(actions.length,0);
  root.querySelector('[data-vsp-action="apply"]').click();
  await flush();
  assert.deepEqual(actions,[api.paths.find(p=>p.id==='prisma').writes]);
  assert.match(root.querySelector('.vsp-status').textContent,/8 parametri inviati · P3/);
  assert.equal(root.querySelector('[data-vsp-action="apply"]').disabled,false);
  dom.window.close();
});
test('Failed sends never report success; busy recipes cannot change mid-send',async()=>{
  let rejectSend;
  const {root,actions,dom}=setup(true,()=>new Promise((resolve,reject)=>{rejectSend=reject;}));
  root.querySelector('[data-vsp-action="apply"]').click();
  assert.equal(root.querySelector('[data-vsp-path="ambient"]').disabled,true);
  root.querySelector('[data-vsp-path="ambient"]').click();
  assert.equal(root.querySelector('[data-vsp-path="trance"]').getAttribute('aria-pressed'),'true');
  rejectSend(new Error('Porta scollegata.'));
  await flush();
  assert.equal(actions.length,1);
  assert.match(root.querySelector('.vsp-status').textContent,/Invio interrotto: Porta scollegata/);
  assert.doesNotMatch(root.querySelector('.vsp-status').textContent,/parametri inviati/);
  assert.equal(root.querySelector('[data-vsp-path="ambient"]').disabled,false);
  dom.window.close();
});
test('A connection lost after render cannot trigger a stale enabled action',async()=>{
  const {root,actions,bridge,dom}=setup(true);
  bridge.context=()=>({connected:false,label:'P3'});
  root.querySelector('[data-vsp-action="apply"]').click();
  await flush();
  assert.equal(actions.length,0);
  assert.match(root.querySelector('.vsp-status').textContent,/Collega prima/);
  dom.window.close();
});

test('Console edits stay local, survive browsing, and apply only the edited values',async()=>{
  const {root,actions,dom}=setup(true);
  root.querySelector('[data-vsp-path="materia"]').click();
  const cutoff=root.querySelector('input[aria-label="Cutoff"]');
  cutoff.value='112';
  cutoff.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  assert.equal(cutoff.closest('label').querySelector('output').textContent,'112');
  assert.equal(actions.length,0);
  root.querySelector('[data-vsp-path="prisma"]').click();
  root.querySelector('[data-vsp-path="materia"]').click();
  assert.equal(root.querySelector('input[aria-label="Cutoff"]').value,'112');
  root.querySelector('[data-vsp-action="apply"]').click();
  assert.ok([...root.querySelectorAll('[data-vsp-control]')].every(e=>e.disabled));
  await flush();
  assert.equal(actions[0].find(p=>p.index===40).value,112);
  assert.equal(api.paths.find(p=>p.id==='materia').writes.find(p=>p.index===40).value,74);
  dom.window.close();
});

test('Console reset and double click restore defaults without sending MIDI',()=>{
  const {root,actions,dom}=setup();
  const cutoff=root.querySelector('input[aria-label="Cutoff"]');
  cutoff.value='12';cutoff.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  cutoff.dispatchEvent(new dom.window.MouseEvent('dblclick',{bubbles:true}));
  assert.equal(cutoff.value,'96');
  cutoff.value='33';cutoff.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  root.querySelector('[data-vsp-action="reset"]').click();
  assert.equal(root.querySelector('input[aria-label="Cutoff"]').value,'96');
  assert.equal(actions.length,0);
  dom.window.close();
});

const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const functions=new Map();
for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){
  const source=match[1];
  function visit(node){
    if(!node||typeof node!=='object')return;
    if(node.type==='FunctionDeclaration')functions.set(node.id.name,source.slice(node.start,node.end));
    Object.values(node).forEach(value=>Array.isArray(value)?value.forEach(visit):visit(value));
  }
  visit(acorn.parse(source,{ecmaVersion:'latest'}));
}
function integration(mode,part){
  const sent=[],cached=[];
  const c=vm.createContext({VirusSoundPaths:api,selectedOutput:{},currentPartIndex:part,window:{currentSynthMode:mode},sent,cached,
    sendVirusParam:(page,buffer,index,value)=>sent.push([page,buffer,index,value]),
    cacheHardwareValue:(p,v)=>cached.push([p.page,p.index,v]),refreshAllKnobs:()=>{},updateSingleOledDisplay:()=>{}});
  for(const name of ['getSoundEditBuffer','soundPathContext','applySoundPathRecipe'])vm.runInContext(functions.get(name),c);
  return {c,sent,cached};
}
test('Real app bridge addresses only the selected Multi part or Single buffer',()=>{
  for(const [mode,part,buffer] of [['multi',2,2],['single',2,0x40]]){
    const {c,sent,cached}=integration(mode,part);
    const writes=api.paths.find(p=>p.id==='ambient').writes;
    c.applySoundPathRecipe(writes);
    assert.equal(sent.length,writes.length);
    assert.ok(sent.every(p=>p[1]===buffer));
    assert.equal(cached.length,writes.length);
    assert.deepEqual(sent.at(-1),[0x6e,buffer,4,85]);
  }
});
test('Real app bridge rejects disconnected or invalid writes without sending',()=>{
  const {c,sent}=integration('multi',1);
  assert.throws(()=>c.applySoundPathRecipe([{page:0x73,index:127,value:100}]));
  c.selectedOutput=null;
  assert.throws(()=>c.applySoundPathRecipe(api.paths[0].writes),/non collegata/);
  assert.equal(sent.length,0);
});
test('A MIDI output without SysEx authorization cannot apply recipes',()=>{
  const {c,sent}=integration('multi',1);
  c.midiAccess={sysexEnabled:false};
  assert.equal(c.soundPathContext().connected,false);
  assert.throws(()=>c.applySoundPathRecipe(api.paths[0].writes),/SysEx/);
  assert.equal(sent.length,0);
});
