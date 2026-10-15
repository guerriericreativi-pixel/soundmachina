const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const source=fs.readFileSync(require('node:path').join(__dirname,'../access-controls.js'),'utf8');
function page(url,session){const dom=new JSDOM('<head></head><body><button id="btnImportSyx">Importa</button><span id="pmAccessRole"></span></body>',{url,runScripts:'outside-only'});if(session)dom.window.VirusHSession=session;dom.window.eval(source);dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));return dom;}
test('User sessions cannot enable management through URL or client session edits',()=>{
 const d=page('https://example.test/app.php?admin=1',{role:'user',csrf:'token'});assert.equal(d.window.VirusAccess.isAdmin,false);assert.throws(()=>d.window.VirusAccess.requireWrite(),/amministratore/);assert.equal(d.window.document.querySelector('#btnImportSyx').hidden,true);
 d.window.VirusHSession.role='admin';assert.equal(d.window.VirusAccess.isAdmin,false);d.window.close();
});
test('A server user session overrides loopback owner preview privileges',()=>{
 const user=page('http://127.0.0.1:8775/app.php',{role:'user'}),owner=page('http://127.0.0.1:8771/'),publicPage=page('https://example.test/');assert.equal(user.window.VirusAccess.isAdmin,false);assert.equal(owner.window.VirusAccess.isAdmin,true);assert.equal(publicPage.window.VirusAccess.isAdmin,false);for(const d of [user,owner,publicPage])d.window.close();
});
test('Patch model writes are guarded while browsing remains available',async()=>{
 const bank=require('../virus-sound-bank'),archive=require('../patch-bank-library'),{webcrypto}=require('node:crypto');globalThis.VirusAccess={requireWrite(){throw Error('Solo amministratore');}};
 try{const model=archive.createModel({bank,crypto:webcrypto,store:{list:async()=>[],merge:()=>{throw Error('Unexpected storage write');}}});assert.deepEqual(await model.list(),[]);await assert.rejects(model.importFiles([{name:'pack.mid',bytes:bank.midiBytes()}]),/amministratore/);await assert.rejects(model.setCover('id',null),/amministratore/);}finally{delete globalThis.VirusAccess;}
});
