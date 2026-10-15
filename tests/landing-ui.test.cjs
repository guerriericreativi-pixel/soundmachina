const {test}=require('node:test');
const assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const fs=require('node:fs');
const path=require('node:path');
function page(){
  const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'../web-entry/landing.php'),'utf8'),{url:'http://localhost/',runScripts:'outside-only'});
  for(const script of ['landing.js','landing-carousel.js']) dom.window.eval(fs.readFileSync(path.join(__dirname,'../web-entry',script),'utf8'));
  return dom.window;
}
test('Snow/Dark switch updates every carousel screenshot and preserves the selected instrument',()=>{
 const w=page(),d=w.document;
 d.querySelector('[data-feature="multi"]').click();
 d.querySelector('[data-theme-choice="dark"]').click();
 assert.equal(d.documentElement.dataset.theme,'dark');
 assert.match(d.getElementById('heroInstrument').src,/hero-dark-transparent.png$/);
 assert.equal(d.querySelector('[data-theme-choice="dark"]').getAttribute('aria-pressed'),'true');
 for(const img of d.querySelectorAll('[data-feature-image]')) assert.ok(img.src.endsWith(`feature-${img.dataset.featureImage}-dark.webp`));
 assert.equal(d.querySelector('[data-feature][aria-selected="true"]').dataset.feature,'multi');
 assert.equal(w.localStorage.getItem('virusTiSnow_theme'),'elektron');
 d.querySelector('[data-theme-choice="snow"]').click();
 for(const img of d.querySelectorAll('[data-feature-image]')) assert.ok(img.src.endsWith(`feature-${img.dataset.featureImage}-snow.webp`));
 assert.match(d.getElementById('heroInstrument').src,/hero-snow-transparent.png$/);
 w.close();
});
test('Carousel supports keyboard navigation, boundaries and correct accessible panels',()=>{
 const w=page(),d=w.document;const panel=d.getElementById('feature-panel');
 assert.equal(d.getElementById('featurePrevious').disabled,true);
 panel.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
 assert.equal(d.activeElement.id,'feature-single');
 assert.equal(d.getElementById('slide-single').getAttribute('aria-hidden'),'false');
 assert.equal(d.getElementById('slide-panel').getAttribute('aria-hidden'),'true');
 assert.match(d.getElementById('featureStatus').textContent,/02 \/ 08 · SINGLE/);
 d.activeElement.dispatchEvent(new w.KeyboardEvent('keydown',{key:'End',bubbles:true}));
 assert.equal(d.activeElement.id,'feature-song');
 assert.equal(d.getElementById('featureNext').disabled,true);
 d.getElementById('featurePrevious').click();
 assert.equal(d.querySelector('[data-feature][aria-selected="true"]').dataset.feature,'seq');
 d.getElementById('feature-seq').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Home',bubbles:true}));
 assert.equal(d.activeElement.id,'feature-panel');
 assert.equal(d.getElementById('featurePrevious').disabled,true);
 w.close();
});
test('Native swipe or trackpad scrolling updates the selector and navigation state',()=>{
 const w=page(),d=w.document,track=d.getElementById('featureTrack');
 [...track.children].forEach((slide,i)=>Object.defineProperty(slide,'offsetLeft',{value:100+i*600}));
 track.scrollLeft=4*600+25;
 track.dispatchEvent(new w.Event('scrollend'));
 assert.equal(d.querySelector('[data-feature][aria-selected="true"]').dataset.feature,'patch');
 assert.match(d.getElementById('featureStatus').textContent,/05 \/ 08 · PATCH/);
 assert.equal(d.querySelectorAll('.carousel-slide[aria-hidden="false"]').length,1);
 w.close();
});
test('Invite code visibility remains available',()=>{
 const w=page(),d=w.document,show=d.getElementById('showCode');
 show.click();assert.equal(d.getElementById('inviteCode').type,'text');
 show.click();assert.equal(d.getElementById('inviteCode').type,'password');
 w.close();
});
