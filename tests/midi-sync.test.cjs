const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const acorn = require('acorn');

// Exercise the actual functions embedded in the app, without a connected synth.
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const functions = new Map();
for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
  const source = match[1];
  const tree = acorn.parse(source, { ecmaVersion: 'latest' });
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'FunctionDeclaration') functions.set(node.id.name, source.slice(node.start, node.end));
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    }
  }
  visit(tree);
}

function setup(mode, part = 0) {
  const sent = [];
  const debug = { textContent: '' };
  const context = vm.createContext({
    window: { currentSynthMode: mode, virusDeviceId: 0 }, currentPartIndex: part,
    SYSEX_PREFIX: [0xF0, 0, 0x20, 0x33, 1], deviceId: () => 0x10,
    selectedOutput: { send: bytes => sent.push(Array.from(bytes)) },
    recordMidiTx() {}, setLastAction() {}, console,
    document: { getElementById: () => debug },
    PARAMS: [{ id: 'f1_cutoff', cc: 40, name: 'Cutoff' }],
  });
  for (const name of ['getSoundEditBuffer', 'isActiveSoundDump', 'buildSysEx', 'sendVirusParam', 'sendParam', 'requestDump', 'requestPartDump']) {
    assert.ok(functions.has(name), `App function ${name} exists`);
    vm.runInContext(functions.get(name), context);
  }
  return { context, sent };
}

test('Single reads and edits address the same Single buffer, independently of the UI part', () => {
  const { context: c, sent } = setup('single', 2);
  c.requestDump(2);
  c.requestPartDump(2);
  c.sendParam('f1_cutoff', 93);
  assert.deepEqual(sent.slice(0, 2).map(b => b.slice(6)), [[0x30, 0, 0x40, 0xF7], [0x30, 0, 0x40, 0xF7]]);
  assert.deepEqual(sent.slice(2).map(b => b.slice(6)), [[0x70, 0x40, 40, 93, 0xF7], [0x70, 0x40, 40, 93, 0xF7]]);
});

test('Multi reads and sound edits isolate each selected part, even on shared MIDI channels', () => {
  for (let part = 0; part < 4; part++) {
    const { context: c, sent } = setup('multi', part);
    c.requestDump(part);
    c.requestPartDump(part);
    c.sendParam('f1_cutoff', 93);
    assert.deepEqual(sent.slice(0, 2).map(b => b[8]), [part, part]);
    assert.ok(sent.slice(2).every(b => b[6] === 0x70 && b[7] === part && b[8] === 40 && b[9] === 93));
    assert.deepEqual(sent.slice(2).map(b => b[5]), [0x10, 0]);
  }
});

test('Explicit Multi capture can read a Multi part while the active editor is Single', () => {
  const { context: c, sent } = setup('single');
  c.window.multiFetchState = { active: true };
  c.requestDump(3);
  c.requestPartDump(2, true);
  assert.deepEqual(sent.map(b => b[8]), [3, 2]);
});

test('Late replies from another part or inactive buffer cannot replace the active editor', () => {
  const { context: c } = setup('multi', 2);
  const dump = buffer => [0xF0, 0, 0x20, 0x33, 1, 0, 0x10, 0, buffer];
  assert.equal(c.isActiveSoundDump(dump(2)), true);
  for (const buffer of [0, 1, 3, 0x40]) assert.equal(c.isActiveSoundDump(dump(buffer)), false);
  c.window.currentSynthMode = 'single';
  assert.equal(c.isActiveSoundDump(dump(0x40)), true);
  assert.equal(c.isActiveSoundDump(dump(2)), false);
});

test('Missing MIDI output does not throw or emit a request', () => {
  const { context: c, sent } = setup('single');
  c.selectedOutput = null;
  c.requestDump(0);
  c.requestPartDump(0);
  c.sendParam('f1_cutoff', 93);
  assert.equal(sent.length, 0);
});
