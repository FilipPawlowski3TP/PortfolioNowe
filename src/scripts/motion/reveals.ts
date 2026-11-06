// Reveals + act choreography (MASTERPROMPT sekcja 10).
// Hero entrance is pure CSS (motion.css). Here: the scroll RIDE — pinned acts
// with beats (Proces-style, owner's favourite) AND full-travel transitions so
// every pixel of scroll animates something (owner feedback: "przerwy między
// pinami niszczą efekt"). Incoming stages rise over outgoing ones (z-stacked
// in layout.css) — fluid hand-offs, no dead gaps.
//
// CRITICAL: triggers created in DOM order with refreshPriority — out-of-order
// pins overlap their pin-spacers on refresh (bug fixed here).
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
      // Lighter on mobile: labels/intros appear without JS work (TBT budget)
      if (matchMedia('(max-width: 59.99rem)').matches) return;
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
  // Desktop ride — DOM order, one continuous chain of motion
  // ---------------------------------------------------------------
  mm.add('(prefers-reduced-motion: no-preference) and (min-width: 60rem)', () => {
    // ACT I — Hero pin: drift beats, then a full exit so the hand-off is clean
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
      .to('[data-hero="meta"]', { y: -70, duration: 0.55, ease: 'none' }, 0)
      .to('[data-hero="dimension"]', { scaleX: 0, transformOrigin: 'right center', duration: 0.55, ease: 'none' }, 0)
      .to('[data-hero="title"]', { yPercent: -16, duration: 0.55, ease: 'none' }, 0)
      .to('[data-hero="lead"]', { yPercent: -10, duration: 0.55, ease: 'none' }, 0)
      .to('[data-hero="ctas"]', { yPercent: -4, duration: 0.55, ease: 'none' }, 0)
      // exit beats: the content leaves the frame as Oferta rises over it
      .to('.hero__content', { y: '-85vh', duration: 0.45, ease: 'none' }, 0.55)
      .to('[data-hero="meta"]', { y: -220, duration: 0.45, ease: 'none' }, 0.55);

    // ACT II — Oferta: rises over the hero across the full travel, settles
    // after the section locks, then card-by-card beats (Proces-style)
    gsap.from('.offer > .container', {
      y: 170,
      ease: 'none',
      scrollTrigger: {
        trigger: '.offer',
        start: 'top bottom',
        end: 'top 15%',
        scrub: 0.5,
        refreshPriority: 9,
      },
    });
    const cards = gsap.utils.toArray<HTMLElement>('.offer-card');
    const offerTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.offer',
        start: 'top top+=72',
        end: '+=110%',
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

    // ACT III — Proces: same ride pattern (owner's favourite)
    gsap.from('.process > .container', {
      y: 170,
      ease: 'none',
      scrollTrigger: {
        trigger: '.process',
        start: 'top bottom',
        end: 'top 15%',
        scrub: 0.5,
        refreshPriority: 7,
      },
    });
    const steps = gsap.utils.toArray<HTMLElement>('.process-step');
    const processTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.process',
        start: 'top top+=72',
        end: '+=110%',
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

    // ACT IV — Realizacje: same ride pattern
    gsap.from('.case-study > .container', {
      y: 170,
      ease: 'none',
      scrollTrigger: {
        trigger: '.case-study',
        start: 'top bottom',
        end: 'top 15%',
        scrub: 0.5,
        refreshPriority: 5,
      },
    });
    const caseSteps = gsap.utils.toArray<HTMLElement>('.case-study__step');
    const caseTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.case-study',
        start: 'top top+=72',
        end: '+=110%',
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

    // ACT V-VII — Standard, FAQ, Kontakt: full-travel rises (never dead pixels)
    gsap.from('.standard > .container', {
      y: 150,
      ease: 'none',
      scrollTrigger: {
        trigger: '.standard',
        start: 'top bottom',
        end: 'top 25%',
        scrub: 0.5,
        refreshPriority: 3,
      },
    });
    gsap.from('.faq > .container', {
      y: 150,
      ease: 'none',
      scrollTrigger: {
        trigger: '.faq',
        start: 'top bottom',
        end: 'top 25%',
        scrub: 0.5,
        refreshPriority: 2,
      },
    });
    gsap.from('.contact > .container', {
      y: 150,
      ease: 'none',
      scrollTrigger: {
        trigger: '.contact',
        start: 'top bottom',
        end: 'top 25%',
        scrub: 0.5,
        refreshPriority: 1,
      },
    });
  });

  // ---------------------------------------------------------------
  // Mobile/tablet: same continuous motion, zero pins, minimal triggers
  // (main-thread budget: TBT <= 200 ms lab, masterprompt sekcja 15)
  // ---------------------------------------------------------------
  mm.add('(prefers-reduced-motion: no-preference) and (max-width: 59.99rem)', () => {
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
  });
}
