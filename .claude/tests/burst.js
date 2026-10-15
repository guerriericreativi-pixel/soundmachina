const puppeteer = require('/Users/lorenzoguerrieri/Music/soundmachina/node_modules/puppeteer');
(async () => {
  const b = await puppeteer.launch({ headless: 'new', executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const p = await b.newPage(); await p.setViewport({ width: 1440, height: 1200 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  // Virus lento: risponde in 120-170 ms e ignora richieste che arrivano mentre e' occupato (come nel log)
  await p.evaluateOnNewDocument(() => {
    try { ['btnTabSnow','btnTabMultipart'].forEach(k => localStorage.setItem('virusH_helpSeen_' + k, '1')); localStorage.setItem('virusH_synthMode', 'multi'); } catch (e) {}
    window.__multi = 0; window.__tx = []; let busyUntil = 0;
    const inp = window.__in = { id: 'i', name: 'V', type: 'input', state: 'connected', onmidimessage: null };
    const send = (a, ms) => setTimeout(() => inp.onmidimessage && inp.onmidimessage({ data: new Uint8Array(a) }), ms);
    const SETS = [['A1', 'A2', 'A3', 'A4'], ['FatBoy P1', 'FatBoy P2', 'FatBoy P3', 'FatBoy P4']], MN = ['Interstell', 'FAT Boy'];
    const dump = prog => { const d = new Array(524).fill(0); d.splice(0, 9, 0xF0, 0, 0x20, 0x33, 1, 0, 0x10, 0, prog); d[523] = 0xF7; (SETS[window.__multi][prog] + '          ').slice(0, 10).split('').forEach((c, i) => d[249 + i] = c.charCodeAt(0)); return d; };
    const out = { id: 'o', name: 'V', type: 'output', state: 'connected', send(d) { window.__tx.push(Array.from(d)); if (d[0] !== 0xF0) return;
      const now = performance.now(); if (now < busyUntil) return; busyUntil = now + 100;   // occupato: richiesta persa
      if (d[6] === 0x30 && d[8] < 16) send(dump(d[8]), 150);
      if (d[6] === 0x31) { const m = new Array(267).fill(0); m.splice(0, 9, 0xF0, 0, 0x20, 0x33, 1, 0, 0x11, 0, 127); (MN[window.__multi] + ' ').split('').forEach((c, i) => m[13 + i] = c.charCodeAt(0)); m[266] = 0xF7; send(m, 90); } } };
    navigator.requestMIDIAccess = () => Promise.resolve({ inputs: new Map([['i', inp]]), outputs: new Map([['o', out]]), onstatechange: null });
  });
  await p.goto('http://localhost:8765/', { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 1500));
  await p.click('#btnTabMultipart'); await new Promise(r => setTimeout(r, 3500));
  // cambio Multi sul synth: tre segnali di fila
  await p.evaluate(() => { window.__multi = 1; const sig = [0xF0, 0, 0x20, 0x33, 1, 0, 0x73, 0, 0x10, 1, 0xF7]; [0, 900, 1900].forEach(t => setTimeout(() => window.__in.onmidimessage({ data: new Uint8Array(sig) }), t)); });
  await new Promise(r => setTimeout(r, 7000));
  const r = await p.evaluate(() => ({ multi: window.virusMultiName, names: multiParts.map(x => x.name) }));
  r.errs = errs; console.log(JSON.stringify(r)); await b.close();
})();
