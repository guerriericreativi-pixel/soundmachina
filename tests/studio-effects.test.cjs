const {test}=require('node:test');const assert=require('node:assert/strict');const bank=require('../virus-sound-bank'),fx=require('../studio-effects'),studio=require('../sound-studio');
test('FX descriptors use real A/B/E offsets and bounded writes',()=>{
 const base=bank.build('velvet-air'),snapshot=base.slice();const result=studio.canonical(fx.apply(base,{114:55,122:23,124:35,268:29,270:77,238:22,222:25,232:68}));
 const changes=studio.parameterChanges(base,result);for(const [page,index,value] of [[112,105,55],[112,113,23],[112,115,35],[110,2,29],[110,4,77],[113,101,22],[113,85,25],[113,95,68]])assert.ok(changes.some(c=>c.page===page&&c.index===index&&c.value===value));
 assert.throws(()=>fx.apply(base,{9:127}));assert.throws(()=>fx.apply(base,{237:26}));assert.throws(()=>fx.apply(base,{269:4}));assert.throws(()=>fx.apply(base,{122:128}));assert.deepEqual(base,snapshot);
});
test('FX sends enable their algorithms; dry comparison preserves timbre and the wet source',()=>{
 const base=bank.build('velvet-air');base[267]=0;base[121]=0;base[237]=0;base[112]=0;const wet=fx.apply(base,{268:25,122:20,238:13,114:42});assert.equal(wet[267],1);assert.equal(wet[121],1);assert.equal(wet[237],1);assert.equal(wet[112],1);const snapshot=wet.slice(),dry=fx.dry(wet);
 for(const offset of [114,122,222,237,268])assert.equal(dry[offset],0);for(const offset of [229,232,233])assert.equal(dry[offset],64);for(const offset of [26,29,40,49,68,100])assert.equal(dry[offset],wet[offset]);assert.deepEqual(wet,snapshot);assert.deepEqual(fx.apply(wet,{}),wet);
});
test('Suggested FX are bounded, distinguish sound roles and work with legacy patch limits',()=>{
 for(const role of ['Basso','Lead','Pad','Keys','Pluck','FX','Suono'])assert.doesNotThrow(()=>fx.apply(bank.build('velvet-air'),fx.suggested(role)));
 assert.equal(fx.suggested('Basso')[268],0);assert.ok(fx.suggested('Pad')[270]>fx.suggested('Keys')[270]);const legacy=bank.build('velvet-air').slice(0,267);assert.throws(()=>fx.apply(legacy,{268:10}));assert.equal(fx.dry(legacy).length,267);
});
test('Explicit drive Off stays off even when its retained intensity is nonzero',()=>{
 const base=bank.build('velvet-air');base[237]=2;base[238]=25;assert.equal(fx.apply(base,{237:0,238:25})[237],0);assert.equal(fx.apply(base,{237:0,238:25,268:10})[237],0);
});
