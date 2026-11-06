// Lenis smooth scroll synced with GSAP ScrollTrigger (MASTERPROMPT załącznik A).
// One animation loop: gsap.ticker drives Lenis; the WebGL renderer joins the
// same ticker in Phase 5. No extra requestAnimationFrame anywhere.
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initSmoothScroll(): Lenis | null {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return null;

  const lenis = new Lenis({ lerp: 0.1 }); // autoRaf off — gsap.ticker drives it

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000)); // GSAP seconds -> Lenis ms
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

// Anchor navigation: smooth scroll with header offset, hash update, focus move.
// Native scrolling stays untouched everywhere else (no scroll-jacking).
export function initAnchors(lenis: Lenis | null): void {
  const headerH =
    document.querySelector('.site-header')?.getBoundingClientRect().height ?? 72;

  document.addEventListener('click', (event) => {
    const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>(
      'a[href^="#"]',
    );
    if (!anchor) return;
    const hash = anchor.getAttribute('href');
    if (!hash || hash.length < 2) return;
    const target = document.querySelector<HTMLElement>(hash);
    if (!target) return;

    event.preventDefault();
    history.replaceState(null, '', hash);

    const moveFocus = () => {
      const heading = target.querySelector<HTMLElement>('h1, h2, h3') ?? target;
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    };

    if (lenis) {
      lenis.scrollTo(target, {
        offset: -(headerH + 8),
        duration: 1.1,
        onComplete: moveFocus,
      });
    } else {
      target.scrollIntoView({ block: 'start' });
      moveFocus();
    }
  });
}
