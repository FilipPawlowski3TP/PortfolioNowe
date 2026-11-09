// VISUAL RESET v2 §6/§8 Krok 3 — reveals: intro (<= 1.2 s), section heading
// line-mask reveals, guiding sentence stagger (50 ms). SplitText API verified
// against the installed gsap typings (mask/aria/autoSplit/onSplit). Hidden
// initial states exist only while these timelines run (JS-set, motion mode);
// html.reveal-all (watchdog) force-shows everything.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

// §6 intro: H1 lines in from a mask, then lead + CTAs, then the thumbnail
// (y: 24px + opacity). Total <= 1.2 s, no preloader.
export function initIntro(): void {
  const h1 = document.querySelector<HTMLElement>('.hero__h1');
  const lead = document.querySelector<HTMLElement>('.hero__lead');
  const ctas = document.querySelector<HTMLElement>('.hero__ctas');
  const shot = document.querySelector<HTMLElement>('[data-frame-wrap]');
  const caption = document.querySelector<HTMLElement>('.hero__shot .caption');
  if (!h1) return;

  const split = SplitText.create(h1, {
    type: 'lines',
    mask: 'lines',
    aria: 'auto',
    linesClass: 'split-line',
  });

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from(split.lines, { yPercent: 110, duration: 0.7, stagger: 0.08 }, 0)
    .from([lead, ctas].filter(Boolean), { y: 16, opacity: 0, duration: 0.35, stagger: 0.08 }, 0.35)
    .from([shot, caption].filter(Boolean), { y: 24, opacity: 0, duration: 0.5 }, 0.5);
}

// §6: "Wejście nagłówków sekcji maską linii przy wejściu w viewport".
export function initHeadingReveals(): void {
  for (const h of document.querySelectorAll<HTMLElement>('main h2')) {
    const split = SplitText.create(h, {
      type: 'lines',
      mask: 'lines',
      aria: 'auto',
      linesClass: 'split-line',
    });
    gsap.from(split.lines, {
      yPercent: 110,
      duration: 0.6,
      stagger: 0.06,
      ease: 'power3.out',
      scrollTrigger: { trigger: h, start: 'top 88%', once: true },
    });
  }
}

// §6: "Zdanie przewodnie: kolejne wiersze wjeżdżają od dołu z lekkim
// przesunięciem w osi Y i opóźnieniem 50 ms".
export function initGuidingReveal(): void {
  const el = document.querySelector<HTMLElement>('.guiding__text');
  if (!el) return;
  const split = SplitText.create(el, {
    type: 'lines',
    aria: 'auto',
    linesClass: 'split-line',
  });
  gsap.from(split.lines, {
    y: 32,
    opacity: 0,
    duration: 0.55,
    stagger: 0.05,
    ease: 'power2.out',
    scrollTrigger: { trigger: el, start: 'top 85%', once: true },
  });
}
