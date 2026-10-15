(() => {
  'use strict';
  const root = document.documentElement;
  const themeButtons = [...document.querySelectorAll('[data-theme-choice]')];
  const hero = document.getElementById('heroInstrument');
  const caption = document.getElementById('instrumentCaption');
  function setTheme(theme) {
    const dark = theme === 'dark';
    root.dataset.theme = dark ? 'dark' : 'snow';
    themeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === root.dataset.theme)));
    hero.src = `assets/landing/hero-${root.dataset.theme}.webp`;
    hero.alt = dark ? 'Access Virus TI2 Desktop, scocca scura e pannello completo' : 'Access Virus TI Snow, scocca chiara e display azzurro';
    const activeFeature = document.querySelector('[data-feature][aria-selected="true"]')?.dataset.feature || 'panel';
    document.getElementById('featureImage').src = `assets/landing/detail-${activeFeature}-${root.dataset.theme}.webp`;
    caption.textContent = dark ? 'VIRUS TI2 DESKTOP' : 'VIRUS TI SNOW';
    document.querySelector('meta[name="theme-color"]').content = dark ? '#191d1c' : '#e9e9e3';
    try { localStorage.setItem('virusHLandingTheme', root.dataset.theme); localStorage.setItem('virusTiSnow_theme', dark ? 'elektron' : 'te'); } catch (_) {}
  }
  let saved;
  try { saved = localStorage.getItem('virusHLandingTheme'); } catch (_) {}
  setTheme(saved === 'dark' ? 'dark' : 'snow');
  themeButtons.forEach(button => button.addEventListener('click', () => setTheme(button.dataset.themeChoice)));
  const show = document.getElementById('showCode');
  const code = document.getElementById('inviteCode');
  show?.addEventListener('click', () => {
    const visible = code.type === 'password';
    code.type = visible ? 'text' : 'password';
    show.setAttribute('aria-pressed', String(visible));
    show.setAttribute('aria-label', visible ? 'Nascondi codice invito' : 'Mostra codice invito');
  });
  document.getElementById('inviteForm')?.addEventListener('submit', event => {
    const button = event.currentTarget.querySelector('[type="submit"]');
    button.disabled = true;
    button.textContent = 'Verifica del codice…';
  });
  // Browsers may restore disabled controls from a back/forward cache snapshot.
  window.addEventListener('pageshow', () => {
    const button = document.querySelector('#inviteForm [type="submit"]');
    if (button?.disabled) { button.disabled = false; button.textContent = 'Accedi a VIRUS-H'; }
  });
  const features = {
    panel: ['IL GESTO, PRIMA DEL MENU', 'Manopole, filtri, inviluppi ed effetti in viste dedicate. Parti dal pannello, entra nel suono e regola ciò che ti serve.', 'Pannello di controllo VIRUS-H'],
    patch: ['LE IDEE, AL POSTO GIUSTO', 'Cerca nelle patch, importa i tuoi file e scegli la parte in cui caricare il suono. La libreria locale conserva quello che vuoi ritrovare.', 'Libreria PATCH di VIRUS-H'],
    multi: ['QUATTRO PARTI, UNA DIREZIONE', 'Costruisci un setup a quattro parti con livelli, canali e suoni distinti. Poi esplora arpeggiatore e sequencer per dare movimento all’idea.', 'Mixer MULTI a quattro parti di VIRUS-H'],
  };
  const tabs = [...document.querySelectorAll('[data-feature]')];
  function selectFeature(tab, focus = false) {
    tabs.forEach(item => { const on = item === tab; item.setAttribute('aria-selected', String(on)); item.tabIndex = on ? 0 : -1; });
    const [kicker, copy, alt] = features[tab.dataset.feature];
    document.getElementById('featureKicker').textContent = kicker;
    document.getElementById('featureCopy').textContent = copy;
    const image = document.getElementById('featureImage');
    image.src = `assets/landing/detail-${tab.dataset.feature}-${root.dataset.theme}.webp`;
    image.alt = alt;
    document.getElementById('featureDisplay').setAttribute('aria-labelledby', tab.id);
    if (focus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectFeature(tab));
    tab.addEventListener('keydown', event => {
      const next = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
      if (next >= 0) { event.preventDefault(); selectFeature(tabs[next], true); }
    });
  });
})();
