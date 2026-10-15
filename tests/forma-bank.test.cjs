const {test}=require('node:test');const assert=require('node:assert/strict');const {JSDOM}=require('jsdom');const bank=require('../virus-sound-bank'),forma=require('../forma-bank'),panels=require('../studio-instruments'),studio=require('../sound-studio');
test('FORMA Classic Studies contains 16 distinct full Virus TI programs with both checksums',()=>{
 const hashes=new Set();assert.equal(forma.programs.length,16);
 for(const p of forma.programs){const bytes=forma.build(bank,p);assert.equal(bytes.length,524);assert.deepEqual(bytes,forma.build(bank,p));assert.equal(bytes[265],Array.from(bytes.slice(5,265)).reduce((a,b)=>a+b,0)&127);assert.equal(bytes[522],Array.from(bytes.slice(5,522)).reduce((a,b)=>a+b,0)&127);assert.ok(bytes.slice(1,-1).every(b=>b<128));hashes.add(studio.signature(bytes));assert.equal(bytes[100],100);assert.equal(bytes[296],0);assert.equal(bytes[301],0);assert.equal(bytes[268],0);assert.equal(bytes[122],0);assert.equal(bytes[514],0);assert.equal(bytes[515],0);assert.equal(bytes[169],0);assert.equal(bytes[61],1);assert.equal(bytes[62],1);for(const [amp,filter] of [[59,54],[60,55],[61,56],[63,58]])assert.equal(bytes[9+amp],bytes[9+filter]);}
 assert.equal(hashes.size,16);const dumps=bank.extractSysEx(forma.midi(bank));assert.equal(dumps.length,16);for(let i=0;i<16;i++)assert.deepEqual(Uint8Array.from(dumps[i]),forma.build(bank,forma.programs[i]));
});
test('FORMA selectors and faders map to real linked Virus parameters',()=>{
 const base=forma.build(bank,forma.programs[0]);let result=panels.apply(base,{32:37,88:56,83:70,50:24},'poly');assert.equal(result[32],37);assert.equal(result[76],56);assert.equal(result[84],70);assert.equal(result[169],0);assert.equal(result[61],1);assert.equal(result[62],1);
 result=panels.apply(base,panels.switches('octave','52'),'poly');assert.equal(result[29],52);assert.equal(result[34],52);
 for(const [wave,balance] of [['saw',0],['pulse',127],['both',64]]){result=panels.apply(base,panels.switches('wave',wave),'poly');assert.equal(result[26],64);assert.equal(result[31],127);assert.equal(result[42],balance);}
 assert.throws(()=>panels.switches('octave','999'));assert.throws(()=>panels.switches('wave','invalid'));
});
test('FORMA panel has ordered sections, real patch selector and 61 playable keys',()=>{
 const presets=panels.presets(bank).filter(p=>p.instrument==='poly'),p=presets[4];const html=panels.render('poly',p.bytes,'fm',{presets,id:p.id,name:p.name});const dom=new JSDOM(html),doc=dom.window.document;
 assert.deepEqual([...doc.querySelectorAll('legend')].map(e=>e.textContent),['LFO','DCO','HPF','VCF','VCA','ENV','CHORUS']);assert.equal(doc.querySelector('[data-instrument-preset]').options.length,20);assert.equal(doc.querySelector('[data-instrument-preset]').value,p.id);assert.equal(doc.querySelectorAll('[data-studio-note]').length,61);assert.equal(doc.querySelectorAll('[data-instrument-switch]').length,6);assert.ok(doc.querySelector('[data-studio-action=forma-bank]'));dom.window.close();
});
