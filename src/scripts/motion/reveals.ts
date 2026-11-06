// Reveals + act choreography (MASTERPROMPT sekcja 10).
// Hero entrance is pure CSS (motion.css). Here: scroll-driven "hooked" acts —
// pinned sequences like the Proces one the owner liked (GTA VI / motionsites
// style): each key section locks and its beats play through the scroll.
//
// CRITICAL (bug fix): every trigger is created in DOM order and carries a
// refreshPriority — out-of-order pins overlap their pin-spacers on refresh.
// Accessibility: transforms/colors only — text contrast never breaks mid-scroll.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

export function initReveals(): void {
  const mm = gsap.matchMedia();

  // ---------------------------------------------------------------
  // Reveals that never pin (safe at any width / any order)
  // ---------------------------------------------------------------
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    // Hero entrance is pure CSS (motion.css) so the LCP element paints at
    // first render — JS never gates hero visibility (masterprompt sekcja 9).

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

    gsap.utils.toArray<HTMLElement>('.section__label, .section__intro').forEach((el) => {
      gsap.from(el, {
        autoAlpha: 0,
        y: 16,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });
  });

  // ---------------------------------------------------------------
  // Desktop ride: pinned acts in DOM order (I hero, II oferta,
  // III proces, IV realizacje; V-VI scrubbed; VII kontakt scrubbed)
  // ---------------------------------------------------------------
  mm.add('(prefers-reduced-motion: no-preference) and (min-width: 60rem)', () => {
    // ACT I — Hero: pinned exit sequence (the first "hook")
    const heroTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: '+=100%',
        pin: true,
        scrub: 0.4,
        anticipatePin: 1,
        refreshPriority: 10,
        invalidateOnRefresh: true,
      },
    });
    heroTl
      .to('[data-hero="meta"]', { y: -70, ease: 'none' }, 0)
      .to('[data-hero="dimension"]', { scaleX: 0, transformOrigin: 'right center', ease: 'none' }, 0)
      .to('[data-hero="title"]', { yPercent: -16, ease: 'none' }, 0)
      .to('[data-hero="lead"]', { yPercent: -10, ease: 'none' }, 0)
      .to('[data-hero="ctas"]', { yPercent: -4, ease: 'none' }, 0);

    // ACT II — Oferta: pinned card-by-card reveal (like Proces steps)
    const cards = gsap.utils.toArray<HTMLElement>('.offer-card');
    const offerTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.offer',
        start: 'top top+=72',
        end: '+=130%',
        pin: true,
        scrub: 0.4,
        anticipatePin: 1,
        refreshPriority: 8,
        invalidateOnRefresh: true,
      },
    });
    cards.forEach((card, i) => {
      offerTl.fromTo(card, { y: 28 }, { y: 0, duration: 1, ease: 'none' }, i * 0.8);
      offerTl.fromTo(
        card,
        { borderColor: 'rgba(143, 211, 255, 0.14)' },
        { borderColor: 'rgba(255, 138, 91, 0.55)', duration: 1, ease: 'none' },
        i * 0.8,
      );
    });

    // ACT III — Proces: pinned step sequence (owner's favourite)
    const steps = gsap.utils.toArray<HTMLElement>('.process-step');
    const processTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.process',
        start: 'top top+=72',
        end: '+=130%',
        pin: true,
        scrub: 0.4,
        anticipatePin: 1,
        refreshPriority: 6,
        invalidateOnRefresh: true,
      },
    });
    steps.forEach((step, i) => {
      const num = step.querySelector<HTMLElement>('.process-step__number');
      processTl.fromTo(step, { y: 24 }, { y: 0, duration: 1, ease: 'none' }, i);
      if (num) {
        processTl.fromTo(
          num,
          { color: '#8FD3FF' },
          { color: '#FF8A5B', duration: 1, ease: 'none' },
          i,
        );
      }
    });

    // ACT IV — Realizacje: pinned case-study sequence
    const caseSteps = gsap.utils.toArray<HTMLElement>('.case-study__step');
    const caseTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.case-study',
        start: 'top top+=72',
        end: '+=100%',
        pin: true,
        scrub: 0.4,
        anticipatePin: 1,
        refreshPriority: 4,
        invalidateOnRefresh: true,
      },
    });
    caseTl.fromTo(
      '.case-study__mockups',
      { y: 30 },
      { y: -30, duration: caseSteps.length, ease: 'none' },
      0,
    );
    caseSteps.forEach((step, i) => {
      caseTl.fromTo(step, { color: '#8FD3FF' }, { color: '#FF8A5B', duration: 1, ease: 'none' }, i);
      const body = step.nextElementSibling;
      if (body) caseTl.fromTo(body, { y: 24 }, { y: 0, duration: 1, ease: 'none' }, i);
    });

    // ACT V-VI — Standard + FAQ: staggered rises tied to scroll
    gsap.from('.standard-item', {
      y: 50,
      stagger: 0.1,
      ease: 'none',
      scrollTrigger: {
        trigger: '.standard__grid',
        start: 'top 88%',
        end: 'top 40%',
        scrub: 0.6,
        refreshPriority: 3,
      },
    });
    gsap.from('.faq-item', {
      y: 30,
      stagger: 0.08,
      ease: 'none',
      scrollTrigger: {
        trigger: '.faq__list',
        start: 'top 88%',
        end: 'top 45%',
        scrub: 0.6,
        refreshPriority: 2,
      },
    });

    // ACT VII — Kontakt: the dawn finale (scrubbed, no pin — the form is the
    // conversion moment and must never be locked away)
    gsap.from('.contact__grid', {
      y: 60,
      ease: 'none',
      scrollTrigger: {
        trigger: '.contact',
        start: 'top 88%',
        end: 'top 45%',
        scrub: 0.6,
        refreshPriority: 1,
      },
    });
  });

  // ---------------------------------------------------------------
  // Mobile/tablet: lighter scrub choreography, zero pins
  // ---------------------------------------------------------------
  mm.add('(prefers-reduced-motion: no-preference) and (max-width: 59.99rem)', () => {
    gsap.to('.hero__content', {
      yPercent: -8,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.5 },
    });
    gsap.from('.offer-card', {
      y: 40,
      stagger: 0.1,
      ease: 'none',
      scrollTrigger: { trigger: '.offer__grid', start: 'top 92%', end: 'top 45%', scrub: 0.6 },
    });
    gsap.from('.standard-item', {
      y: 36,
      stagger: 0.08,
      ease: 'none',
      scrollTrigger: { trigger: '.standard__grid', start: 'top 92%', end: 'top 50%', scrub: 0.6 },
    });
    gsap.from('.contact__grid', {
      y: 36,
      ease: 'none',
      scrollTrigger: { trigger: '.contact', start: 'top 92%', end: 'top 50%', scrub: 0.6 },
    });
  });
}
