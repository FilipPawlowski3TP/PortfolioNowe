// Reveals + act choreography (MASTERPROMPT sekcja 10, skill: cinematic-scroll-sites).
// Hero entrance is pure CSS (motion.css). Here: the scroll RIDE — every act is
// a pinned full-viewport stage with beats (Proces-style, the owner's favourite
// "hook"), and every gap between acts is a full-travel scrubbed transition, so
// no scroll pixel is ever dead. Owner feedback v3: hooks in ALL acts (including
// Standard/FAQ/Kontakt), no empty exits, pins only on windows tall enough to
// hold the stage (short windows get the scrub-only ride — no cropping bugs).
//
// CRITICAL: triggers created in DOM order with refreshPriority (topmost highest)
// + anticipatePin — out-of-order pins overlap their pin-spacers on refresh.
// Accessibility: transforms/colors only — text contrast never breaks mid-scroll.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

export function initReveals(): void {
  const mm = gsap.matchMedia();

  // ---------------------------------------------------------------
  // Heading reveals (masked lines) — never pinned, any width
  // ---------------------------------------------------------------
  mm.add('(prefers-reduced-motion: no-preference)', () => {
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
  });

  // ---------------------------------------------------------------
  // Desktop + tall windows: full pinned ride, acts in DOM order
  // ---------------------------------------------------------------
  mm.add(
    '(prefers-reduced-motion: no-preference) and (min-width: 60rem) and (min-height: 50rem)',
    () => {
      // --- ACT I — Hero: parallax beats (the next act covers the hand-off) ---
      const heroTl = gsap.timeline({
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: '+=100%',
          pin: true,
          scrub: 0.4,
          anticipatePin: 1,
          refreshPriority: 14,
          invalidateOnRefresh: true,
        },
      });
      heroTl
        .to('[data-hero="title"]', { yPercent: -12, ease: 'none' }, 0)
        .to('[data-hero="lead"]', { yPercent: -7, ease: 'none' }, 0)
        .to('[data-hero="ctas"]', { yPercent: -3, ease: 'none' }, 0);

      // --- ACT II — Oferta: card-by-card beats (the Proces-style hook) ---
      riseIn('.offer', 13);
      const cards = gsap.utils.toArray<HTMLElement>('.offer-card');
      const offerTl = beats('.offer', 12);
      cards.forEach((card, i) => {
        offerTl.fromTo(card, { y: 26 }, { y: 0, duration: 1, ease: 'none' }, i * 0.8);
        offerTl.fromTo(
          card,
          { borderColor: 'rgba(143, 211, 255, 0.14)' },
          { borderColor: 'rgba(255, 138, 91, 0.55)', duration: 1, ease: 'none' },
          i * 0.8,
        );
      });

      // --- ACT III — Proces: step beats (owner's favourite) ---
      riseIn('.process', 11);
      const steps = gsap.utils.toArray<HTMLElement>('.process-step');
      const processTl = beats('.process', 10);
      steps.forEach((step, i) => {
        const num = step.querySelector<HTMLElement>('.process-step__number');
        processTl.fromTo(step, { y: 24 }, { y: 0, duration: 1, ease: 'none' }, i);
        if (num) {
          processTl.fromTo(num, { color: '#8FD3FF' }, { color: '#FF8A5B', duration: 1, ease: 'none' }, i);
        }
      });

      // --- ACT IV — Realizacje: story beats + mockup drift ---
      riseIn('.case-study', 9);
      const caseSteps = gsap.utils.toArray<HTMLElement>('.case-study__step');
      const caseTl = beats('.case-study', 8);
      caseTl.fromTo('.case-study__mockups', { y: 26 }, { y: -26, duration: caseSteps.length + 1, ease: 'none' }, 0);
      caseSteps.forEach((step, i) => {
        caseTl.fromTo(step, { color: '#8FD3FF' }, { color: '#FF8A5B', duration: 1, ease: 'none' }, i);
        const body = step.nextElementSibling;
        if (body) caseTl.fromTo(body, { y: 22 }, { y: 0, duration: 1, ease: 'none' }, i);
      });

      // --- ACT V — Standard: pillar-by-pillar beats ---
      riseIn('.standard', 7);
      const pillars = gsap.utils.toArray<HTMLElement>('.standard-item');
      const standardTl = beats('.standard', 6);
      pillars.forEach((item, i) => {
        standardTl.fromTo(item, { y: 22 }, { y: 0, duration: 1, ease: 'none' }, i * 0.8);
        standardTl.fromTo(
          item,
          { borderColor: 'rgba(143, 211, 255, 0.14)' },
          { borderColor: 'rgba(255, 138, 91, 0.5)', duration: 1, ease: 'none' },
          i * 0.8,
        );
      });

      // --- ACT VI — FAQ: question-by-question beats ---
      riseIn('.faq', 5);
      const faqItems = gsap.utils.toArray<HTMLElement>('.faq-item');
      const faqTl = beats('.faq', 4);
      faqItems.forEach((item, i) => {
        faqTl.fromTo(item, { y: 18 }, { y: 0, duration: 1, ease: 'none' }, i * 0.55);
        faqTl.fromTo(
          item,
          { borderColor: 'rgba(143, 211, 255, 0.14)' },
          { borderColor: 'rgba(255, 138, 91, 0.45)', duration: 1, ease: 'none' },
          i * 0.55,
        );
      });

      // --- ACT VII — Kontakt: the dawn finale beats (form always interactive) ---
      riseIn('.contact', 3);
      const contactBlocks = gsap.utils.toArray<HTMLElement>('.contact-form, .contact__aside');
      const contactTl = beats('.contact', 2);
      contactBlocks.forEach((block, i) => {
        contactTl.fromTo(block, { y: 30 }, { y: 0, duration: 1.2, ease: 'none' }, i * 1.2);
      });
    },
  );

  // ---------------------------------------------------------------
  // Mobile / short windows: continuous scrubbed ride, zero pins
  // (TBT <= 200 ms lab — keep the trigger count minimal)
  // ---------------------------------------------------------------
  mm.add(
    '(prefers-reduced-motion: no-preference) and (max-width: 59.99rem), (prefers-reduced-motion: no-preference) and (max-height: 49.99rem)',
    () => {
      gsap.to('.hero__content', {
        yPercent: -8,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.5 },
      });
      for (const sel of ['.offer', '.process', '.contact']) {
        gsap.from(`${sel} > .container`, {
          y: 90,
          ease: 'none',
          scrollTrigger: { trigger: sel, start: 'top bottom', end: 'top 35%', scrub: 0.5 },
        });
      }
    },
  );
}

// Full-travel scrubbed entrance: the section rises over its whole travel —
// motion on every pixel of the hand-off (no dead zones between pinned acts).
function riseIn(section: string, priority: number): void {
  gsap.from(`${section} > .container`, {
    y: 150,
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top bottom',
      end: 'top 15%',
      scrub: 0.5,
      refreshPriority: priority,
    },
  });
}

// A pinned act's beat timeline: plays over the pin distance.
function beats(section: string, priority: number): gsap.core.Timeline {
  return gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top+=72',
      end: '+=110%',
      pin: true,
      scrub: 0.4,
      anticipatePin: 1,
      refreshPriority: priority,
      invalidateOnRefresh: true,
    },
  });
}
