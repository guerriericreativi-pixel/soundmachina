// Cambio Multi sul Virus: all'inizio della lettura il Virus risponde ancora col nome vecchio -> alla fine deve esserci quello nuovo
const puppeteer = require('/Users/lorenzoguerrieri/Music/soundmachina/node_modules/puppeteer');
(async () => {
  const b = await puppeteer.launch({ headless: 'new', executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const p = await b.newPage(); await p.setViewport({ width: 1440, height: 1000 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.evaluateOnNewDocument(() => {
    try { localStorage.setItem('virusH_helpSeen_btnTabSnow', '1'); localStorage.setItem('virusH_synthMode', 'multi'); } catch (e) {}
    window.__name = 'MagicPlace'; window.__multiReq = 0;
    const inp = window.__in = { id: 'i', name: 'V', type: 'input', state: 'connected', onmidimessage: null };
    const send = a => setTimeout(() => inp.onmidimessage && inp.onmidimessage({ data: new Uint8Array(a) }), 80);
    const dump = pp => { const d = new Array(524).fill(0); d.splice(0, 9, 0xF0, 0, 0x20, 0x33, 1, 0, 0x10, 0, pp); d[523] = 0xF7; ((window.__name === 'Voltar' ? ['Voltage2MS', 'NoiseArpMH', 'x', 'y'] : ['a', 'b', 'c', 'd'])[pp] + '          ').slice(0, 10).split('').forEach((c, i) => d[249 + i] = c.charCodeAt(0)); return d; };
    const out = { id: 'o', name: 'V', type: 'output', state: 'connected', send(d) { if (d[0] !== 0xF0) return;
      if (d[6] === 0x30 && d[8] < 16) send(dump(d[8]));
      if (d[6] === 0x31) { window.__multiReq++; const nm = window.__lateName && window.__multiReq === window.__lateAt ? 'MagicPlace' : window.__name;
        const m = new Array(267).fill(0); m.splice(0, 9, 0xF0, 0, 0x20, 0x33, 1, 0, 0x11, 0, 127); (nm + '          ').slice(0, 10).split('').forEach((c, i) => m[13 + i] = c.charCodeAt(0)); m[266] = 0xF7; send(m); } } };
    navigator.requestMIDIAccess = () => Promise.resolve({ inputs: new Map([['i', inp]]), outputs: new Map([['o', out]]), onstatechange: null });
  });
  await p.goto('http://localhost:8765/', { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 3500));
  // sul Virus si passa a Voltar: la prima risposta del Multi arriva ancora col nome vecchio
  await p.evaluate(() => { window.__name = 'Voltar'; window.__lateName = true; window.__lateAt = window.__multiReq + 1; window.__in.onmidimessage({ data: new Uint8Array([0xF0, 0, 0x20, 0x33, 1, 0, 0x73, 0, 0x10, 1, 0xF7]) }); });
  await new Promise(r => setTimeout(r, 4500));
  console.log(JSON.stringify({ lcd: await p.evaluate(() => `${frontLcdCategory.textContent} | ${frontLcdBankProg.textContent} ${frontLcdPatchName.textContent}`), edit: await p.evaluate(() => frontEditShiftLed.className), errs }));
  await b.close();
})();
