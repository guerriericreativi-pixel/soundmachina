// Ricomprime gli sprite WebP generati da Blender (che salva a qualita' fissa) con l'encoder di Chrome.
// Uso: node tools/render-sprites/compress.js [qualita' 0..1, default 0.8]
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const DIR = path.join(__dirname, '..', '..', 'assets', 'sprites');
const Q = parseFloat(process.argv[2] || '0.8');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', executablePath: CHROME });
  const page = await browser.newPage();
  for (const f of fs.readdirSync(DIR).filter(n => n.endsWith('.webp'))) {
    const file = path.join(DIR, f);
    const src = 'data:image/webp;base64,' + fs.readFileSync(file).toString('base64');
    const out = await page.evaluate(async (src, q) => {
      const img = new Image(); img.src = src; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      c.getContext('2d').drawImage(img, 0, 0);
      return c.toDataURL('image/webp', q);
    }, src, Q);
    const buf = Buffer.from(out.split(',')[1], 'base64');
    const before = fs.statSync(file).size;
    if (buf.length < before) fs.writeFileSync(file, buf);
    console.log(f, Math.round(before / 1024) + ' KB ->', Math.round(Math.min(buf.length, before) / 1024) + ' KB');
  }
  await browser.close();
})();
