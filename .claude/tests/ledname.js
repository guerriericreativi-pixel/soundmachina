// MULTI: il suono della parte cambia sul Virus -> l'app trova banco/numero dal nome nei banchi scansionati e sposta i LED
const puppeteer = require('/Users/lorenzoguerrieri/Music/soundmachina/node_modules/puppeteer');
(async () => {
  const b = await puppeteer.launch({ headless: 'new', executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const p = await b.newPage(); await p.setViewport({ width: 1440, height: 1000 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem('virusH_helpSeen_btnTabSnow', '1'); localStorage.setItem('virusH_synthMode', 'multi');
      const names = Array.from({ length: 128 }, (_, i) => 'RamC ' + i); names[68] = 'Graindance';
      localStorage.setItem('virusTiSnow_bank_2', JSON.stringify(names));            // RAM-C scansionato
    } catch (e) {}
    window.__name = 'Something'; window.__tx = [];
    const inp = window.__in = { id: 'i', name: 'V', type: 'input', state: 'connected', onmidimessage: null };
    const send = a => setTimeout(() => inp.onmidimessage && inp.onmidimessage({ data: new Uint8Array(a) }), 60);
    const dump = prog => { const d = new Array(524).fill(0); d.splice(0, 9, 0xF0, 0, 0x20, 0x33, 1, 0, 0x10, 0, prog); d[523] = 0xF7; ((prog === 0 ? window.__name : 'Other') + '          ').slice(0, 10).split('').forEach((c, i) => d[249 + i] = c.charCodeAt(0)); return d; };
    const out = { id: 'o', name: 'V', type: 'output', state: 'connected', send(d) { if (d[0] !== 0xF0) return;
      if (d[6] === 0x30) send(dump(d[8]));
      if (d[6] === 0x31) { const m = new Array(267).fill(0); m.splice(0, 9, 0xF0, 0, 0x20, 0x33, 1, 0, 0x11, 0, 127); m[41] = 2; m[57] = 0; m[266] = 0xF7; send(m); } } };   // il Multi dice ancora RAM-C 1
    navigator.requestMIDIAccess = () => Promise.resolve({ inputs: new Map([['i', inp]]), outputs: new Map([['o', out]]), onstatechange: null });
  });
  await p.goto('http://localhost:8765/', { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 3000));
  const leds = () => p.evaluate(() => ({ up: [...Array(8)].findIndex((_, i) => document.getElementById('frontRomLed' + i).classList.contains('active-amber')) + 1, low: [...Array(8)].findIndex((_, i) => document.getElementById('frontRamLed' + i).classList.contains('active-amber')) + 1, lcd: frontLcdCategory.textContent }));
  const r = { start: await leds() };
  // sul Virus si sceglie Graindance (RAM-C 69): il Virus manda il suo segnale
  await p.evaluate(() => { window.__name = 'Graindance'; window.__in.onmidimessage({ data: new Uint8Array([0xF0, 0, 0x20, 0x33, 1, 0, 0x73, 0, 0x10, 1, 0xF7]) }); });
  await new Promise(r => setTimeout(r, 3500)); r.graindance = await leds();
  // suono non presente nei banchi scansionati
  await p.evaluate(() => { window.__name = 'Mystery X'; window.__in.onmidimessage({ data: new Uint8Array([0xF0, 0, 0x20, 0x33, 1, 0, 0x73, 0, 0x10, 1, 0xF7]) }); });
  await new Promise(r => setTimeout(r, 3500)); r.unknown = await leds();
  r.errs = errs; console.log(JSON.stringify(r)); await b.close();
})();
