// VISUAL RESET v2 §6 — "wizytówka → strona": the thumbnail IS the frame
// (a full-viewport window holding the full realization shot), scaled onto the
// card placeholder. One pinned ScrollTrigger: expand to fullscreen (phase 1),
// scroll the realization inside the window (phase 2), then unpin and let the
// window drive away. transform/opacity only; no canvas, no shaders.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initHeroWindow(): void {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const frame = document.querySelector<HTMLElement>('[data-frame]');
  const img = document.querySelector<HTMLImageElement>('[data-frame-img]');
  const card = document.querySelector<HTMLElement>('[data-card]');
  const texts = document.querySelectorAll<HTMLElement>('[data-hero-text]');
  const pill = document.querySelector<HTMLElement>('[data-frame-pill]');
  const bar = document.querySelector<HTMLElement>('[data-frame-progress-bar]');
  if (!hero || !frame || !img || !card) return;

  const mobile = () => matchMedia('(max-width: 768px)').matches;
  // §6: desktop 100vh expand + 300vh scroll; mobile 80vh + 200vh.
  const totalDistance = () => (mobile() ? 280 : 400) * (window.innerHeight / 100);

  const rect = () => {
    const h = hero.getBoundingClientRect();
    const c = card.getBoundingClientRect();
    return { x: c.left - h.left, y: c.top - h.top, s: c.width / window.innerWidth };
  };

  // The frame becomes the visible thumbnail only once the sequence is live;
  // otherwise the card keeps showing its static thumb (no-JS / reduced motion).
  document.documentElement.classList.add('motion-on');

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: () => '+=' + totalDistance(),
      pin: true,
      scrub: true,
      invalidateOnRefresh: true,
    },
  });

  tl.fromTo(
    frame,
    {
      x: () => rect().x,
      y: () => rect().y,
      scale: () => rect().s,
      borderRadius: () => 16 / rect().s,
    },
    { x: 0, y: 0, scale: 1, borderRadius: 0, ease: 'none', duration: 1 },
    0,
  )
    .to(texts, { yPercent: -14, opacity: 0, ease: 'none', duration: 0.6 }, 0)
    .fromTo(pill, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: 'none' }, 1)
    .fromTo(bar, { scaleX: 0 }, { scaleX: 1, transformOrigin: '0 50%', ease: 'none', duration: 3 }, 1)
    .to(
      img,
      {
        y: () => -Math.max(0, img.offsetHeight - window.innerHeight),
        ease: 'none',
        duration: 3,
      },
      1,
    );
}
