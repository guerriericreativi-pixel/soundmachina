const {test}=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const fs=require('node:fs');
const path=require('node:path');
function page(){
  const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'../web-entry/landing.php'),'utf8'),{url:'http://localhost/',runScripts:'outside-only'});
  dom.window.eval(fs.readFileSync(path.join(__dirname,'../web-entry/landing.js'),'utf8'));
  return dom.window;
}
test('Snow/Dark switch updates the actual hardware hero, feature images and editor theme',()=>{
 const w=page(),d=w.document;d.querySelector('[data-theme-choice="dark"]').click();
 assert.equal(d.documentElement.dataset.theme,'dark');
 assert.match(d.getElementById('heroInstrument').src,/hero-dark.webp$/);
 assert.equal(d.querySelector('[data-theme-choice="dark"]').getAttribute('aria-pressed'),'true');
 assert.match(d.getElementById('featureImage').src,/detail-panel-dark.webp$/);
 assert.equal(w.localStorage.getItem('virusTiSnow_theme'),'elektron');
 d.querySelector('[data-theme-choice="snow"]').click();assert.match(d.getElementById('featureImage').src,/detail-panel-snow.webp$/);
 w.close();
});
test('Feature exploration supports keyboard navigation and updates description and image',()=>{
 const w=page(),d=w.document;const panel=d.getElementById('feature-panel');
 panel.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));
 assert.equal(d.activeElement.id,'feature-patch');assert.equal(d.getElementById('featureDisplay').getAttribute('aria-labelledby'),'feature-patch');
 assert.match(d.getElementById('featureImage').src,/detail-patch-snow.webp$/);
 assert.match(d.getElementById('featureCopy').textContent,/importa i tuoi file/);
 const show=d.getElementById('showCode');show.click();assert.equal(d.getElementById('inviteCode').type,'text');show.click();assert.equal(d.getElementById('inviteCode').type,'password');
 w.close();
});
