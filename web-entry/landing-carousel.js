(() => {
  'use strict';
  const track = document.getElementById('featureTrack');
  if (!track) return;
  const tabs = [...document.querySelectorAll('[data-feature]')];
  const slides = [...track.querySelectorAll('.carousel-slide')];
  const previous = document.getElementById('featurePrevious');
  const next = document.getElementById('featureNext');
  const status = document.getElementById('featureStatus');
  const navigation = document.querySelector('.carousel-tabs');
  let activeIndex = 0;
  let scrollTimer;
  let destination = null;
  const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const slidePosition = index => slides[index].offsetLeft - slides[0].offsetLeft;

  function updateSelection(index) {
    activeIndex = index;
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      slides[i].setAttribute('aria-hidden', String(i !== index));
      slides[i].tabIndex = i === index ? 0 : -1;
    });
    previous.disabled = index === 0;
    next.disabled = index === slides.length - 1;
    status.textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')} · ${tabs[index].textContent}`;
    // Keep the selected instrument visible inside the mobile navigation only.
    const tab = tabs[index];
    if (navigation.scrollWidth > navigation.clientWidth) {
      const tabLeft = tab.offsetLeft - navigation.offsetLeft;
      if (tabLeft < navigation.scrollLeft || tabLeft + tab.offsetWidth > navigation.scrollLeft + navigation.clientWidth) {
        navigation.scrollTo?.({left: tabLeft, behavior: 'auto'});
      }
    }
  }

  function selectFeature(index, focus = false) {
    const target = Math.max(0, Math.min(index, slides.length - 1));
    updateSelection(target);
    destination = target;
    track.scrollTo?.({left: slidePosition(target), behavior: reducedMotion() ? 'auto' : 'smooth'});
    if (focus) tabs[target].focus({preventScroll: true});
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectFeature(index));
    tab.addEventListener('keydown', event => {
      const target = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? (index + 1) % tabs.length
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? (index + tabs.length - 1) % tabs.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
      if (target >= 0) { event.preventDefault(); selectFeature(target, true); }
    });
  });
  previous.addEventListener('click', () => selectFeature(activeIndex - 1));
  next.addEventListener('click', () => selectFeature(activeIndex + 1));

  function settleScroll() {
    // Native touch/trackpad scrolling is the source of truth after it settles.
    const nearest = slides.reduce((best, _, i) =>
      Math.abs(slidePosition(i) - track.scrollLeft) < Math.abs(slidePosition(best) - track.scrollLeft) ? i : best, 0);
    destination = null;
    updateSelection(nearest);
  }
  track.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(settleScroll, 160);
  }, {passive: true});
  track.addEventListener('scrollend', () => { clearTimeout(scrollTimer); settleScroll(); });
  // A user gesture interrupts any pending programmatic navigation.
  track.addEventListener('pointerdown', () => { destination = null; }, {passive: true});
  window.addEventListener('resize', () => {
    clearTimeout(scrollTimer);
    track.scrollTo?.({left: slidePosition(destination ?? activeIndex), behavior: 'auto'});
  });
  updateSelection(0);
})();
