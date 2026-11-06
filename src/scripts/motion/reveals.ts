// Reveals: one orchestrated hero entrance + sparing scroll-driven reveals.
// Masterprompt 8.5: NOT fade-up on every block — key headings and section
// intros only. SplitText keeps full text accessible (aria: 'auto').
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

export function initReveals(): void {
  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    // Hero entrance is pure CSS (motion.css) so the LCP element paints at
    // first render — JS never gates hero visibility (masterprompt sekcja 9).

    // --- Section headings: masked line reveal on scroll ---
    gsap.utils.toArray<HTMLElement>('.section__heading').forEach((el) => {
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        aria: 'auto',
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 110,
            duration: 0.8,
            stagger: 0.08,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          }),
      });
    });

    // --- Section intros + labels: plain fade (masterprompt: simple fade for prose) ---
    gsap.utils.toArray<HTMLElement>('.section__label, .section__intro').forEach((el) => {
      gsap.from(el, {
        autoAlpha: 0,
        y: 16,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });

    // --- Act III (Proces): pinned step sequence on desktop only (<= 2 screens).
    // Accessibility over effect: text never dims below AA contrast — the
    // progression is carried by motion + the decorative step numbers.
    mm.add('(prefers-reduced-motion: no-preference) and (min-width: 60rem)', () => {
      const steps = gsap.utils.toArray<HTMLElement>('.process-step');
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '.process',
          start: 'top top+=72',
          end: '+=150%',
          pin: true,
          scrub: 0.4,
          invalidateOnRefresh: true,
        },
      });
      steps.forEach((step, i) => {
        const num = step.querySelector<HTMLElement>('.process-step__number');
        tl.fromTo(step, { y: 24 }, { y: 0, duration: 1, ease: 'none' }, i);
        if (num) {
          tl.fromTo(
            num,
            { color: '#8FD3FF' },
            { color: '#FF8A5B', duration: 1, ease: 'none' },
            i,
          );
        }
      });
    });
  });
}
