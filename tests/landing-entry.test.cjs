const {test, before, after} = require('node:test');
const assert = require('node:assert/strict');
const {spawn, execFileSync} = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const root = path.resolve(__dirname, '..');
let server, directory, base, config;
const code = 'VIRUS-integration-test-only';
const adminCode='VIRUS-ADMIN-integration-test-only';
function client(){
  let cookie = '';
  return async (url, options={}) => {
    const response = await fetch(base+url,{redirect:'manual',...options,headers:{...(cookie?{Cookie:cookie}:{}),...options.headers}});
    const setCookie=response.headers.get('set-cookie');
    if(setCookie)cookie=setCookie.split(';')[0];
    return response;
  };
}
async function form(request){
  const response=await request('/'); const text=await response.text();
  const match=text.match(/name="csrf" value="([a-f0-9]+)"/);
  assert.ok(match,'A real server CSRF token is rendered'); return match[1];
}
function post(request, fields){return request('/index.php',{method:'POST',body:new URLSearchParams(fields)});}
before(async()=>{
  directory=fs.mkdtempSync(path.join(os.tmpdir(),'virus-entry-test-'));
  const publicDir=path.join(directory,'public');fs.mkdirSync(publicDir);
  for(const file of ['index.php','app.php','access.php','banks.php','landing.php'])fs.copyFileSync(path.join(root,'web-entry',file),path.join(publicDir,file));
  fs.mkdirSync(path.join(publicDir,'.editor'));fs.writeFileSync(path.join(publicDir,'.editor/index.html'),'<!doctype html><title>Protected editor fixture</title>');
  const hash=execFileSync('php',['-r','echo password_hash($argv[1], PASSWORD_DEFAULT);',code],{encoding:'utf8'});
  const adminHash=execFileSync('php',['-r','echo password_hash($argv[1], PASSWORD_DEFAULT);',adminCode],{encoding:'utf8'});
  config=path.join(directory,'config.php');
  fs.writeFileSync(config,`<?php return ['code_hash'=>'${hash}','admin_hash'=>'${adminHash}','state_dir'=>'${path.join(directory,'state')}'];`);
  const socket=net.createServer(); await new Promise(resolve=>socket.listen(0,'127.0.0.1',resolve)); const port=socket.address().port;await new Promise(resolve=>socket.close(resolve));
  base=`http://127.0.0.1:${port}`;
  server=spawn('php',['-S',`127.0.0.1:${port}`,'-t',publicDir,path.join(root,'tools/landing/router.php')],{env:{...process.env,VIRUS_INVITE_CONFIG:config},stdio:'ignore'});
  for(let i=0;i<60;i++){try{await fetch(base);return;}catch{await new Promise(resolve=>setTimeout(resolve,50));}}
  throw Error('PHP preview did not start');
});
after(()=>{server?.kill();if(directory)fs.rmSync(directory,{recursive:true,force:true});});

test('Landing is public; direct editor and legacy URL require a server session',async()=>{
  const request=client();const response=await request('/');const html=await response.text();
  assert.equal(response.status,200);assert.match(html,/Più spazio/);assert.ok(!html.includes(code));
  assert.match(response.headers.get('set-cookie'),/HttpOnly/i);assert.match(response.headers.get('set-cookie'),/SameSite=Lax/i);
  for(const url of ['/app.php','/index.html']){const blocked=await request(url);assert.equal(blocked.status,302);assert.equal(blocked.headers.get('location'),'./#accesso');}
  for(const url of ['/.editor/index.html','/.access/config.php','/access.php','/landing.php']) assert.equal((await request(url)).status,403);
});
test('Invalid CSRF and incorrect codes stay outside the editor with useful feedback',async()=>{
  const request=client();await form(request);
  assert.equal((await post(request,{csrf:'invalid',invite_code:code})).status,403);
  const response=await post(request,{csrf:await form(request),invite_code:'wrong-code'});
  assert.equal(response.status,401);assert.match(await response.text(),/Il codice non è valido/);
  assert.equal((await request('/app.php')).status,302);
});
test('A valid invite creates access, rotates the session, and logout revokes access',async()=>{
  const request=client();const csrf=await form(request);
  const success=await post(request,{csrf,invite_code:code});assert.equal(success.status,303);assert.equal(success.headers.get('location'),'app.php');
  const editor=await request('/app.php');assert.equal(editor.status,200);assert.match(await editor.text(),/Protected editor fixture/);
  const page=await request('/');const html=await page.text();assert.match(html,/Apri VIRUS-H/);
  const token=html.match(/name="csrf" value="([a-f0-9]+)"/)[1];assert.notEqual(token,csrf);
  assert.equal((await post(request,{csrf:token,action:'logout'})).status,303);
  assert.equal((await request('/app.php')).status,302);
});
test('Missing invite configuration fails closed',async()=>{
  const request=client();const csrf=await form(request);
  fs.renameSync(config,config+'.saved');
  try {
    const response=await post(request,{csrf,invite_code:code});
    assert.equal(response.status,503);
    assert.match(await response.text(),/inviti non sono ancora attivi/);
    assert.equal((await request('/app.php')).status,302);
  } finally {fs.renameSync(config+'.saved',config);}
});

test('The server separates user and admin authority and validates bank writes',async()=>{
  const anonymous=client();assert.equal((await anonymous('/banks.php')).status,401);
  const user=client();await post(user,{csrf:await form(user),invite_code:code});
  const userPage=await (await user('/app.php')).text();assert.match(userPage,/"role":"user"/);const userToken=JSON.parse(userPage.match(/window.VirusHSession=(.*?);<\/script>/)[1]).csrf;
  const write=(request,token,body)=>request('/banks.php',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':token},body:JSON.stringify(body)});
  assert.equal((await write(user,userToken,{action:'merge',role:'admin',banks:[]})).status,403);
  const admin=client();const login=await post(admin,{csrf:await form(admin),invite_code:adminCode});assert.equal(login.status,303);
  assert.match(login.headers.get('set-cookie'),/Max-Age=2592000/);
  const adminPage=await (await admin('/app.php')).text();const session=JSON.parse(adminPage.match(/window.VirusHSession=(.*?);<\/script>/)[1]);assert.equal(session.role,'admin');
  const bank=require('../virus-sound-bank');const payload={action:'merge',banks:[{filename:'Directions.mid',file:Array.from(bank.midiBytes())}]};
  assert.equal((await write(admin,'wrong',payload)).status,403);
  const imported=await write(admin,session.csrf,payload);assert.equal(imported.status,200,await imported.clone().text());assert.equal((await imported.json()).changed,1);
  const published=await (await user('/banks.php')).json();assert.equal(published.banks.length,1);assert.equal(bank.extractSysEx(published.banks[0].file).length,20);
  const invalid=Array.from(bank.build('skyline'));invalid[49]^=1;assert.equal((await write(admin,session.csrf,{action:'merge',banks:[{filename:'Bad.syx',file:invalid}]})).status,422);
  assert.equal((await (await user('/banks.php')).json()).banks.length,1);
  assert.equal((await write(user,userToken,{action:'cover',id:published.banks[0].id,cover:null})).status,403);
  assert.equal((await write(admin,session.csrf,{action:'merge',banks:payload.banks})).status,200);
  await post(admin,{csrf:session.csrf,action:'logout'});assert.equal((await admin('/banks.php')).status,401);
});

test('Rate limiting survives a new browser session',async()=>{
  for(let i=0;i<8;i++){const request=client();const token=await form(request);assert.equal((await post(request,{csrf:token,invite_code:'incorrect'})).status,401);}
  const fresh=client();const blocked=await post(fresh,{csrf:await form(fresh),invite_code:code});
  assert.equal(blocked.status,429);assert.ok(Number(blocked.headers.get('retry-after'))>0);
  assert.equal((await fresh('/app.php')).status,302);
});
