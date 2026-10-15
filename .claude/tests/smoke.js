// Test di base: apre l'editor con un MIDI finto, visita tutte le schede, tocca i comandi principali, segnala errori JS.
const puppeteer = require('/Users/lorenzoguerrieri/Music/soundmachina/node_modules/puppeteer');
(async () => {
  const b = await puppeteer.launch({ headless: 'new', executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const p = await b.newPage(); await p.setViewport({ width: 1440, height: 1100 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.evaluateOnNewDocument(() => {
    try { ['btnTabSnow','btnTabMultipart','btnTabSynth','btnTabFxRack','btnTabPatchManager','btnTabArp','btnTabSequencer','btnTabSong'].forEach(k => localStorage.setItem('virusH_helpSeen_' + k, '1')); } catch (e) {}
    window.__tx = []; const out = { id: 'o', name: 'V', type: 'output', state: 'connected', send(d) { window.__tx.push(Array.from(d)); } };
    navigator.requestMIDIAccess = () => Promise.resolve({ inputs: new Map(), outputs: new Map([['o', out]]), onstatechange: null });
  });
  await p.goto('http://localhost:8765/', { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 1500));
  const tabs = ['btnTabSnow','btnTabMultipart','btnTabSynth','btnTabFxRack','btnTabPatchManager','btnTabArp','btnTabSequencer','btnTabSong'];
  let clicked = 0;
  for (const t of tabs) {
    await p.click('#' + t); await new Promise(r => setTimeout(r, 600));
    clicked += await p.evaluate(() => {
      const view = [...document.querySelectorAll('.main-content')].find(v => v.offsetParent);
      const btns = view ? [...view.querySelectorAll('button')].filter(b => b.offsetParent && !/clear|panic|cattura|salva|save|delete|elimina|ripristina|importa|backup/i.test(b.textContent)) : [];
      btns.slice(0, 60).forEach(b => { try { b.click(); } catch (e) {} });
      return btns.length;
    });
    await new Promise(r => setTimeout(r, 300));
    await p.evaluate(() => document.querySelectorAll('.ui-dialog button, #partLookPicker').forEach(x => x.closest('#partLookPicker') ? x.remove() : x.click()));
  }
  console.log(JSON.stringify({ tabs: tabs.length, buttonsClicked: clicked, midiSent: await p.evaluate(() => window.__tx.length), errs: [...new Set(errs)] }));
  await b.close();
})();
