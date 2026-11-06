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

  initWebGL();
}

// WebGL layer loads AFTER first render (masterprompt 11.1): load event ->
// requestIdleCallback -> dynamic import. Failures fall back to the CSS layer.
function initWebGL(): void {
  const mount = document.getElementById('scene-root');
  if (!mount) return;

  const start = async () => {
    try {
      const { resolveTier } = await import('./webgl/tier');
      const tier = resolveTier();
      if (tier === 0) {
        mount.classList.add('scene-tier-0');
        return;
      }
      const [{ initScene }, { createSceneState }] = await Promise.all([
        import('./webgl/scene'),
        import('./webgl/acts'),
      ]);
      initScene(tier, createSceneState(), mount);
    } catch (error) {
      console.error('[webgl] scene failed', error);
      mount.classList.add('scene-tier-0');
    }
  };

  window.addEventListener(
    'load',
    () => {
      const ric = (window as unknown as {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void;
      }).requestIdleCallback;
      if (ric) ric(start, { timeout: 1500 });
      else window.setTimeout(start, 300);
    },
    { once: true },
  );
}

try {
  boot();
} catch (error) {
  console.error('[motion] boot failed', error);
  revealAll();
}
