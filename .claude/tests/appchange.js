// MULTI: cambio suono dall'app (tasto suono del PANEL) -> il Virus carica il suono nuovo -> l'app deve mostrarne il nome
const puppeteer = require('/Users/lorenzoguerrieri/Music/soundmachina/node_modules/puppeteer');
(async () => {
  const b = await puppeteer.launch({ headless: 'new', executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const p = await b.newPage(); await p.setViewport({ width: 1440, height: 1000 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.evaluateOnNewDocument((slow) => {
    try { localStorage.setItem('virusH_helpSeen_btnTabSnow', '1'); localStorage.setItem('virusH_synthMode', 'multi'); } catch (e) {}
    let prog = 0, loadedAt = 0; window.__tx = [];
    const NAMES = ['Parafin HS', 'Sighing BC', 'TransEE HS', 'Venus KS', 'DM ARP6', 'Sub-W   DC', 'FunkTripMS', 'Lofibrk NM'];
    const inp = { id: 'i', name: 'V', type: 'input', state: 'connected', onmidimessage: null };
    const send = a => setTimeout(() => inp.onmidimessage && inp.onmidimessage({ data: new Uint8Array(a) }), 60);
    const dump = pp => { const d = new Array(524).fill(0); d.splice(0, 9, 0xF0, 0, 0x20, 0x33, 1, 0, 0x10, 0, pp);
      // il Virus impiega un po' a caricare il suono nuovo: prima di 'slow' ms risponde ancora col vecchio
      const n = pp === 0 ? NAMES[performance.now() - loadedAt < slow ? window.__prev : prog] : 'Other'; d[523] = 0xF7; ((n || 'x') + '          ').slice(0, 10).split('').forEach((c, i) => d[249 + i] = c.charCodeAt(0)); return d; };
    const out = { id: 'o', name: 'V', type: 'output', state: 'connected', send(d) { window.__tx.push(Array.from(d));
      if ((d[0] & 0xF0) === 0xC0 && (d[0] & 15) === 0) { window.__prev = prog; prog = d[1] % 8; loadedAt = performance.now(); send([0xF0, 0, 0x20, 0x33, 1, 0, 0x73, 0, 0x10, 1, 0xF7]); }
      if (d[0] !== 0xF0) return;
      if (d[6] === 0x30) send(dump(d[8]));
      if (d[6] === 0x31) { const m = new Array(267).fill(0); m.splice(0, 9, 0xF0, 0, 0x20, 0x33, 1, 0, 0x11, 0, 127); 'magicplace'.split('').forEach((c, i) => m[13 + i] = c.charCodeAt(0)); m[266] = 0xF7; send(m); } } };
    navigator.requestMIDIAccess = () => Promise.resolve({ inputs: new Map([['i', inp]]), outputs: new Map([['o', out]]), onstatechange: null });
  }, +(process.argv[2] || 0));
  await p.goto('http://localhost:8765/', { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 3000));
  const lcd = () => p.evaluate(() => `${frontLcdCategory.textContent} | ${frontLcdBankProg.textContent} ${frontLcdPatchName.textContent} | name=${multiParts[0].name}`);
  const r = { start: await lcd() };
  await p.click('#frontBtnValPlus'); await new Promise(r => setTimeout(r, 1200)); r.t1200 = await lcd();       // suono 2 del gruppo
  await new Promise(r => setTimeout(r, 2500)); r.t2800 = await lcd();
  r.errs = errs; console.log(JSON.stringify(r, null, 1)); await b.close();
})();
