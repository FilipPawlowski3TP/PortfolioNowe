// VISUAL RESET v2 §9 — mandatory layout test (kept by VISUAL PATCH v3 §8).
// Playwright, widths 360/390/768/1280/1440/1920/2560 x scroll 0/25/50/75/100%:
//   1. no horizontal scroll (scrollWidth <= innerWidth),
//   2. no text overlaps (pairwise intersection <= 2px^2, non-ancestor pairs;
//      visible viewport region only),
//   3. no text outside 0..innerWidth.
// Plus patch v3 §2/§5 specials: every slot word fits its container, the footer
// wordmark fits the window width (§2.2), the skip link is invisible without
// keyboard focus (§2.1).
// Rects are clipped by overflow:hidden ancestors; aria-hidden elements
// (honeypot) are excluded. Result reported as numbers.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = 'http://127.0.0.1:4321/';
const WIDTHS = [360, 390, 768, 1280, 1440, 1920, 2560];
const SCROLLS = [0, 0.25, 0.5, 0.75, 1];

const CHECK = () => {
  const SEL = 'h1, h2, h3, p, a, button, label, summary, figcaption';
  const visible = (el) => {
    // Effective visibility: a child of a fully transparent parent is not
    // visible even though its own computed opacity is 1.
    let n = el;
    while (n && n !== document.documentElement) {
      const s = getComputedStyle(n);
      if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) return false;
      n = n.parentElement;
    }
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const hiddenFromA11y = (el) => !!el.closest('[aria-hidden="true"]');

  // Rect clipped by every overflow:hidden ancestor chain member.
  const clipped = (el) => {
    const r = el.getBoundingClientRect();
    let box = { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    let p = el.parentElement;
    while (p) {
      const s = getComputedStyle(p);
      if (s.overflowX !== 'visible' || s.overflowY !== 'visible') {
        const pr = p.getBoundingClientRect();
        box = {
          left: Math.max(box.left, pr.left),
          right: Math.min(box.right, pr.right),
          top: Math.max(box.top, pr.top),
          bottom: Math.min(box.bottom, pr.bottom),
        };
      }
      p = p.parentElement;
    }
    return box;
  };

  const els = [...document.querySelectorAll(SEL)].filter((el) => visible(el) && !hiddenFromA11y(el));
  const thumbs = [...document.querySelectorAll('[data-card], [data-card] img, [data-frame] img')].filter(
    (el) => visible(el) && !hiddenFromA11y(el),
  );

  let pairs = 0;
  const overlaps = [];
  const outside = [];

  const inter = (a, b) => {
    const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    return x * y;
  };

  // Overlaps only count where the user can see them: clip boxes to the
  // viewport (the hidden header parked above it must not "collide" with
  // content passing by off-screen).
  const vp = (box) => ({
    left: Math.max(box.left, 0),
    right: Math.min(box.right, innerWidth),
    top: Math.max(box.top, 0),
    bottom: Math.min(box.bottom, innerHeight),
  });

  for (let i = 0; i < els.length; i++) {
    const a = els[i];
    const ra = clipped(a);
    // 3) nothing outside the viewport
    if (ra.left < -1 || ra.right > innerWidth + 1) {
      outside.push(`${a.tagName}.${a.className || '-'}@${ra.left.toFixed(0)}..${ra.right.toFixed(0)}`);
    }
    for (let j = i + 1; j < els.length; j++) {
      const b = els[j];
      if (a.contains(b) || b.contains(a)) continue; // ancestor pairs excluded
      pairs++;
      const area = inter(vp(ra), vp(clipped(b)));
      if (area > 2) overlaps.push(`${a.tagName}.${a.className || '-'}/${b.tagName}.${b.className || '-'}:${area.toFixed(0)}`);
    }
    // text over the realization thumbnail/window (the caption pill is the
    // sanctioned exception — §9 "poza pigułką z podpisem")
    for (const t of thumbs) {
      if (a.contains(t) || t.contains(a)) continue;
      if (a.tagName === 'FIGCAPTION') continue;
      if (a.closest('[data-frame-pill]')) continue;
      pairs++;
      const area = inter(vp(ra), vp(clipped(t)));
      if (area > 2) overlaps.push(`${a.tagName}.${a.className || '-'}/IMG:${area.toFixed(0)}`);
    }
  }

  // §5: every word must fit its container (scrollWidth <= clientWidth).
  const wordsBad = [...document.querySelectorAll('[data-slot-word]')]
    .filter((w) => w.scrollWidth > w.clientWidth + 1)
    .map((w) => w.textContent.trim());
  // §2.2: the footer wordmark must fit the window width (bottom crop only).
  const giant = document.querySelector('.site-footer__giant span');
  let wordmarkOver = 0;
  if (giant) {
    const range = document.createRange();
    range.selectNodeContents(giant);
    wordmarkOver = Math.max(0, Math.round(range.getBoundingClientRect().width - innerWidth));
  }
  // §2.1: the skip link must be invisible without keyboard focus.
  const skip = document.querySelector('.skip-link');
  const sr = skip ? skip.getBoundingClientRect() : null;
  const skipVisible = !!sr && (sr.width > 4 || sr.height > 4) && !skip.matches(':focus-visible');

  return {
    hScroll: Math.max(0, document.documentElement.scrollWidth - innerWidth),
    pairs,
    overlaps,
    outside,
    els: els.length,
    wordsBad,
    wordmarkOver,
    skipVisible,
  };
};

const run = async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const report = { widths: {}, totals: { pairs: 0, overlaps: 0, outside: 0, hScroll: 0 } };

  for (const w of WIDTHS) {
    const h = w >= 2560 ? 1440 : w <= 400 ? 844 : w <= 800 ? 1024 : 900;
    const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    const results = [];
    for (const f of SCROLLS) {
      await page.evaluate((v) => window.scrollTo(0, v * (document.documentElement.scrollHeight - window.innerHeight)), f);
      await page.waitForTimeout(450);
      results.push(await page.evaluate(CHECK));
    }

    const sum = {
      hScroll: Math.max(...results.map((r) => r.hScroll)),
      pairs: results.reduce((s, r) => s + r.pairs, 0),
      overlaps: results.flatMap((r) => r.overlaps),
      outside: results.flatMap((r) => r.outside),
      wordsBad: results.flatMap((r) => r.wordsBad ?? []),
      wordmarkOver: Math.max(...results.map((r) => r.wordmarkOver ?? 0)),
      skipVisible: results.some((r) => r.skipVisible),
    };
    report.widths[w] = {
      hScroll: sum.hScroll,
      pairs: sum.pairs,
      overlaps: sum.overlaps.length,
      outside: sum.outside.length,
      wordsBad: [...new Set(sum.wordsBad)],
      wordmarkOver: sum.wordmarkOver,
      skipVisible: sum.skipVisible,
      detail: [...new Set([...sum.overlaps, ...sum.outside])].slice(0, 12),
    };
    report.totals.pairs += sum.pairs;
    report.totals.overlaps += sum.overlaps.length;
    report.totals.outside += sum.outside.length;
    report.totals.hScroll = Math.max(report.totals.hScroll, sum.hScroll);
    report.totals.wordsBad = (report.totals.wordsBad ?? 0) + new Set(sum.wordsBad).size;
    report.totals.wordmarkOver = Math.max(report.totals.wordmarkOver ?? 0, sum.wordmarkOver);
    report.totals.skipVisible = report.totals.skipVisible || sum.skipVisible;
    await page.context().close();
  }

  await browser.close();
  writeFileSync('C:/Users/karolina/Desktop/PortfolioClaud/docs/qa/visual-reset/layout-report.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  const pass =
    report.totals.overlaps === 0 &&
    report.totals.outside === 0 &&
    report.totals.hScroll === 0 &&
    (report.totals.wordsBad ?? 0) === 0 &&
    (report.totals.wordmarkOver ?? 0) === 0 &&
    !report.totals.skipVisible;
  console.log(`LAYOUT TEST: ${pass ? 'PASS' : 'FAIL'} — pairs checked: ${report.totals.pairs}`);
  process.exit(pass ? 0 : 1);
};

run();
