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
    hero.src = `assets/landing/hero-${root.dataset.theme}-transparent.png`;
    hero.alt = dark ? 'Access Virus TI2 Desktop, scocca scura e pannello completo' : 'Access Virus TI Snow, scocca chiara e display azzurro';
    document.querySelectorAll('[data-feature-image]').forEach(image => {
      image.src = `assets/landing/feature-${image.dataset.featureImage}-${root.dataset.theme}.webp`;
    });
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
})();
