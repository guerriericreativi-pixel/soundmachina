const {test}=require('node:test'),assert=require('node:assert/strict'),{webcrypto}=require('node:crypto'),{JSDOM}=require('jsdom');
const archive=require('../patch-bank-library'),bank=require('../virus-sound-bank');
function fixture(){const records=new Map();const store={async list(){return [...records.values()];},async merge(items){let n=0;for(const r of items)if(!records.has(r.id)){records.set(r.id,r);n++;}else if(r.cover&&!records.get(r.id).cover){records.set(r.id,{...records.get(r.id),cover:r.cover});n++;}return n;},async setCover(id,cover){if(!records.has(id))throw Error('Banco non trovato.');records.set(id,{...records.get(id),cover});return 1;}};return {store,model:archive.createModel({store,bank,crypto:webcrypto})};}
test('Full MIDI banks persist as independent collections with original file bytes',async()=>{
 const {model}=fixture(),bytes=bank.midiBytes();assert.equal(await model.importFiles([{name:'Directions.mid',bytes}]),1);const [r]=await model.list();assert.deepEqual(Uint8Array.from(r.file),bytes);assert.equal(r.patches.length,20);assert.equal(r.patches[0].name,'PulseRoot');assert.equal(r.patches[19].position,20);
 assert.equal(await model.importFiles([{name:'Renamed.mid',bytes},{name:'Same.mid',bytes}]),0);
 assert.equal((await model.list())[0].filename,'Directions.mid');
});
test('Repeated patch names in one or several banks do not overwrite each other',async()=>{
 const {model}=fixture();const a=bank.build('skyline'),b=bank.build('skyline');b[49]=80;bank.checksum(b);
 await model.importFiles([{name:'A.mid',bytes:bank.midiFromDumps([a,b])},{name:'B.mid',bytes:bank.midiFromDumps([a])}]);const list=await model.list();assert.equal(list.length,2);assert.equal(list[0].patches.length,2);assert.equal(list[0].patches[0].bytes[49],96);assert.equal(list[0].patches[1].bytes[49],80);
});
test('Corrupt checksums and truncated imports reject the whole batch without partial writes',async()=>{
 const {model}=fixture(),bad=bank.build('skyline');bad[49]^=1;
 await assert.rejects(model.importFiles([{name:'good.mid',bytes:bank.midiBytes()},{name:'bad.syx',bytes:bad}]),/checksum/);assert.equal((await model.list()).length,0);
 await assert.rejects(model.importFiles([{name:'broken.mid',bytes:bank.midiBytes().slice(0,-1)}]));
 const noSounds=Uint8Array.from([77,84,104,100,0,0,0,6,0,0,0,1,1,224,77,84,114,107,0,0,0,4,0,255,47,0]);await assert.rejects(model.parse(noSounds,'notes.mid'),/sole note/);
});
test('Backup restores original banks, is repeatable and rejects invalid bytes before saving',async()=>{
 const {model}=fixture();await model.importFiles([{name:'pack.mid',bytes:bank.midiBytes()}]);const backup=JSON.parse(JSON.stringify(await model.backup())),other=fixture().model;
 assert.equal(await other.restore(backup),1);assert.equal(await other.restore(backup),0);assert.deepEqual((await other.list())[0].file,(await model.list())[0].file);
 const malformed=structuredClone(backup);malformed.banks.push({filename:'bad',file:[256]});await assert.rejects(other.restore(malformed));assert.equal((await other.list()).length,1);
});
test('Legacy Virus dumps validate without inventing extended TI pages',async()=>{
 const {model}=fixture(),b=bank.build('skyline').slice(0,267);b[266]=247;b[265]=Array.from(b.slice(5,265)).reduce((a,x)=>a+x,0)&127;
 const record=await model.parse(b,'Legacy.syx');assert.equal(record.patches[0].bytes.length,267);
});
test('Browsing, importing, searching and export never send MIDI; only an enabled explicit load does',async()=>{
 const {store}=fixture(),dom=new JSDOM('<div id="archive"></div>'),root=dom.window.document.querySelector('#archive'),sent=[],downloads=[];let connected=false;
 const ui=archive.create(root,{store,bank,crypto:webcrypto,context:()=>({connected,label:'P3'}),load:bytes=>{sent.push(bytes);return true;},download:(bytes,name)=>downloads.push([bytes,name])});await ui.ready;
 await ui.importBytes(bank.midiBytes(),'Pack.mid');assert.equal(sent.length,0);assert.equal(root.querySelectorAll('[data-bank-load]').length,20);assert.equal(root.querySelector('[data-bank-load]').disabled,true);
 ui.search('skyline');assert.equal(root.querySelectorAll('[data-bank-load]').length,1);root.querySelector('.pba-patch button:last-child').click();assert.equal(sent.length,0);assert.equal(downloads.length,1);
 connected=true;ui.refresh();root.querySelector('[data-bank-load]').click();await new Promise(setImmediate);assert.equal(sent.length,1);assert.equal(root.querySelector('.pba-status').textContent,'Skyline inviato a P3.');dom.window.close();
});

const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
test('Bank covers persist independently of original MIDI and survive backup and restore',async()=>{
 const {model}=fixture();await model.importFiles([{name:'Pack.mid',bytes:bank.midiBytes()}]);const [original]=await model.list();
 await model.setCover(original.id,png);assert.deepEqual((await model.list())[0].file,original.file);
 const backup=await model.backup(),other=fixture().model;assert.equal(backup.banks[0].cover,png);await other.restore(backup);assert.equal((await other.list())[0].cover,png);
 await model.importFiles([{name:'Renamed.mid',bytes:bank.midiBytes()}]);assert.equal((await model.list())[0].cover,png);
 await model.setCover(original.id,null);assert.equal((await model.list())[0].cover,null);
 // A backup can fill a missing cover on an already present bank.
 assert.equal(await model.restore(backup),1);assert.equal((await model.list())[0].cover,png);
 await assert.rejects(model.setCover('missing',png),/non trovato/);
});
test('Invalid covers reject before persistence and existing v1 backups remain compatible',async()=>{
 const {model}=fixture();await model.importFiles([{name:'Pack.mid',bytes:bank.midiBytes()}]);const [r]=await model.list();
 for(const bad of ['https://example.com/image.png','data:image/svg+xml;base64,PHN2Zy8+','data:image/png;base64,ZmFrZQ=='])await assert.rejects(model.setCover(r.id,bad));
 const copy=await model.backup();copy.banks.push({filename:'Bad.mid',file:Array.from(bank.midiBytes(['skyline'])),cover:'invalid'});await assert.rejects(model.restore(copy));assert.equal((await model.list()).length,1);
 const old=await model.backup();delete old.banks[0].cover;assert.equal(await fixture().model.restore(old),1);
});
test('Cover controls show the saved artwork, allow removal and never send MIDI',async()=>{
 const {store,model}=fixture();await model.importFiles([{name:'Pack.mid',bytes:bank.midiBytes(['skyline'])}]);const [record]=await model.list();await model.setCover(record.id,png);
 const dom=new JSDOM('<div id="archive"></div>'),root=dom.window.document.querySelector('#archive');let sends=0;
 const ui=archive.create(root,{store,bank,crypto:webcrypto,context:()=>({connected:true,label:'Single'}),load:()=>{sends++;},download:()=>{}});await ui.ready;
 assert.equal(root.querySelectorAll('img').length,2);assert.equal(root.querySelector('.pba-cover').src,png);assert.equal(root.querySelector('[data-bank-cover-upload]').textContent,'Cambia copertina');
 [...root.querySelectorAll('button')].find(b=>b.textContent==='Rimuovi copertina').click();await new Promise(setImmediate);
 assert.equal(root.querySelectorAll('img').length,0);assert.equal(root.querySelector('[data-bank-cover-upload]').textContent,'Carica copertina');assert.equal(sends,0);dom.window.close();
});
