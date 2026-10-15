/* Interactive TI2 Desktop. MIDI addresses: dsp56300/gearmulator's TI parameter
 * descriptions (protocol facts only). Raster geometry comes from our Blender scene. */
(function (root) {
  "use strict";
  const A = 0x70,
    B = 0x71,
    E = 0x6e,
    F = 0x6f,
    D = 0x73;
  const param = (page, index, name, max = 127, initial = 64, min = 0) => ({
    page,
    index,
    name,
    max,
    min,
    initial,
  });
  const a = (i, n, max, initial, min) => param(A, i, n, max, initial, min);
  const b = (i, n, max, initial, min) => param(B, i, n, max, initial, min);
  const e = (i, n, max, initial, min) => param(E, i, n, max, initial, min);
  const f = (i, n, max, initial, min) => param(F, i, n, max, initial, min);
  const offset = (page) => ({ [A]: 9, [B]: 137, [E]: 266, [0x6f]: 394 })[page];
  const buttonNames = [
    "Destinazione precedente",
    "Destinazione successiva",
    "Slot matrice",
    "Modifica LFO",
    "Inviluppo LFO",
    "Forma LFO",
    "Seleziona LFO 1",
    "Seleziona LFO 2",
    "Seleziona LFO 3",
    "Modifica arpeggiatore",
    "Arpeggiatore acceso/spento",
    "Seleziona oscillatore",
    "Modifica oscillatore",
    "Oscillatore 3 acceso/spento",
    "Mono / Poly",
    "Sync oscillatore 2",
    "Modifica filtri",
    "Modo filtro 1",
    "Modo filtro 2",
    "Collega cutoff 2",
    "Seleziona filtro",
    "Seleziona effetto superiore",
    "Modifica effetto superiore",
    "Seleziona effetto inferiore",
    "Modifica effetto inferiore",
    "Trasposizione −",
    "Trasposizione +",
    "Esci",
    "Tap tempo",
    "Modifica parametri comuni",
    "Configurazione MIDI",
    "Salva nella libreria PATCH",
    "Annulla ultima modifica",
    "Shift",
    "Cerca suoni / Shift: Audition",
    "Parte precedente",
    "Parte successiva",
    "Modalità Multi",
    "Modalità Single",
    "Parametro precedente",
    "Parametro successivo",
    "Valore / programma −",
    "Valore / programma +",
  ];
  function createController(bridge) {
    const state = {
      lfo: 0,
      osc: 0,
      filter: 0,
      slot: 0,
      destination: 0,
      lfoTarget: [0, 0, 0],
      upper: 0,
      lower: 2,
      shift: false,
      menu: null,
      selected: 0,
      last: null,
    };
    const history = [];
    let gesture = null,
      nextGesture = 0;
    let taps = [],
      changed = () => {};
    const read = (p) => bridge.read(p);
    const formatValue = (p, value) =>
      p.page === B && p.index === 16 ? `${value + 63} BPM` : String(value);
    function write(p, value, undo = true) {
      value = Math.max(p.min, Math.min(p.max, Math.round(value)));
      const before = read(p),
        part = bridge.part();
      if (value !== before) {
        if (undo) {
          const last = history.at(-1);
          if (
            gesture === null ||
            !last ||
            last.gesture !== gesture ||
            last.part !== part ||
            last.p.page !== p.page ||
            last.p.index !== p.index
          ) {
            history.push({ p, before, part, gesture });
          }
          if (history.length > 100) history.shift();
        }
        bridge.write(p, value);
      }
      state.last = { name: p.name, value: formatValue(p, value) };
      changed();
      return value;
    }
    const lfo = () =>
      state.lfo === 2
        ? [
            b(7, "LFO 3 · Rate", 127, 92),
            b(8, "LFO 3 · Forma", 67, 1),
            b(12, "LFO 3 · Intensità", 127, 0),
          ]
        : [
            a(state.lfo ? 79 : 67, `LFO ${state.lfo + 1} · Rate`, 127, 48),
            a(state.lfo ? 80 : 68, `LFO ${state.lfo + 1} · Forma`, 67, 1),
            param(
              state.lfoTarget[state.lfo] === 5 ? B : A,
              (state.lfo ? [88, 89, 86, 87, 90, 82] : [74, 75, 76, 77, 78, 80])[
                state.lfoTarget[state.lfo]
              ],
              `LFO ${state.lfo + 1} · Intensità`,
            ),
          ];
    const oscillator = () =>
      state.osc === 2
        ? [
            b(41, "Osc 3 · Forma", 67, 1),
            b(43, "Osc 3 · Semitono", 112, 64, 16),
            b(44, "Osc 3 · Detune", 127, 32),
          ]
        : [
            a(state.osc ? 22 : 17, `Osc ${state.osc + 1} · Shape`),
            a(
              state.osc ? 25 : 20,
              `Osc ${state.osc + 1} · Semitono`,
              112,
              64,
              16,
            ),
            a(state.osc ? 24 : 19, `Osc ${state.osc + 1} · Wave`, 63, 0),
          ];
    const filter = () => [
      a(
        state.filter === 1 ? 41 : 40,
        `Filtro ${state.filter === 1 ? 2 : 1} · Cutoff`,
        127,
        127,
      ),
      a(state.filter === 1 ? 43 : 42, "Risonanza", 127, 0),
      a(state.filter === 1 ? 45 : 44, "Inviluppo filtro", 127, 0),
    ];
    const upperNames = ["Delay", "Reverb", "Low EQ", "Mid EQ", "High EQ"];
    const upper = () =>
      [
        [
          a(113, "Delay · Send", 127, 0),
          a(114, "Delay · Time"),
          a(115, "Delay · Feedback", 127, 0),
        ],
        [
          e(2, "Reverb · Send", 127, 0),
          e(4, "Reverb · Time"),
          e(5, "Reverb · Damping", 127, 10),
        ],
        [
          b(95, "Low EQ · Gain"),
          b(45, "Low EQ · Frequency", 127, 5),
          b(95, "Low EQ · Gain"),
        ],
        [
          b(92, "Mid EQ · Gain"),
          b(93, "Mid EQ · Frequency", 127, 84),
          b(94, "Mid EQ · Q", 127, 32),
        ],
        [
          b(96, "High EQ · Gain"),
          b(46, "High EQ · Frequency", 127, 0),
          b(96, "High EQ · Gain"),
        ],
      ][state.upper];
    const lowerNames = [
      "Distortion",
      "Character",
      "Chorus",
      "Phaser",
      "Filter Bank",
    ];
    // Character has no intensity parameter in the TI protocol. The second control
    // adjusts patch gain; its actual function is always shown in the readout.
    const lower = () =>
      [
        [
          b(100, "Distortion · Type", 25, 0),
          b(101, "Distortion · Intensity", 127, 0),
        ],
        [
          e(26, "Character · Type", 8, 0),
          a(91, "Character · Volume patch", 127, 100),
        ],
        [a(105, "Chorus · Mix", 127, 0), a(107, "Chorus · Depth", 127, 16)],
        [b(85, "Phaser · Mix", 127, 0), b(87, "Phaser · Depth", 127, 112)],
        [e(20, "Filter Bank · Mix", 127, 0), e(21, "Filter Bank · Frequency")],
      ][state.lower];
    const matrix = () => {
      const bases = [64, 67, 72, 103, 106, 109],
        source = bases[state.slot];
      const second =
        state.slot === 1
          ? [B, 70, 71]
          : state.slot === 2
            ? [B, 75, 76]
            : [
                E,
                90 + (state.slot === 0 ? 0 : (state.slot + 1) * 2),
                91 + (state.slot === 0 ? 0 : (state.slot + 1) * 2),
              ];
      const third =
        state.slot === 2
          ? [B, 77, 78]
          : [
              E,
              92 +
                (state.slot === 0
                  ? 0
                  : state.slot === 1
                    ? 2
                    : state.slot * 4 - 6),
              93 +
                (state.slot === 0
                  ? 0
                  : state.slot === 1
                    ? 2
                    : state.slot * 4 - 6),
            ];
      // Explicit slot table avoids accidentally writing adjacent parameters.
      const extra = [
        [90, 91, 92, 93],
        [null, null, 94, 95],
        [null, null, null, null],
        [96, 97, 98, 99],
        [100, 101, 102, 103],
        [104, 105, 106, 107],
      ][state.slot];
      const address =
        state.destination === 0
          ? [B, source + 1, source + 2]
          : state.destination === 1
            ? state.slot === 1 || state.slot === 2
              ? second
              : [E, extra[0], extra[1]]
            : state.slot === 2
              ? third
              : [E, extra[2], extra[3]];
      return [
        b(source, `Slot ${state.slot + 1} · Sorgente`, 39, 0),
        param(
          address[0],
          address[1],
          `Destinazione ${state.destination + 1}`,
          127,
          0,
        ),
        param(address[0], address[2], "Intensità matrice"),
      ];
    };
    const common = () => [
      a(91, "Volume patch", 127, 100),
      a(93, "Trasposizione"),
      a(10, "Panorama"),
    ];
    const arp = () => [
      b(15, "Arp · Modo", 7, 0),
      b(2, "Arp · Pattern", 63, 0),
      b(17, "Arp · Clock", 17, 0),
      b(3, "Arp · Ottave", 3, 0),
      b(5, "Arp · Lunghezza"),
      b(4, "Arp · Hold", 1, 0),
    ];
    function menuParams() {
      return (
        { lfo, oscillator, filter, upper, lower, matrix, common, arp }[
          state.menu
        ] || common
      )();
    }
    function knob(index) {
      const shift = state.shift;
      const osc = oscillator(),
        flt = filter();
      const shape = oscillator()[0];
      const wave =
        state.osc === 2
          ? shape
          : read(shape) >= 64
            ? a(state.osc ? 23 : 18, "Pulse width")
            : osc[2];
      const defs = [
        param(D, 127, "Volume master", 127, 92),
        shift
          ? state.lfo === 2
            ? b(13, "LFO 3 · Fade in", 127, 0)
            : a(state.lfo ? 83 : 71, "Simmetria LFO")
          : lfo()[0],
        shape,
        wave,
        osc[1],
        shift
          ? f(121, "Unison detune", 127, 48)
          : state.osc === 2
            ? osc[2]
            : a(26, "Detune 2/3", 127, 32),
        shift ? b(34, "FM · Modo", 6, 0) : a(27, "FM amount", 127, 0),
        flt[0],
        shift ? a(43, "Risonanza filtro 2", 127, 0) : flt[1],
        shift ? a(state.filter === 1 ? 47 : 46, "Key follow filtro") : flt[2],
        a(48, "Bilanciamento filtri"),
        shift ? b(32, "Cutoff link", 1, 1) : a(41, "Cutoff filtro 2"),
        shift ? a(10, "Panorama") : a(33, "Bilanciamento oscillatori"),
        shift ? b(42, "Volume oscillatore 3") : a(34, "Volume sub", 127, 0),
        shift
          ? a(49, "Tipo saturazione", 14, 0)
          : a(36, "Volume oscillatori", 127, 127),
        shift ? a(50, "Ring modulator", 127, 0) : a(37, "Rumore", 127, 0),
        a(54, "Filtro · Attack", 127, 0),
        a(55, "Filtro · Decay"),
        shift
          ? a(57, "Filtro · Sustain time")
          : a(56, "Filtro · Sustain", 127, 127),
        a(58, "Filtro · Release", 127, 0),
        shift ? a(91, "Volume patch", 127, 100) : a(59, "Amp · Attack", 127, 0),
        a(60, "Amp · Decay"),
        shift ? a(62, "Amp · Sustain time") : a(61, "Amp · Sustain", 127, 127),
        a(63, "Amp · Release", 127, 0),
        ...upper(),
        ...lower(),
      ];
      if (index < 29) return defs[index];
      if (state.menu) {
        const p = menuParams();
        return p[(state.selected + index - 29) % p.length];
      }
      const dest =
        index === 31
          ? e(28, "Soft 3 assignment", 127, 0)
          : b(62 + index - 29, "Soft assignment", 127, 0);
      return read(dest)
        ? param(D, 10 + index - 29, `Soft ${index - 28}`, 127, 64)
        : common()[index - 29];
    }
    function open(menu) {
      state.menu = menu;
      state.selected = 0;
      state.last = null;
    }
    function cycle(p) {
      write(p, read(p) >= p.max ? p.min : read(p) + 1);
    }
    function toggle(p, on = 1) {
      write(p, read(p) ? 0 : on);
    }
    function press(index, now = Date.now()) {
      switch (index) {
        case 0:
        case 1:
          state.destination = (state.destination + (index === 0 ? 2 : 1)) % 3;
          open("matrix");
          break;
        case 2:
          state.slot = (state.slot + 1) % 6;
          open("matrix");
          break;
        case 3:
          open("lfo");
          break;
        case 4:
          toggle(
            state.lfo === 2
              ? b(9, "LFO 3 · Mono", 1, 0)
              : a(state.lfo ? 81 : 69, "LFO · Env mode", 1, 0),
          );
          break;
        case 5:
          cycle(lfo()[1]);
          break;
        case 6:
        case 7:
        case 8: {
          const next = index - 6;
          if (state.lfo === next) {
            if (next === 2) cycle(b(11, "LFO 3 · Destinazione", 6, 0));
            else state.lfoTarget[next] = (state.lfoTarget[next] + 1) % 6;
          }
          state.lfo = next;
          state.last = null;
          break;
        }
        case 9:
          open("arp");
          break;
        case 10:
          toggle(arp()[0]);
          break;
        case 11:
          state.osc = (state.osc + 1) % 3;
          write(b(127, "Seleziona oscillatore", 2, 0), state.osc);
          state.last = null;
          break;
        case 12:
          open("oscillator");
          break;
        case 13:
          toggle(b(41, "Osc 3 · On", 67, 0));
          break;
        case 14:
          toggle(a(94, "Mono / Poly", 5, 0));
          break;
        case 15:
          toggle(a(28, "Osc sync", 1, 0));
          break;
        case 16:
          open("filter");
          break;
        case 17:
          cycle(a(51, "Filtro 1 · Modo", 7, 0));
          break;
        case 18:
          cycle(a(52, "Filtro 2 · Modo", 3, 0));
          break;
        case 19:
          toggle(b(32, "Cutoff link", 1, 1));
          break;
        case 20:
          state.filter = (state.filter + 1) % 3;
          write(b(122, "Seleziona filtro", 2, 2), state.filter);
          state.last = null;
          break;
        case 21:
          state.upper = (state.upper + 1) % 5;
          state.last = null;
          break;
        case 22:
          open("upper");
          break;
        case 23:
          state.lower = (state.lower + 1) % 5;
          state.last = null;
          break;
        case 24:
          open("lower");
          break;
        case 25:
        case 26:
          write(
            a(93, "Trasposizione"),
            read(a(93, "Trasposizione")) + (index === 25 ? -1 : 1),
          );
          break;
        case 27:
          state.menu = null;
          state.last = null;
          break;
        case 28:
          taps = taps.filter((t) => now - t < 2500);
          taps.push(now);
          if (taps.length > 1) {
            const bpm = Math.round(
              (60000 * (taps.length - 1)) / (now - taps[0]),
            );
            write(b(16, "Tempo", 127, 57), bpm - 63);
          } else state.last = { name: "Tap tempo", value: "tocca ancora" };
          break;
        case 29:
          open("common");
          break;
        case 30:
          bridge.action("config");
          break;
        case 31:
          bridge.action("store");
          break;
        case 32: {
          const i = history.findLastIndex((h) => h.part === bridge.part());
          if (i >= 0) {
            const h = history.splice(i, 1)[0];
            write(h.p, h.before, false);
          } else state.last = { name: "Undo", value: "nessuna modifica" };
          break;
        }
        case 33:
          state.shift = !state.shift;
          state.last = null;
          break;
        case 34:
          bridge.action(state.shift ? "audition" : "search");
          break;
        case 35:
        case 36:
          bridge.action("part", index === 35 ? -1 : 1);
          state.last = null;
          break;
        case 37:
        case 38:
          bridge.action("mode", index === 37 ? 1 : 0);
          break;
        case 39:
        case 40:
          if (!state.menu) open("common");
          state.selected =
            (state.selected + (index === 39 ? menuParams().length - 1 : 1)) %
            menuParams().length;
          state.last = null;
          break;
        case 41:
        case 42:
          if (state.menu) {
            const p = menuParams()[state.selected];
            write(p, read(p) + (index === 41 ? -1 : 1));
          } else bridge.action("program", index === 41 ? -1 : 1);
          break;
        default:
          throw new RangeError("Pulsante sconosciuto");
      }
      changed();
    }
    function receive(bytes) {
      if (
        bytes.length !== 11 ||
        bytes[0] !== 240 ||
        bytes[10] !== 247 ||
        bytes[1] !== 0 ||
        bytes[2] !== 32 ||
        bytes[3] !== 51 ||
        bytes[4] !== 1 ||
        ![A, B, E, 0x6f, D].includes(bytes[6]) ||
        bytes.slice(5, 10).some((v) => v > 127)
      )
        return false;
      const p = param(bytes[6], bytes[8], "MIDI");
      const global = p.page === D && p.index === 127;
      if (bytes[7] !== (global ? 0 : bridge.buffer())) return false;
      bridge.receive(p, bytes[9]);
      if (p.page === B && p.index === 127 && bytes[9] < 3) state.osc = bytes[9];
      if (p.page === B && p.index === 122 && bytes[9] < 3)
        state.filter = bytes[9];
      changed();
      return true;
    }
    return {
      state,
      knob,
      press,
      read,
      write,
      receive,
      menuParams,
      formatValue,
      upperNames,
      lowerNames,
      beginGesture: () => {
        gesture = ++nextGesture;
      },
      endGesture: () => {
        gesture = null;
      },
      refresh: () => changed(),
      onChange(fn) {
        changed = fn;
      },
    };
  }
  async function mount(bridge) {
    // Embedded metadata also works in the native plugin's file:// WebView.
    const { snow, desktop } = root.VirusPanelLayouts;
    const snowEl = document.getElementById("virusFaceplate");
    const place = (el, v) =>
      Object.entries(v).forEach(([k, n]) => el.style.setProperty("--" + k, n));
    for (const group of ["knobs", "keys", "leds"])
      Object.entries(snow[group]).forEach(([id, v]) => {
        const el =
          document.getElementById(id) ||
          (id === "snowLcdBpmLed" ? snowEl.querySelector(".fp-bpm") : null);
        if (el) place(el, v);
      });
    place(snowEl.querySelector(".fp-lcd"), snow.lcd);
    snowEl.classList.add("studio-snow");
    const viewport = document.createElement("div");
    viewport.className = "hardware-viewport";
    snowEl.before(viewport);
    viewport.append(snowEl);
    const desk = document.createElement("div");
    desk.className = "desktop-faceplate";
    desk.id = "desktopFaceplate";
    desk.setAttribute(
      "aria-label",
      "Access Virus TI2 Desktop · pannello interattivo",
    );
    viewport.append(desk);
    const controller = createController(bridge);
    const controls = [];
    desktop.knobs.forEach((v, i) => {
      const el = document.createElement("div");
      el.className = "desktop-knob";
      el.id = "desktopKnob" + (i + 1);
      place(el, { x: v.x, y: v.y, w: v.width, cell: (v.width * 3.2) / 1.8 });
      desk.append(el);
      controls.push(el);
      // The range changes with the selected oscillator/effect. The controller
      // clamps against the current descriptor, rather than a fixed MIDI range.
      let dragging = false,
        lastY = 0,
        acc = 0;
      const apply = (value) => controller.write(controller.knob(i), value);
      el.tabIndex = 0;
      el.setAttribute("role", "slider");
      el.addEventListener("pointerdown", (ev) => {
        if (ev.button > 0) return;
        ev.preventDefault();
        el.focus({ preventScroll: true });
        el.setPointerCapture(ev.pointerId);
        controller.beginGesture();
        dragging = true;
        lastY = ev.clientY;
        acc = controller.read(controller.knob(i));
      });
      el.addEventListener("pointermove", (ev) => {
        if (!dragging) return;
        const p = controller.knob(i);
        acc = Math.max(
          p.min,
          Math.min(
            p.max,
            acc + (lastY - ev.clientY) * (ev.shiftKey ? 0.12 : 0.75),
          ),
        );
        lastY = ev.clientY;
        apply(acc);
      });
      ["pointerup", "pointercancel", "lostpointercapture"].forEach((t) =>
        el.addEventListener(t, () => {
          dragging = false;
          controller.endGesture();
        }),
      );
      el.addEventListener(
        "wheel",
        (ev) => {
          ev.preventDefault();
          apply(controller.read(controller.knob(i)) + (ev.deltaY < 0 ? 1 : -1));
        },
        { passive: false },
      );
      el.addEventListener("focus", () => {
        const p = controller.knob(i);
        controller.state.last = { name: p.name, value: controller.read(p) };
        controller.refresh();
      });
      el.addEventListener("dblclick", () => apply(controller.knob(i).initial));
      el.addEventListener("keydown", (ev) => {
        const p = controller.knob(i),
          d = {
            ArrowUp: 1,
            ArrowRight: 1,
            ArrowDown: -1,
            ArrowLeft: -1,
            PageUp: 10,
            PageDown: -10,
          }[ev.key];
        if (d !== undefined || ["Home", "End"].includes(ev.key)) {
          ev.preventDefault();
          apply(
            ev.key === "Home"
              ? p.min
              : ev.key === "End"
                ? p.max
                : controller.read(p) + d,
          );
        }
      });
    });
    const keys = [];
    desktop.buttons.forEach((v, i) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "desktop-key";
      el.id = "desktopButton" + (i + 1);
      el.title = buttonNames[i];
      el.setAttribute("aria-label", buttonNames[i]);
      place(el, {
        x: v.x,
        y: v.y,
        w: v.width,
        h: v.height,
        cell: (2.25 / 51) * 100,
      });
      desk.append(el);
      keys.push(el);
      el.addEventListener("pointerdown", () => el.classList.add("pressed"));
      ["pointerup", "pointercancel", "pointerleave", "blur"].forEach((t) =>
        el.addEventListener(t, () => el.classList.remove("pressed")),
      );
      el.addEventListener("click", () => {
        el.classList.add("pressed");
        setTimeout(() => el.classList.remove("pressed"), 140);
        controller.press(i);
      });
    });
    const lcd = document.createElement("div");
    lcd.className = "desktop-lcd";
    place(lcd, {
      x: desktop.lcd.x,
      y: desktop.lcd.y,
      w: desktop.lcd.width,
      h: desktop.lcd.height,
    });
    desk.append(lcd);
    const leds = desktop.leds.map((v) => {
      const el = document.createElement("span");
      el.className = "desktop-led";
      place(el, { x: v.x, y: v.y, w: v.width });
      desk.append(el);
      return { el, v };
    });
    const tools = document.createElement("div");
    tools.className = "hardware-tools";
    viewport.after(tools);
    const model = document.createElement("select");
    model.setAttribute("aria-label", "Modello del pannello");
    model.innerHTML =
      '<option value="snow">Virus TI Snow</option><option value="desktop">Virus TI2 Desktop</option>';
    tools.append(model);
    model.addEventListener("change", () => {
      if (
        (document.documentElement.dataset.skin === "elektron") !==
        (model.value === "desktop")
      )
        document.getElementById("themeToggle").click();
    });
    ["frontBtnMidi", "frontBtnSounds", "frontBtnWaves"].forEach((id) => {
      const el = document.getElementById(id);
      tools.append(el);
      el.removeAttribute("style");
      el.classList.remove("fp-wave");
      el.classList.add("hardware-tool");
    });
    const zoom = document.createElement("input");
    zoom.type = "range";
    zoom.min = "100";
    zoom.max = "250";
    zoom.step = "25";
    zoom.value = "100";
    zoom.setAttribute("aria-label", "Zoom pannello");
    const label = document.createElement("label");
    label.textContent = "Zoom ";
    label.title =
      "100%: intero strumento. Ingrandisci e scorri il pannello per le regolazioni precise.";
    label.append(zoom);
    const value = document.createElement("output");
    value.textContent = "100%";
    label.append(value);
    tools.append(label);
    zoom.addEventListener("input", () => {
      value.textContent = zoom.value + "%";
      viewport.style.setProperty("--panel-zoom", zoom.value / 100);
    });
    const status = document.createElement("div");
    status.className = "hardware-status";
    status.setAttribute("aria-live", "polite");
    tools.after(status);
    function refresh() {
      controls.forEach((el, i) => {
        const p = controller.knob(i),
          value = controller.read(p),
          f = Math.round(((value - p.min) / (p.max - p.min)) * 63);
        el.style.setProperty("--kx", f % 8);
        el.style.setProperty("--ky", Math.floor(f / 8));
        el.title = p.name + " · " + value;
        el.setAttribute("aria-label", p.name);
        el.setAttribute("aria-valuemin", p.min);
        el.setAttribute("aria-valuemax", p.max);
        el.setAttribute("aria-valuenow", value);
      });
      keys[33].setAttribute("aria-pressed", controller.state.shift);
      keys[33].classList.toggle("latched", controller.state.shift);
      const s = controller.state,
        info = bridge.info();
      lcd.replaceChildren();
      const header = document.createElement("span");
      header.textContent =
        (info.mode || "SINGLE").toUpperCase() + "  P" + (bridge.part() + 1);
      lcd.append(header);
      const middle = document.createElement("strong");
      middle.textContent = s.last
        ? s.last.name
        : s.menu
          ? {
              upper: controller.upperNames[s.upper],
              lower: controller.lowerNames[s.lower],
            }[s.menu] || s.menu.toUpperCase()
          : info.name;
      lcd.append(middle);
      const footer = document.createElement("span");
      footer.textContent = s.last
        ? String(s.last.value)
        : [29, 30, 31]
            .map((i) => controller.read(controller.knob(i)))
            .join("     ");
      lcd.append(footer);
      status.textContent =
        (s.shift ? "SHIFT · " : "") +
        (s.last
          ? `${s.last.name}: ${s.last.value}`
          : `P${bridge.part() + 1} · Osc ${s.osc + 1} · LFO ${s.lfo + 1} · Filtro ${["1", "2", "1+2"][s.filter]} · ${controller.upperNames[s.upper]} / ${controller.lowerNames[s.lower]}`) +
        (bridge.connected() ? "" : " · MIDI OUT non collegata");
      const nearest = (px, py) => {
        const x = ((px - 917) * 47) / 1604,
          y = ((696 - py) * 18.8) / 706;
        return leds.reduce((best, l) =>
          Math.hypot(l.v.local[0] - x, l.v.local[1] - y) <
          Math.hypot(best.v.local[0] - x, best.v.local[1] - y)
            ? l
            : best,
        );
      };
      leds.forEach((l) => l.el.classList.remove("on"));
      [
        [423 + s.lfo * 47, 453],
        [460, s.lfoTarget[0] * 18 + 566],
        [582, s.lfoTarget[1] * 18 + 566],
        [334, 566 + s.slot * 18],
        [757 + (s.osc === 1 ? 27 : s.osc === 2 ? 90 : 0), 568],
        [169 + s.upper * 77, 723],
        [172 + s.lower * 75, 852],
      ].forEach(([x, y]) => nearest(x, y).el.classList.add("on"));
      if (s.shift) nearest(541, 902).el.classList.add("on");
      if (s.filter !== 1) nearest(1598, 587).el.classList.add("on");
      if (s.filter !== 0) nearest(1644, 587).el.classList.add("on");
    }
    controller.onChange(refresh);
    function setModel() {
      const dark = document.documentElement.dataset.skin === "elektron";
      snowEl.hidden = dark;
      desk.hidden = !dark;
      model.value = dark ? "desktop" : "snow";
      status.hidden = !dark;
      refresh();
    }
    new MutationObserver(setModel).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-skin"],
    });
    setModel();
    return { ...controller, setModel };
  }
  const api = { createController, mount, offset, buttonNames, param };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.VirusHardwarePanel = api;
})(typeof window !== "undefined" ? window : globalThis);
