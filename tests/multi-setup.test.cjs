const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const acorn = require('acorn');
const api = require('../multi-setup.js');
const code = fs.readFileSync(path.join(__dirname, '..', 'multi-setup.js'), 'utf8');
const parts = () => Array.from({ length: 4 }, (_, i) => ({ name: `Suono ${i + 1}`, enabled: true, values: { bank: 0, program: i, volume: 90 + i, pan: 64 } }));
const functions = new Map();
for (const match of fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
  const source = match[1];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'FunctionDeclaration') functions.set(node.id.name, source.slice(node.start, node.end));
    Object.values(node).forEach(value => Array.isArray(value) ? value.forEach(visit) : visit(value));
  }
  visit(acorn.parse(source, { ecmaVersion: 'latest' }));
}
function ui(overrides = {}) {
  const dom = new JSDOM('<button id="entry">Nuovo setup</button>');
  const c = vm.createContext({ document: dom.window.document, window: {}, console });
  vm.runInContext(code, c);
  const writes = [];
  const wizard = c.window.VirusMultiSetup.create({ banks: ['RAM-A', 'RAM-B'], parts, patchName: () => '', connected: () => true,
    exists: () => false, apply: async draft => writes.push(JSON.parse(JSON.stringify(draft))), openLibrary() {}, configureMidi() {}, ...overrides });
  const dialog = c.document.querySelector('dialog');
  dialog.showModal = () => dialog.setAttribute('open', '');
  dialog.close = () => dialog.removeAttribute('open');
  wizard.open();
  const input = (selector, value) => { const el = dialog.querySelector(selector); el.value = value; el.dispatchEvent(new dom.window.Event('input')); };
  const next = () => dialog.querySelector('[data-ms-next]').onclick();
  return { c, dialog, wizard, writes, input, next };
}

test('Draft preserves all four sounds and volumes without mutating current parts', () => {
  const original = parts(), before = JSON.stringify(original);
  const draft = api.createDraft(original);
  assert.equal(draft.parts.length, 4);
  assert.ok(draft.parts.every(p => p.source === 'keep'));
  assert.deepEqual(draft.parts.map(p => p.volume), [90, 91, 92, 93]);
  draft.parts[0].volume = 20;
  assert.equal(JSON.stringify(original), before);
});

test('Validation rejects empty names, invalid programs and out-of-range levels', () => {
  const draft = api.createDraft(parts());
  assert.match(api.validateDraft(draft, 2), /nome/);
  draft.name = 'Concerto'; draft.parts[2].source = 'bank'; draft.parts[2].program = 128;
  assert.match(api.validateDraft(draft, 2), /P3/);
  draft.parts[2].program = 127; draft.parts[0].volume = -1;
  assert.match(api.validateDraft(draft, 2), /P1/);
});

test('Full guide sends nothing before final action, then shows success only after apply resolves', async () => {
  const u = ui();
  u.input('#msName', 'Concerto');
  await u.next(); await u.next(); await u.next();
  assert.equal(u.writes.length, 0);
  assert.match(u.dialog.textContent, /Applica e salva setup/);
  await u.next();
  assert.equal(u.writes.length, 1);
  assert.equal(u.writes[0].name, 'Concerto');
  assert.match(u.dialog.textContent, /Setup salvato: Concerto/);
});

test('Disconnected preview cannot apply, and closing retains the draft', async () => {
  const u = ui({ connected: () => false });
  u.input('#msName', 'Bozza');
  await u.next(); await u.next(); await u.next();
  assert.equal(u.dialog.querySelector('[data-ms-next]').disabled, true);
  u.dialog.querySelector('[data-ms-close]').click();
  u.wizard.open();
  assert.match(u.dialog.textContent, /Bozza/);
  assert.equal(u.writes.length, 0);
});

test('Duplicate names and MIDI failures do not produce a success screen', async () => {
  for (const overrides of [{ exists: () => true }, { apply: async () => { throw new Error('MIDI interrotto'); } }]) {
    const u = ui(overrides);
    u.input('#msName', 'Concerto');
    await u.next(); await u.next(); await u.next(); await u.next();
    assert.doesNotMatch(u.dialog.textContent, /Setup salvato:/);
    assert.ok(u.dialog.querySelector('[role="alert"]').textContent.length > 0);
  }
});

function captureContext() {
  const timers = [], reads = [], saved = [];
  const c = vm.createContext({ window: { currentSynthMode: 'multi' }, selectedOutput: {}, selectedInput: {}, multiRead: null,
    SYSEX_PREFIX: [0xF0, 0, 0x20, 0x33, 1], NUM_PARTS: 4, multiParts: parts(),
    setTimeout: callback => { timers.push(callback); return timers.length; }, clearTimeout() {},
    requestDump: part => reads.push(part), document: { getElementById: () => ({ textContent: '', value: '' }) },
    loadMultiLibrary: () => ({}), saveMultiLibrary: lib => saved.push(lib), extractPatchName: bytes => `P${bytes[8] + 1}`,
    setLastAction() {}, renderMultiLibrary() {} });
  for (const name of ['isExpectedMultiFetchDump', 'requestNextMultiFetch', 'captureMultiPreset', 'finishMultiFetch']) vm.runInContext(functions.get(name), c);
  return { c, timers, reads, saved };
}
const dump = part => { const bytes = new Uint8Array(267); bytes.set([0xF0, 0, 0x20, 0x33, 1, 0, 0x10, 0, part]); bytes[266] = 0xF7; return bytes; };

test('Capture accepts only the requested part, and never saves fewer than four dumps', async () => {
  const { c, reads, saved } = captureContext();
  const result = c.captureMultiPreset('Concerto');
  assert.equal(c.isExpectedMultiFetchDump(dump(1)), false);
  assert.equal(c.isExpectedMultiFetchDump(dump(0x40)), false);
  assert.equal(c.isExpectedMultiFetchDump(dump(0)), true);
  c.window.multiFetchState.dumps[0] = Array.from(dump(0));
  c.finishMultiFetch();
  assert.equal(saved.length, 0);
  for (let i = 1; i < 4; i++) c.window.multiFetchState.dumps[i] = Array.from(dump(i));
  c.finishMultiFetch();
  const preset = await result;
  assert.equal(preset.parts.length, 4);
  assert.equal(saved.length, 1);
  assert.deepEqual(reads, [0]);
});

test('Missing hardware response times out without saving a partial setup', async () => {
  const { c, timers, saved } = captureContext();
  const result = c.captureMultiPreset('Concerto');
  timers[0]();
  await assert.rejects(result, /P1/);
  assert.equal(saved.length, 0);
  assert.equal(c.window.multiFetchState, null);
});

function applyContext(routing = 'split', failCapture = false) {
  const emitted = [], c = vm.createContext({ window: { currentSynthMode: 'multi' },
    selectedInput: {}, multiRead: null, BANK_NAMES: ['RAM-A', 'RAM-B'], NUM_PARTS: 4,
    VirusMultiSetup: api, SYSEX_PREFIX: [0xF0, 0, 0x20, 0x33, 1], deviceId: () => 0x10,
    multiParts: parts(), partMuteState: [true, false, true, false], activeSoloPart: 1,
    PART_ENABLE_PARAM: 72, PART_VOL_ENABLE_PARAM: 73,
    setTimeout: (callback, ms) => { if (ms < 1000) queueMicrotask(callback); return ms; }, clearTimeout() {},
    recordMidiTx() {}, buildMultiView() {}, renderMultiPartsOverview() {},
    sendVirusParam: (...args) => emitted.push(args),
    captureMultiPreset: async () => {
      if (failCapture) throw new Error('Lettura incompleta');
      return { parts: Array.from({ length: 4 }, (_, i) => ({ name: `Letto P${i + 1}`, dump: Array.from(dump(i)) })) };
    }
  });
  c.window.setSynthMode = mode => { c.window.currentSynthMode = mode; };
  c.selectedOutput = { send: () => c.window.multiSetupPendingMulti.resolve() };
  vm.runInContext(functions.get('applyGuidedMultiSetup'), c);
  const draft = api.createDraft(parts()); draft.name = 'Concerto'; draft.routing = routing;
  draft.parts[2].source = 'bank'; draft.parts[2].bank = 1; draft.parts[2].program = 9;
  return { c, draft, emitted };
}

test('Applying a layer addresses each part explicitly and preserves sounds marked keep', async () => {
  const { c, draft, emitted } = applyContext('layer');
  await c.applyGuidedMultiSetup(draft, () => {});
  const channels = emitted.filter(args => args[0] === 0x72 && args[2] === 34);
  assert.deepEqual(channels.map(args => [args[1], args[3]]), [[0,0], [1,0], [2,0], [3,0]]);
  const programs = emitted.filter(args => args[0] === 0x72 && args[2] === 33);
  assert.deepEqual(programs.map(args => [args[1], args[3]]), [[2,9]]);
  assert.equal(c.window.multiSetupApplying, false);
  assert.equal(c.activeSoloPart, -1);
});

test('Applying four-channel mode sends chosen volumes and fails cleanly on incomplete capture', async () => {
  const { c, draft, emitted } = applyContext('split', true);
  await assert.rejects(c.applyGuidedMultiSetup(draft, () => {}), /incompleta/);
  assert.deepEqual(emitted.filter(args => args[0] === 0x72 && args[2] === 39).map(args => args[3]), [90,91,92,93]);
  assert.equal(c.window.multiSetupApplying, false);
});
