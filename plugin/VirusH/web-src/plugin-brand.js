// Virus H — branding della versione plugin distribuita.
// Toglie i marchi Access dalle intestazioni (logo "access", "VIRUS | TI SNOW",
// "VIRUS TI2 | DARK STAR") sostituendoli con "VIRUS H"; i testi d'aiuto che
// citano "Access Virus TI" restano, perche' indicano solo la compatibilita'.
(function () {
  const BRAND = /VIRUS\s*(TI2?\s*)?(\||\/\/|\/)\s*(TI\s*SNOW|DARK\s*STAR)/gi;
  const HEADER = 'VIRUS H';

  function brandText(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n => {
      const p = n.parentElement;
      if (!p || p.closest('script, style, .section-info-popup, .virus-info-popup')) return;
      if (BRAND.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(BRAND, HEADER);
      BRAND.lastIndex = 0;
      if (/virus ti snow\s*\/\//i.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/virus ti snow\s*\/\//i, 'virus h //');
      if (/^\s*access\s*$/i.test(n.nodeValue) && p.closest('.hardware-chassis')) {
        const logo = p.closest('[style*="position: absolute"], .chassis-access-logo') || p;
        logo.style.display = 'none';
      }
    });
    // badge "VIRUS | TI SNOW" spezzato in piu' span
    document.querySelectorAll('.hardware-chassis *').forEach(el => {
      if (el.children.length && el.children.length <= 2 && /^VIRUS\s*\|\s*(TI SNOW|DARK STAR)$/i.test(el.textContent.trim().replace(/\s+/g, ' '))) {
        el.textContent = HEADER;
      }
    });
    document.querySelectorAll('.hardware-chassis span').forEach(el => {
      if (el.textContent.trim() === '❖') el.style.display = 'none';
    });
  }

  let pending = 0;
  const schedule = () => { if (!pending) pending = requestAnimationFrame(() => { pending = 0; brandText(document.body); }); };

  document.addEventListener('DOMContentLoaded', () => {
    brandText(document.body);
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, characterData: true });
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
