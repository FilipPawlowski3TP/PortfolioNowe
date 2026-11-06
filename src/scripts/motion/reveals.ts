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

    // --- Global scrub choreography (G2 feedback: the whole page should flow
    // like the pinned Proces sequence). Transform-only: text contrast is never
    // broken mid-scroll. ---

    // Hero exits with parallax
    gsap.to('.hero__content', {
      yPercent: -10,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.5 },
    });

    // Offer cards rise in a wave as the section enters
    gsap.from('.offer-card', {
      y: 60,
      stagger: 0.12,
      ease: 'none',
      scrollTrigger: { trigger: '.offer__grid', start: 'top 90%', end: 'top 35%', scrub: 0.6 },
    });

    // Standard + FAQ + contact: gentle staggered rises tied to scroll
    gsap.from('.standard-item', {
      y: 50,
      stagger: 0.1,
      ease: 'none',
      scrollTrigger: { trigger: '.standard__grid', start: 'top 88%', end: 'top 40%', scrub: 0.6 },
    });
    gsap.from('.faq-item', {
      y: 30,
      stagger: 0.08,
      ease: 'none',
      scrollTrigger: { trigger: '.faq__list', start: 'top 88%', end: 'top 45%', scrub: 0.6 },
    });
    gsap.from('.contact__grid', {
      y: 60,
      ease: 'none',
      scrollTrigger: { trigger: '.contact', start: 'top 88%', end: 'top 45%', scrub: 0.6 },
    });

    // --- Act IV (Realizacje): short pinned sequence on desktop, like Proces ---
    mm.add('(prefers-reduced-motion: no-preference) and (min-width: 60rem)', () => {
      const steps = gsap.utils.toArray<HTMLElement>('.case-study__step');
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '.case-study',
          start: 'top top+=72',
          end: '+=100%',
          pin: true,
          scrub: 0.4,
          invalidateOnRefresh: true,
        },
      });
      tl.fromTo(
        '.case-study__mockups',
        { y: 30 },
        { y: -30, duration: steps.length, ease: 'none' },
        0,
      );
      steps.forEach((step, i) => {
        // Labels glow from structural blue to the warm accent (both pass AA)
        tl.fromTo(step, { color: '#8FD3FF' }, { color: '#FF8A5B', duration: 1, ease: 'none' }, i);
        const body = step.nextElementSibling;
        if (body) tl.fromTo(body, { y: 24 }, { y: 0, duration: 1, ease: 'none' }, i);
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
