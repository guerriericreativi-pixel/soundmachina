const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('Browser console:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('Browser error:', err));
  await page.goto('file:///Users/lorenzoguerrieri/Music/soundmachina/index.html');
  await page.waitForTimeout(2000);
  await browser.close();
})();
