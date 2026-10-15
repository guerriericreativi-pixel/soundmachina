const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs'),vm=require('node:vm');const {JSDOM}=require('jsdom');const dx=require('../dx7-studio');
function frame(data,format){let sum=data.reduce((a,b)=>a+b,0);return new Uint8Array([240,67,0,format,data.length>>7,data.length&127,...data,(-sum)&127,247]);}
function fixtureBank(){const data=new Uint8Array(4096);for(let voice=0;voice<32;voice++){const off=voice*128;for(let op=0;op<6;op++){data.set([99,80,70,60,99,80,70,0],off+op*17);data[off+op*17+12]=7<<3;data[off+op*17+14]=op===5?99:0;data[off+op*17+15]=2;}data[off+110]=31;data[off+117]=24;data.set(Array.from(('VOICE '+String(voice+1).padStart(2,'0')).padEnd(10),c=>c.charCodeAt(0)),off+118);}return frame(data,9);}
test('DX7 VMEM banks decode 32 voices, names and all packed operator fields',()=>{
 const voices=dx.parse(fixtureBank());assert.equal(voices.length,32);assert.equal(voices[31].name,'VOICE 32');assert.equal(voices[0].patch[5*21+16],99);assert.equal(voices[0].patch[5*21+20],7);assert.equal(voices[0].patch[134],31);
 const packed=new Uint8Array(128);packed[11]=2|(3<<2);packed[12]=5|(9<<3);packed[13]=2|(6<<2);packed[15]=1|(21<<1);const p=dx.unpack(packed);assert.equal(p[11],2);assert.equal(p[12],3);assert.equal(p[13],5);assert.equal(p[20],9);assert.equal(p[14],2);assert.equal(p[15],6);assert.equal(p[17],1);assert.equal(p[18],21);
});
test('Unpacked voice export round-trips; corrupt or truncated SysEx never imports',()=>{
 const p=dx.initial();assert.deepEqual(Uint8Array.from(dx.parse(dx.sysex(p))[0].patch),p);
 const bad=fixtureBank();bad[100]^=1;assert.throws(()=>dx.parse(bad),/Checksum/);assert.throws(()=>dx.parse(fixtureBank().slice(0,-1)),/incompleto/);assert.throws(()=>dx.parse([240,0,247]),/Nessuna/);
 const wrapped=new Uint8Array([240,67,16,25,77,0,247,...fixtureBank()]);assert.equal(dx.parse(wrapped).length,32);
});
test('Invalid voice parameters cannot be sent to the engine',()=>{const p=dx.initial();p[134]=32;assert.throws(()=>dx.validate(p));p[134]=0;p[20]=15;assert.throws(()=>dx.sysex(p));});
test('Personal banks persist locally, selectors change the voice, and malformed imports retain the library',async()=>{
 const dom=new JSDOM('<main></main>',{url:'http://dx.test'}),container=dom.window.document.querySelector('main'),downloads=[];
 const ui=dx.create(container,{download:(...v)=>downloads.push(v)});await ui.importFiles([{name:'Original Test.syx',arrayBuffer:async()=>fixtureBank().buffer}]);
 assert.equal(container.querySelector('[data-dx-voice]').options.length,32);
 const select=container.querySelector('[data-dx-voice]');select.value='10';select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));assert.equal(container.querySelector('[data-dx-name]').textContent,'VOICE 11');
 container.querySelector('[data-dx-action=export]').click();assert.equal(dx.parse(downloads[0][0])[0].name,'VOICE 11');
 await ui.importFiles([{name:'broken.syx',arrayBuffer:async()=>new Uint8Array([240,247]).buffer}]);assert.equal(select.options.length,32);assert.match(container.querySelector('[data-dx-message]').textContent,/non completata/);
 const saved=dom.window.localStorage.getItem(dx.KEY);assert.match(saved,/Original Test/);assert.equal(ui.active(),false);dom.window.close();
});
test('WASM engine produces finite non-silent audio for a six-operator voice and panic mutes it',async()=>{
 let Processor,readyResolve;const ready=new Promise(r=>readyResolve=r);const messages=[];
 const c=vm.createContext({WebAssembly,console,performance,sampleRate:44100,AudioWorkletProcessor:class{constructor(){this.port={postMessage:m=>{messages.push(m);if(m.type==='ready')readyResolve();}};}},registerProcessor:(n,p)=>Processor=p});
 vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../vendor/dx7/dx7-worklet.js'),'utf8'),c);const p=new Processor();await ready;
 const voice=dx.initial();for(let op=0;op<6;op++){voice[op*21+16]=65+op*5;voice[op*21+18]=op+1;}
 p.message({type:'patch',data:Array.from(voice)});p.message({type:'midi',data:[144,60,100]});let energy=0;
 for(let b=0;b<150;b++){const out=new Float32Array(128);p.process([],[ [out] ]);for(const n of out){assert.ok(Number.isFinite(n));energy+=n*n;}}
 assert.ok(energy>1);assert.ok(messages.some(m=>m.type==='meter'&&m.peak>.01));p.message({type:'panic'});const silent=new Float32Array(128);p.process([],[ [silent] ]);assert.ok(silent.every(v=>v===0));
});
test('Audio output chooser lists allowed devices and restores selection after a failed switch',async()=>{
 const dom=new JSDOM('<main></main>',{url:'http://dx.test'}),win=dom.window,container=win.document.querySelector('main');
 const sinks=[];
 win.AudioContext=class{constructor(){this.audioWorklet={addModule:async()=>{}};this.currentTime=0;this.destination={};}async setSinkId(id){if(id==='broken')throw Error('Dispositivo non disponibile');sinks.push(id);}createGain(){return {gain:{value:0,setTargetAtTime(){}},connect(){}};}async resume(){}async close(){}};
 win.AudioWorkletNode=class{constructor(){this.port={postMessage(){}};setTimeout(()=>this.port.onmessage({data:{type:'ready'}}),0);}connect(){return this;}};
 Object.defineProperty(win.navigator,'mediaDevices',{value:{enumerateDevices:async()=>[{kind:'audiooutput',deviceId:'virus',label:'Virus TI Snow'},{kind:'audiooutput',deviceId:'broken',label:'Scollegata'}],selectAudioOutput:async()=>({kind:'audiooutput',deviceId:'virus',label:'Virus TI Snow'}),addEventListener(){}}});
 dx.create(container);const settle=()=>new Promise(r=>setTimeout(r,15));await settle();
 container.querySelector('[data-dx-action=output]').click();await settle();const select=container.querySelector('[data-dx-output]');assert.equal(select.value,'virus');
 container.querySelector('[data-dx-action=audio]').click();await settle();assert.deepEqual(sinks,['virus']);
 select.value='broken';select.dispatchEvent(new win.Event('change',{bubbles:true}));await settle();assert.equal(select.value,'virus');assert.match(container.querySelector('[data-dx-output-status]').textContent,/non modificata/);
 select.value='';select.dispatchEvent(new win.Event('change',{bubbles:true}));await settle();assert.equal(sinks.at(-1),'');win.close();
});
test('Browsers without output routing explain the system fallback without requesting microphone access',()=>{
 const dom=new JSDOM('<main></main>',{url:'http://dx.test'}),container=dom.window.document.querySelector('main');dx.create(container);
 assert.equal(container.querySelector('[data-dx-output]').disabled,true);assert.match(container.querySelector('[data-dx-output-status]').textContent,/uscita del sistema/);assert.equal(container.querySelector('[data-dx-action=output]').hidden,true);dom.window.close();
});
test('Device permission is explicit and microphone tracks are stopped immediately',async()=>{
 const dom=new JSDOM('<main></main>',{url:'http://dx.test'}),win=dom.window,container=win.document.querySelector('main');let permissions=0,stops=0;
 win.AudioContext=class{async setSinkId(){}};
 Object.defineProperty(win.navigator,'mediaDevices',{value:{enumerateDevices:async()=>permissions?[{kind:'audiooutput',deviceId:'virus',label:'Virus TI Snow'}]:[],getUserMedia:async()=>{permissions++;return {getTracks:()=>[{stop(){stops++;}}]};},addEventListener(){}}});
 dx.create(container);const settle=()=>new Promise(r=>setTimeout(r,5));await settle();assert.equal(permissions,0);
 const button=container.querySelector('[data-dx-action=output]');button.click();await settle();assert.equal(permissions,0);assert.match(container.querySelector('[data-dx-output-status]').textContent,/permesso microfono/);
 button.click();await settle();assert.equal(permissions,1);assert.equal(stops,1);assert.equal(container.querySelector('[data-dx-output]').options[1].textContent,'Virus TI Snow');win.close();
});
