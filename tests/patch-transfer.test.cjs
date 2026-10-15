const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createTransfer}=require('../patch-bank-library');
const bank=require('../virus-sound-bank');
function fixture(t,changes={}){
 t.mock.timers.reset();t.mock.timers.enable({apis:['setTimeout']});
 const ctx={connected:true,input:true,sysex:true,device:0,buffer:2,key:'out:in:2:0',...changes};
 const sent=[];let receive,removed=0;
 const transfer=createTransfer({context:()=>({...ctx}),prepare(bytes,buffer,device){const d=Uint8Array.from(bytes);d[5]=device;d[7]=0;d[8]=buffer;bank.checksum(d);return d;},send(context,bytes){sent.push([...bytes]);},subscribe(fn){receive=fn;return()=>{removed++;};}});
 return {ctx,sent,transfer,reply:bytes=>receive(bytes),get removed(){return removed;},tick:ms=>t.mock.timers.tick(ms)};
}
test('A load explicitly selects Multi, sends the patch, then requires real readback before resolving',async t=>{
 const f=fixture(t);let done=false;const loading=f.transfer.load(bank.build('skyline')).then(()=>done=true);
 assert.equal(f.sent.length,1);assert.deepEqual(f.sent[0],[240,0,32,51,1,0,115,0,122,2,247]);
 f.tick(200);assert.equal(f.sent[1][8],2);assert.equal(done,false);
 f.reply(f.sent[1]);assert.equal(done,false); // echo before explicit read is not confirmation
 f.tick(600);assert.deepEqual(f.sent[2],[240,0,32,51,1,0,48,0,2,247]);
 f.reply(f.sent[1]);await loading;assert.equal(done,true);assert.equal(f.removed,1);
});
test('Single uses 0x40 and real Device ID, with no permanent bank write',async t=>{
 const f=fixture(t,{buffer:64,device:3,key:'single'}),loading=f.transfer.load(bank.build('skyline'));
 assert.equal(f.sent[0][5],3);assert.equal(f.sent[0][9],0);
 f.tick(200);assert.equal(f.sent[1][7],0);assert.equal(f.sent[1][8],64);
 f.tick(600);f.reply(f.sent[1]);await loading;
});
test('No response and mismatched hardware patches reject instead of optimistic success',async t=>{
 const f=fixture(t);const timeout=assert.rejects(f.transfer.load(bank.build('skyline')),/Nessuna conferma/);
 f.tick(4500);await timeout;assert.equal(f.removed,1);
 const loading=assert.rejects(f.transfer.load(bank.build('skyline')),/suono diverso/);
 f.tick(200);f.tick(600);const wrong=[...f.sent.at(-2)];wrong[49]^=1;
 f.reply(wrong);await loading;assert.equal(f.removed,2);
});
test('A second load and a destination change cannot redirect an in-flight transfer',async t=>{
 const f=fixture(t);const loading=assert.rejects(f.transfer.load(bank.build('skyline')),/destinazione MIDI cambiata/);
 await assert.rejects(f.transfer.load(bank.build('deep-tide')),/già in corso/);
 f.ctx.key='other';f.tick(200);await loading;assert.equal(f.sent.length,1);
});
test('Missing SysEx permission, MIDI IN or output fails before sending',async t=>{
 for(const [changes,message] of [[{connected:false},/MIDI OUT/],[{sysex:false},/SysEx/],[{input:false},/MIDI IN/]]){
  const f=fixture(t,changes);await assert.rejects(f.transfer.load(bank.build('skyline')),message);assert.equal(f.sent.length,0);
 }
});
