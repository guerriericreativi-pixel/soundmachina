const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const acorn = require('acorn');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const functions = new Map();
for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
  const source = match[1];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'FunctionDeclaration') functions.set(node.id.name, source.slice(node.start, node.end));
    Object.values(node).forEach(value => Array.isArray(value) ? value.forEach(visit) : visit(value));
  }
  visit(acorn.parse(source, { ecmaVersion: 'latest' }));
}
function setup(extra = {}) {
  const dom = new JSDOM(html);
  const context = vm.createContext({ document: dom.window.document, window: {}, console, selectedOutput: null,
    SYSEX_PREFIX: [0xF0, 0, 0x20, 0x33, 1], soundPaths:{refresh(){}}, ...extra });
  for (const name of ['updatePatchResultCount', 'selectPatchSource', 'preparePatchForBuffer', 'getSoundEditBuffer', 'loadPatchToActiveBuffer', 'renderMultiLibrary', 'renderLibrary']) {
    vm.runInContext(functions.get(name), context);
  }
  return context;
}
function dump(size) {
  const bytes = new Uint8Array(size);
  bytes.set([0xF0, 0, 0x20, 0x33, 1, 0x10, 0x10, 1, 5]);
  bytes.fill(12, 9, size - 2);
  bytes[size - 1] = 0xF7;
  return bytes;
}

test('PATCH tabs expose one source and maintain keyboard focus and accessible selection', () => {
  const c = setup();
  c.selectPatchSource('multis', true);
  assert.equal(c.document.getElementById('pmMultis').hidden, false);
  assert.equal(c.document.getElementById('pmSounds').hidden, true);
  assert.equal(c.document.getElementById('pmBanks').hidden, true);
  assert.equal(c.document.activeElement.id, 'pmTabMultis');
  assert.equal(c.document.getElementById('pmTabMultis').getAttribute('aria-selected'), 'true');
});

test('Multi search filters names and keeps the total library count', () => {
  const c = setup({ loadMultiLibrary: () => ({ Ambient: {}, Bass: {} }) });
  c.document.getElementById('libSearchInput').value = 'BASS';
  c.renderMultiLibrary();
  assert.equal(c.document.querySelectorAll('#multiLibList .lib-item').length, 1);
  assert.equal(c.document.querySelector('#multiLibList .name').textContent, 'Bass');
  assert.equal(c.document.getElementById('pmMultisCount').textContent, '2');
  c.document.getElementById('libSearchInput').value = 'unknown';
  c.renderMultiLibrary();
  assert.match(c.document.getElementById('multiLibList').textContent, /Nessun Multi/);
});

test('Sound rows show one explicit load destination and filter by name', () => {
  const c = setup({ loadLibrary: () => ({ 'Analog Pad': Array.from(dump(524)), 'Bass': Array.from(dump(267)) }), currentPartIndex: 2 });
  c.window.currentSynthMode = 'multi';
  c.document.getElementById('libSearchInput').value = 'pad';
  c.renderLibrary();
  assert.equal(c.document.querySelectorAll('#libList .lib-item').length, 1);
  assert.equal(c.document.querySelector('#libList button').textContent, 'Carica → P3');
  assert.equal(c.document.querySelectorAll('#libList button').length, 3);
  assert.equal(c.document.getElementById('pmSoundsCount').textContent, '2');
});

test('Readdressing both standard and TI dumps preserves source bytes and fixes the checksum', () => {
  const c = setup();
  for (const size of [267, 524]) {
    const original = dump(size);
    const snapshot = Array.from(original);
    const prepared = c.preparePatchForBuffer(original, 2, 0);
    assert.equal(prepared[5], 0);
    assert.equal(prepared[7], 0);
    assert.equal(prepared[8], 2);
    const expected = Array.from(prepared.slice(5, -2)).reduce((a, b) => a + b, 0) & 0x7F;
    assert.equal(prepared[size - 2], expected);
    assert.deepEqual(Array.from(original), snapshot);
    if (size === 524) {
      assert.deepEqual(Array.from(prepared.slice(9,265)), snapshot.slice(9,265));
      assert.deepEqual(Array.from(prepared.slice(266,-2)), snapshot.slice(266,-2));
      assert.equal(prepared[265], Array.from(prepared.slice(5,265)).reduce((a,b)=>a+b,0)&127);
    } else assert.deepEqual(Array.from(prepared.slice(9, -2)), snapshot.slice(9, -2));
  }
});

test('Loading a sound targets the selected Multi part rather than the inactive Single buffer', () => {
  const sent = [];
  const c = setup({ currentPartIndex: 2, selectedOutput: {}, deviceId: () => 0x10,
    sendMidiBytes: bytes => { sent.push(Array.from(bytes)); return true; },
    applyDumpToActivePatch() {}, renderMultiPartsOverview() {}, setLastAction() {}, uiAlert: message => { throw new Error(message); } });
  c.window.currentSynthMode = 'multi';
  c.loadPatchToActiveBuffer(dump(524));
  assert.equal(sent.length, 1);
  assert.equal(sent[0][8], 2);
  assert.equal(c.window.lastReceivedDump[8], 2);
});

test('Foreign or truncated SysEx is rejected before loading', () => {
  const c = setup();
  assert.throws(() => c.preparePatchForBuffer([0xF0, 0xF7], 0, 0), /non valido/);
  const foreign = dump(267); foreign[2] = 1;
  assert.throws(() => c.preparePatchForBuffer(foreign, 0, 0), /non valido/);
});

test('Original TI programs keep both valid checksums when loading Single or P3',()=>{
  const bank=require('../virus-sound-bank');
  const c=setup();
  const original=bank.build('skyline');
  for(const buffer of [0x40,2]){
    const bytes=c.preparePatchForBuffer(original,buffer,3);
    assert.equal(bytes[265],Array.from(bytes.slice(5,265)).reduce((a,b)=>a+b,0)&127);
    assert.equal(bytes[522],Array.from(bytes.slice(5,522)).reduce((a,b)=>a+b,0)&127);
    assert.equal(bytes[296],1); // E30 oscillator model, after intermediate checksum
    assert.equal(bytes[301],1); // E35
    assert.equal(bytes[8],buffer);
  }
  assert.deepEqual(original,bank.build('skyline'));
});

test('Cached edits preserve both checksums and address the correct TI effect byte',()=>{
  const bank=require('../virus-sound-bank');
  const hardware=require('../virus-hardware-panel');
  const part={dump:Array.from(bank.build('slow-bloom')),sound:{},values:{}};
  const c=vm.createContext({VirusHardwarePanel:hardware,hardwarePart:()=>part,
    hardwareKey:p=>p.page+':'+p.index,hardwareParam:()=>null,hardwareGlobals:{}});
  vm.runInContext(functions.get('cacheHardwareValue'),c);
  c.cacheHardwareValue({page:0x70,index:40},103);
  c.cacheHardwareValue({page:0x6e,index:2},21);
  assert.equal(part.dump[49],103);
  assert.equal(part.dump[268],21);
  assert.equal(part.dump[267],1); // Reverb mode has not been overwritten
  assert.equal(part.dump[265],part.dump.slice(5,265).reduce((a,b)=>a+b,0)&127);
  assert.equal(part.dump[522],part.dump.slice(5,522).reduce((a,b)=>a+b,0)&127);
});

test('The app archives imported banks without flattening names or changing the active sound',async()=>{
  const bank=require('../virus-sound-bank'),archives=require('../patch-bank-library'),{webcrypto}=require('node:crypto');let records=[];
  const model=archives.createModel({bank,crypto:webcrypto,store:{list:async()=>records,merge:async r=>{records.push(...r);return r.length;}}});
  const c=setup({saveLibrary:()=>{throw Error('Must not overwrite flat library');}});
  c.window.virusBankArchive={importBytes:async(bytes,name)=>model.importFiles([{name,bytes}])};
  vm.runInContext(functions.get('parseAndImportSysex'),c);
  await c.parseAndImportSysex(bank.midiBytes(),'Directions-01.mid');
  assert.equal(records.length,1);assert.equal(records[0].patches.length,20);assert.equal(c.document.getElementById('pmArchive').hidden,false);
  for(const [i,p] of bank.programs.entries())assert.deepEqual(records[0].patches[i].bytes,Array.from(bank.build(p.id)));
});


test('PATCH result count follows the active source and contextual search', () => {
  const c = setup();
  c.updatePatchResultCount('sounds', 2, 12);
  assert.equal(c.document.getElementById('pmSearchStatus').textContent, '2 di 12 suoni');
  c.updatePatchResultCount('multis', 4, 4);
  assert.equal(c.document.getElementById('pmSearchStatus').textContent, '2 di 12 suoni');
  c.selectPatchSource('multis');
  assert.equal(c.document.getElementById('pmSearchStatus').textContent, '4 Multi');
  assert.equal(c.document.querySelector('.pm-search-label').textContent, 'Cerca nei Multi');
  c.selectPatchSource('banks');
  assert.match(c.document.getElementById('pmSearchStatus').textContent, /Leggi un banco/);
});

test('An empty sound library offers import and bank navigation without transmitting MIDI', () => {
  const c = setup({ loadLibrary: () => ({}) });
  c.renderLibrary();
  const buttons = c.document.querySelectorAll('#libList button');
  assert.equal(buttons[0].textContent, 'Importa suoni');
  buttons[1].click();
  assert.equal(c.document.getElementById('pmBanks').hidden, false);
  assert.equal(c.document.activeElement.id, 'pmTabBanks');
});
