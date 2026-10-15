const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
function setup(mode='multi'){
  const dom=new JSDOM('<select id="midiChannel"><option value="6" selected>6</option></select>');
  const sent=[],params=[],timers=new Map(); let id=0;
  const output={send:b=>sent.push([...b])};
  const c=vm.createContext({window:dom.window, document:dom.window.document, console,
    performance:{now:()=>1000}, setTimeout:f=>{timers.set(++id,f);return id;},clearTimeout:i=>timers.delete(i),
    selectedOutput:output, multiParts:[9,2,12,4].map(channel=>({values:{channel}})),
    webAudioEnabled:false,highlightPianoKey(){},setLastAction(){}, recordMidiTx(){},
    sendVirusParam:(...args)=>params.push(args),midiNoteName:n=>String(n)});
  c.window.currentSynthMode=mode;
  vm.runInContext(html.slice(html.indexOf('  const arpTemplate = {'),html.indexOf('  function buildArpView()')),c);
  return {c,engines:c.window.arpEngines,sent,params,timers};
}
test('Four arps keep independent patterns, chords and controls with a common tempo',()=>{
  const {engines:e}=setup();
  e[0].steps[0]=false;e[0].noteDown(48);e[0].rateIdx=1;e[0].hold=true;e[0].bpm=136;
  assert.equal(e[1].steps[0],true);assert.equal(e[1].heldNotes.length,0);
  assert.equal(e[1].rateIdx,3);assert.equal(e[1].hold,false);assert.equal(e[3].bpm,136);
});
test('Four simultaneous arps address configured MIDI channels and correct native parts without changing levels or filters',()=>{
  const {engines:e,sent,params}=setup();
  e.forEach((engine,i)=>{engine.hold=true;engine.latchNotes=[48+i];engine.start();});
  assert.ok(e.every(x=>x.running));
  assert.deepEqual(sent.filter(b=>(b[0]&240)===144).map(b=>b[0]&15),[9,2,12,4]);
  assert.deepEqual(params.map(p=>p.slice(0,4)),[0,1,2,3].map(i=>[0x71,i,15,0]));
  assert.equal(sent.some(b=>(b[0]&240)===176),false);
  e[1].stop();assert.equal(e[0].running,true);assert.equal(e[2].running,true);
  assert.deepEqual(sent.at(-1),[0x82,49,0]);
});
test('Stop cancels gates and clock, and releases notes on original channel and port',()=>{
  const {c,engines:e,sent,timers}=setup();e[0].hold=true;e[0].start();
  c.multiParts[0].values.channel=7;c.selectedOutput={send(){throw Error('wrong port');}};
  e[0].stop();assert.equal(timers.size,0);assert.equal(e[0].activeNotesPlaying.size,0);
  assert.ok(sent.some(b=>b[0]===0x89));
});
test('Single uses global channel and blocks P2–P4; duplicate Multi channels cannot run together',()=>{
  const single=setup('single');single.engines[0].hold=true;single.engines[0].start();
  single.engines[1].start();assert.equal(single.engines[1].running,false);
  assert.equal(single.sent[0][0],0x95);assert.deepEqual(single.params[0].slice(0,4),[0x71,0x40,15,0]);
  const multi=setup();multi.c.multiParts[1].values.channel=9;
  multi.engines[0].start();multi.engines[1].start();assert.equal(multi.engines[1].running,false);
});
test('Hold-off respects key releases; stop-all removes every scheduler',()=>{
  const {engines:e,c,timers,sent}=setup();e[0].start();assert.equal(sent.length,0);
  e[0].noteDown(60);e[0].tick();assert.ok(sent.some(b=>b[0]===0x99));
  e[0].noteUp(60);assert.equal(e[0].activeNotesPlaying.size,0);
  e[1].hold=true;e[1].start();c.window.stopAllArps();assert.ok(e.every(x=>!x.running));assert.equal(timers.size,0);
});
test('A later gate callback cannot stop the next repeated note',()=>{
  const {engines:e,timers}=setup();e[0].hold=true;e[0].latchNotes=[60];e[0].octaves=1;e[0].start();
  const oldGate=[...e[0].gateTimers][0];e[0].tick();
  assert.equal(timers.has(oldGate),false);assert.equal(e[0].activeNotesPlaying.has(60),true);
});
