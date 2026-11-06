// Motion boot (MASTERPROMPT sekcja 10). Content is visible without JS; the
// html.js class enables initial hidden states; a 3 s watchdog (Base.astro)
// reveals everything if this module never runs or throws.
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initSmoothScroll, initAnchors } from './motion/smooth-scroll';
import { initReveals } from './motion/reveals';
import { initMenu } from './motion/menu';

declare global {
  interface Window {
    __MOTION_READY__?: boolean;
  }
}

function revealAll(): void {
  document.documentElement.classList.add('reveal-all');
}

function boot(): void {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    revealAll();
    window.__MOTION_READY__ = true;
    return;
  }

  const lenis = initSmoothScroll();
  initAnchors(lenis);
  initMenu(lenis);
  initReveals();

  window.__MOTION_READY__ = true;

  // Triggers depend on layout: refresh once fonts and images settle.
  document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}

try {
  boot();
} catch (error) {
  console.error('[motion] boot failed', error);
  revealAll();
}
