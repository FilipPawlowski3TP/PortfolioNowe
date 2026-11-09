// Motion boot (VISUAL RESET v2, §8 Krok 0): simplified to initMotion().
// Content is visible without JS; a 3 s watchdog (Base.astro) reveals
// everything if this module never runs or throws. No WebGL, no canvas.
import { initMenu } from './motion/menu';

declare global {
  interface Window {
    __MOTION_READY__?: boolean;
  }
}

export function initMotion(): void {
  // Wayfinding is not motion — works in every mode.
  initMenu(null);
  window.__MOTION_READY__ = true;
}

try {
  initMotion();
} catch (error) {
  console.error('[motion] boot failed', error);
  document.documentElement.classList.add('reveal-all');
}
