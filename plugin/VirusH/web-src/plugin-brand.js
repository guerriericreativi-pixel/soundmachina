// Virus H — extra della versione plugin. La rimozione dei marchi Access dalle intestazioni
// e dal frontale e' ora nell'editor stesso (index.html), uguale per web e plugin.
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    document.title = 'Virus H — H-strain editor';
    // schermata di avvio sull'LCD del frontale
    const a = document.getElementById('frontLcdBankProg');
    const b = document.getElementById('frontLcdPatchName');
    if (a && b) {
      const keepA = a.textContent, keepB = b.textContent;
      a.textContent = 'H-STRAIN'; b.textContent = 'SAMPLE LOADED…';
      setTimeout(() => { if (a.textContent === 'H-STRAIN') { a.textContent = keepA; b.textContent = keepB; } }, 1600);
    }
  });
})();
