const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  createController,
  offset,
  buttonNames,
} = require("../virus-hardware-panel.js");
function setup() {
  let part = 0,
    buffer = 0x40;
  const values = new Map(),
    writes = [],
    actions = [];
  const key = (p) =>
    `${p.page === 0x73 && p.index === 127 ? "global" : part}:${p.page}:${p.index}`;
  const bridge = {
    part: () => part,
    buffer: () => buffer,
    read: (p) => values.get(key(p)) ?? p.initial,
    write: (p, v) => {
      values.set(key(p), v);
      writes.push([part, p.page, p.index, v]);
    },
    receive: (p, v) => values.set(key(p), v),
    action: (...args) => actions.push(args),
  };
  return {
    c: createController(bridge),
    writes,
    actions,
    setPart: (p) => {
      part = p;
      buffer = p;
    },
  };
}
test("all 32 knobs have bounded, writable MIDI descriptors", () => {
  const { c, writes } = setup();
  for (let i = 0; i < 32; i++) {
    const p = c.knob(i);
    assert.ok([0x70, 0x71, 0x6e, 0x73].includes(p.page));
    assert.ok(p.index >= 0 && p.index < 128);
    c.write(p, p.initial === p.max ? p.min : p.max);
  }
  assert.equal(writes.length, 32);
});
test("all 43 physical buttons have actions, not decorative placeholders", () => {
  assert.equal(buttonNames.length, 43);
  for (let i = 0; i < 43; i++) {
    const { c, writes, actions } = setup();
    let updates = 0;
    c.onChange(() => updates++);
    c.press(i, 1000);
    if (i === 28) c.press(i, 1400);
    assert.ok(updates > 0);
    if ([4, 5, 10, 13, 14, 15, 17, 18, 19, 25, 26, 28].includes(i))
      assert.ok(writes.length);
    if ([30, 31, 34, 35, 36, 37, 38, 41, 42].includes(i))
      assert.ok(actions.length);
  }
  assert.throws(() => setup().c.press(43), RangeError);
});
test("LFO/oscillator/filter selections bind their own parameter pages", () => {
  const { c } = setup();
  c.press(8);
  assert.deepEqual([c.knob(1).page, c.knob(1).index], [0x71, 7]);
  c.press(11);
  assert.equal(c.knob(2).index, 22);
  c.press(11);
  assert.equal(c.knob(2).page, 0x71);
  c.press(20);
  assert.equal(c.knob(7).index, 41);
});
test("TI reverb uses extended E page; arpeggiator uses TI B15", () => {
  const { c, writes } = setup();
  c.press(21);
  assert.deepEqual([c.knob(24).page, c.knob(24).index], [0x6e, 2]);
  c.press(10);
  assert.deepEqual(writes.at(-1).slice(1), [0x71, 15, 1]);
});
test("every matrix slot/destination uses exact TI addresses", () => {
  const { c } = setup();
  const pairs = [
    [
      [0x71, 65, 66],
      [0x6e, 90, 91],
      [0x6e, 92, 93],
    ],
    [
      [0x71, 68, 69],
      [0x71, 70, 71],
      [0x6e, 94, 95],
    ],
    [
      [0x71, 73, 74],
      [0x71, 75, 76],
      [0x71, 77, 78],
    ],
    [
      [0x71, 104, 105],
      [0x6e, 96, 97],
      [0x6e, 98, 99],
    ],
    [
      [0x71, 107, 108],
      [0x6e, 100, 101],
      [0x6e, 102, 103],
    ],
    [
      [0x71, 110, 111],
      [0x6e, 104, 105],
      [0x6e, 106, 107],
    ],
  ];
  for (let s = 0; s < 6; s++) {
    c.state.slot = s;
    c.state.menu = "matrix";
    for (let d = 0; d < 3; d++) {
      c.state.destination = d;
      const ps = c.menuParams();
      assert.deepEqual([ps[1].page, ps[1].index, ps[2].index], pairs[s][d]);
    }
  }
});
test("undo is isolated by part and clamps small selector ranges", () => {
  const { c, writes, setPart } = setup();
  const p = c.knob(6);
  c.write(p, 17);
  setPart(1);
  c.write(p, 36);
  setPart(0);
  c.press(32);
  assert.equal(c.read(p), p.initial);
  setPart(1);
  assert.equal(c.read(p), 36);
  const q = { ...p, max: 3, min: 0 };
  c.write(q, 127);
  assert.equal(writes.at(-1)[3], 3);
});
test("parameter echoes ignore inactive parts and malformed frames", () => {
  const { c, setPart } = setup();
  const bytes = [240, 0, 32, 51, 1, 0, 0x6e, 0x40, 2, 89, 247];
  assert.ok(c.receive(bytes));
  c.state.upper = 1;
  assert.equal(c.read(c.knob(24)), 89);
  setPart(1);
  assert.equal(c.receive(bytes), false);
  assert.equal(c.read(c.knob(24)), 0);
  bytes[7] = 1;
  assert.ok(c.receive(bytes));
  assert.equal(c.receive([...bytes, 0]), false);
  bytes[9] = 200;
  assert.equal(c.receive(bytes), false);
});
test("Tap computes tempo; external actions target mode, part, PATCH and MIDI", () => {
  const { c, writes, actions } = setup();
  c.press(28, 1000);
  c.press(28, 1400);
  assert.deepEqual(writes.at(-1).slice(1), [0x71, 16, 87]);
  [30, 31, 34, 35, 36, 37, 38, 41, 42].forEach((i) => c.press(i));
  assert.deepEqual(actions, [
    ["config"],
    ["store"],
    ["search"],
    ["part", -1],
    ["part", 1],
    ["mode", 1],
    ["mode", 0],
    ["program", -1],
    ["program", 1],
  ]);
});
test("TI dump offsets preserve 128-byte pages", () => {
  assert.equal(offset(0x70), 9);
  assert.equal(offset(0x71), 137);
  assert.equal(offset(0x6e), 265);
  assert.equal(offset(0x6f), 393);
  assert.equal(offset(0x73), undefined);
});
test("Shift uses TI F121 Unison, A50 Ring and valid saturation/semitone ranges", () => {
  const { c } = setup();
  c.state.shift = true;
  assert.deepEqual([c.knob(5).page, c.knob(5).index], [0x6f, 121]);
  assert.equal(c.knob(15).index, 50);
  assert.equal(c.knob(14).max, 14);
  for (let osc = 0; osc < 3; osc++) {
    c.state.osc = osc;
    assert.equal(c.knob(4).min, 16);
    assert.equal(c.knob(4).max, 112);
  }
});

test("Undo restores the whole pointer gesture, not its last MIDI step", () => {
  const { c } = setup();
  const p = c.knob(7),
    initial = c.read(p);
  c.beginGesture();
  c.write(p, initial - 1);
  c.write(p, initial - 2);
  c.write(p, initial - 3);
  c.endGesture();
  c.press(32);
  assert.equal(c.read(p), initial);
});
