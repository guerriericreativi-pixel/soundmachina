const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const bank=require('../virus-sound-bank');
const paths=require('../sound-paths');
const sum=bytes=>Array.from(bytes).reduce((a,b)=>a+b,0)&127;

test('Twenty complete, distinct TI programs use original ten-character names',()=>{
  assert.equal(bank.programs.length,20);
  const names=new Set(),payloads=new Set();
  for(const p of bank.programs){
    assert.match(p.name,/^[A-Za-z0-9]{1,10}$/);
    names.add(p.name);
    const bytes=bank.build(p.id);
    assert.equal(bytes.length,524);
    assert.deepEqual([...bytes.slice(0,9)],[240,0,32,51,1,16,16,0,64]);
    assert.equal(bytes[523],247);
    assert.ok(bytes.slice(1,-1).every(n=>n<128));
    assert.equal(bytes[265],sum(bytes.slice(5,265)));
    assert.equal(bytes[522],sum(bytes.slice(5,522)));
    assert.equal(String.fromCharCode(...bytes.slice(249,259)).trim(),p.name);
    // Decode the intermediate checksum out of the wire representation.
    const data=Uint8Array.from([...bytes.slice(9,265),...bytes.slice(266,522)]);
    assert.equal(data.length,512);
    assert.equal(data[0],12);
    assert.equal(data[21],96);assert.equal(data[31],96);
    assert.ok(data[91]>=88&&data[91]<=104);
    assert.equal(data[128+15],0); // no automatic arpeggiator
    assert.equal(data[128+39],0); // vocoder off
    assert.equal(data[384+124],0); // audio input off
    assert.equal(data[384+126],0); // Atomizer off
    assert.equal(data[128+64],3);assert.ok(data[128+65]>0); // wheel -> patch-specific gesture
    payloads.add(Buffer.from(data).toString('base64'));
  }
  assert.equal(names.size,20);assert.equal(payloads.size,20);
  for(const style of ['trance','psytrance','techno','ambient','synthwave']){
    const set=bank.programs.filter(p=>p.style===style);
    assert.equal(set.length,4);
    assert.ok(set.some(p=>p.role==='Basso'));assert.ok(set.some(p=>p.role==='Lead'));assert.ok(set.some(p=>p.role==='Pad'));
  }
  assert.throws(()=>bank.build('missing'));
});

test('Complete bank contains twenty edit-buffer messages and individual exports are independent',()=>{
  const bytes=bank.bankBytes();assert.equal(bytes.length,10480);
  bank.programs.forEach((p,i)=>assert.deepEqual(bytes.slice(i*524,(i+1)*524),bank.build(p.id)));
  const altered=bank.build('skyline');altered[9+40]=0;
  assert.equal(bank.build('skyline')[9+40],96);
  assert.equal(bank.build('skyline')[266+30],1);
  assert.equal(bank.build('skyline')[266+35],1);
});

test('Percorsi revision 3 has expressive routes, restrained bass width and working effect modes',()=>{
  for(const p of bank.programs){
    const b=bank.build(p.id),a=i=>b[9+i],B=i=>b[137+i],e=i=>b[266+i];
    assert.equal(p.revision,3);
    assert.notDeepEqual(b,bank.buildBase(p.id));
    assert.equal(B(64),3); // wheel
    assert.equal(B(67),24); // note velocity
    assert.equal(B(72),2); // channel pressure
    assert.equal(B(106),11);assert.equal(B(62),9); // first soft knob -> CC12 routes
    assert.equal(B(63),1); // second -> modulation wheel
    if(a(105)>0)assert.ok(a(103)>0,'Chorus mix needs an enabled algorithm');
    if(a(113)>0)assert.ok(a(112)>0,'Delay send needs an enabled algorithm');
    if(e(2)>0)assert.ok(e(1)>0,'Reverb send needs an enabled algorithm');
    if(p.role==='Basso'){
      assert.equal(b[514],0,'Bass fundamentals keep a single unison voice');
      assert.equal(a(105),0,'Bass fundamentals keep chorus off');
    }
    for(const i of [92,95,96])assert.ok(B(i)>=58&&B(i)<=70,'EQ does not copy extreme reference-bank boosts');
  }
  assert.equal(bank.build('dew-keys')[39],86); // dynamic FM, not just a fixed FM value
  const evolving=bank.build('slow-bloom');
  assert.equal(evolving[137+103],38); // additional envelope drives the evolution
  assert.equal(evolving[266+80],106);
  assert.equal(bank.build('glass-run')[266+30],2); // digital pluck: wavetable
  assert.equal(bank.build('spore-mist')[266+30],3); // texture: native Wave PWM
  assert.equal(evolving[266+30],2); // pad: wavetable plus HyperSaw
  assert.equal(bank.build('skyline')[514],0); // dense source without stacking extra voices
  const gestures=new Set(bank.programs.map(p=>{const b=bank.build(p.id);return [b[202],b[203],b[356],b[357],b[358],b[359]].join(',');}));
  assert.ok(gestures.size>=15,'Wheel articulation varies with the selected sound');
});

test('Percorsi edits preserve the pre-existing instrument programs byte for byte',()=>{
  const crypto=require('node:crypto'),instruments=require('../studio-instruments');
  const hashes=instruments.presets(bank).map(p=>[p.id,crypto.createHash('sha256').update(Buffer.from(p.bytes)).digest('hex')]);
  const digest=crypto.createHash('sha256').update(JSON.stringify(hashes)).digest('hex');
  assert.equal(digest,'aa9b3ca4d3abc24f7072f459a774e84f5f072fdd8f555d49b921368c18fd8e71');
});

test('Adding original sounds is repeatable and preserves a user sound with the same name',()=>{
  const existing={PulseRoot:[1,2,3],Personal:[4,5,6]};
  const first=bank.addToLibrary(existing);
  assert.equal(first.added,19);assert.equal(Object.keys(first.library).length,21);
  assert.deepEqual(existing,{PulseRoot:[1,2,3],Personal:[4,5,6]});
  assert.deepEqual(first.library.PulseRoot,[1,2,3]);
  const second=bank.addToLibrary(first.library);assert.equal(second.added,0);
  const style=bank.addToLibrary({},bank.programs.filter(p=>p.style==='ambient').map(p=>p.id));
  assert.equal(style.added,4);
  assert.throws(()=>bank.addToLibrary({},['unknown']));
});

function ui(connected){
  const dom=new JSDOM('<main></main>');const root=dom.window.document.querySelector('main');
  const sent=[],exports=[],saved=[];
  const bridge={bank,context:()=>({connected,label:'P3'}),apply:()=>{throw Error('Unexpected parameter writes');},
    loadSound:async id=>{sent.push(id);return {label:'P3'};},addSounds:ids=>{saved.push(ids);return ids.length;},exportSound:id=>exports.push(id),open:()=>{},configureMidi:()=>{}};
  paths.create(root,bridge);
  return {dom,root,sent,exports,saved,bridge};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('Offline browsing, exports and library additions never load hardware',()=>{
  const {dom,root,sent,exports,saved}=ui(false);
  root.querySelector('[data-vsp-path=synthwave]').click();
  assert.equal(root.querySelectorAll('[data-vsp-load]').length,4);
  assert.ok([...root.querySelectorAll('[data-vsp-load]')].every(b=>b.disabled));
  root.querySelector('[data-vsp-export=night-drive]').click();
  root.querySelector('[data-vsp-action=add-sounds]').click();
  assert.deepEqual(exports,['night-drive']);assert.equal(saved[0].length,4);assert.equal(sent.length,0);
  root.querySelector('[data-vsp-path=materia]').click();
  assert.equal(root.querySelectorAll('[data-vsp-load]').length,0);
  dom.window.close();
});
test('Explicit full-sound load updates console from the exact program including TI reverb',async()=>{
  const {dom,root,sent}=ui(true);
  root.querySelector('[data-vsp-path=ambient]').click();
  root.querySelector('[data-vsp-load=slow-bloom]').click();
  assert.ok([...root.querySelectorAll('[data-vsp-path]')].every(b=>b.disabled));
  await flush();
  assert.deepEqual(sent,['slow-bloom']);
  assert.equal(root.querySelector('input[aria-label=Cutoff]').value,'73');
  assert.equal(root.querySelector('input[aria-label="Reverb send"]').value,'40');
  assert.match(root.querySelector('.vsp-status').textContent,/SlowBloom inviato a P3/);
  dom.window.close();
});
test('Failed full-sound loads retain the draft and report interruption',async()=>{
  const {dom,root,bridge}=ui(true);
  bridge.loadSound=async()=>{throw Error('Disconnected');};
  root.querySelector('[data-vsp-load=skyline]').click();await flush();
  assert.match(root.querySelector('.vsp-status').textContent,/Invio interrotto: Disconnected/);
  assert.equal(root.querySelector('input[aria-label=Cutoff]').value,'96');
  assert.equal(root.querySelector('[data-vsp-path=ambient]').disabled,false);
  dom.window.close();
});

test('Checked-in syx files match the generated bank and metadata',()=>{
  const folder=path.join(__dirname,'../assets/sound-bank');
  assert.deepEqual(fs.readFileSync(path.join(folder,'VIRUS-H-Directions-01.syx')),Buffer.from(bank.bankBytes()));
  for(const p of bank.programs)assert.deepEqual(fs.readFileSync(path.join(folder,p.name+'.syx')),Buffer.from(bank.build(p.id)));
});

test('MIDI export has a valid SMF type-0 header, track length and SysEx length field',()=>{
  const bytes=bank.midiBytes(),view=new DataView(bytes.buffer);
  assert.equal(Buffer.from(bytes.slice(0,4)).toString(),'MThd');
  assert.equal(view.getUint32(4),6);assert.equal(view.getUint16(8),0);
  assert.equal(view.getUint16(10),1);assert.equal(view.getUint16(12),480);
  assert.equal(Buffer.from(bytes.slice(14,18)).toString(),'MTrk');
  assert.equal(view.getUint32(18),bytes.length-22);
  const first=bytes.indexOf(240);
  assert.deepEqual([...bytes.slice(first+1,first+3)],[0x84,0x0b]); // VLQ 523
  assert.deepEqual(bytes.slice(first+3,first+526),bank.build('pulse-root').slice(1));
  const decoded=bank.extractSysEx(bytes);
  assert.equal(decoded.length,20);
  bank.programs.forEach((p,i)=>assert.deepEqual(decoded[i],bank.build(p.id)));
  assert.deepEqual(bank.extractSysEx(bank.midiBytes(['skyline'])),[bank.build('skyline')]);
  assert.deepEqual(bank.extractSysEx(bank.bankBytes()),decoded);
  assert.throws(()=>bank.midiBytes([]));
  assert.deepEqual(fs.readFileSync(path.join(__dirname,'../assets/sound-bank/VIRUS-H-Directions-01.mid')),Buffer.from(bytes));
});

function vlq(n){const a=[n&127];while((n>>>=7))a.unshift((n&127)|128);return a;}
function midiFixture(tracks){
  const bytes=[77,84,104,100,0,0,0,6,0,tracks.length>1?1:0,0,tracks.length,1,224];
  for(const track of tracks)bytes.push(77,84,114,107,0,0,(track.length>>8)&255,track.length&255,...track);
  return Uint8Array.from(bytes);
}
test('MIDI import handles multiple tracks, meta bytes, running status and split SysEx packets',()=>{
  const sound=bank.build('rose-lead');
  const tempo=[0,255,1,3,240,247,127,0,255,47,0]; // text resembling SysEx is ignored
  const notes=[0,144,60,100,0,62,90,0,128,60,0];
  const split=[0,240,...vlq(299),...sound.slice(1,300),0,247,...vlq(sound.length-300),...sound.slice(300),0,255,47,0];
  assert.deepEqual(bank.extractSysEx(midiFixture([tempo,[...notes,...split]])),[sound]);
  const escaped=[0,247,...vlq(sound.length),...sound,0,255,47,0];
  assert.deepEqual(bank.extractSysEx(midiFixture([escaped])),[sound]);
});
test('Malformed or truncated MIDI/SysEx cannot return a partially imported bank',()=>{
  const bytes=bank.midiBytes();
  for(const input of [bytes.slice(0,12),bytes.slice(0,-1),bank.bankBytes().slice(0,-1),midiFixture([[0,240,0x81]]),midiFixture([[0,60,100,0,255,47,0]])]){
    assert.throws(()=>bank.extractSysEx(input),/non valido/);
  }
});
