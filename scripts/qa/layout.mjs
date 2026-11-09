// VISUAL RESET v2 §9 — mandatory layout test (Kroki 1–4). Playwright, widths
// 360/390/768/1280/1440/1920 x scroll positions 0/25/50/75/100%:
//   1. no horizontal scroll (scrollWidth <= innerWidth),
//   2. no text overlaps (pairwise intersection <= 2px^2, non-ancestor pairs;
//      text over the realization thumbnail counts too),
//   3. no text outside 0..innerWidth.
// aria-hidden elements (honeypot) are excluded. Result reported as numbers.
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:4321/';
const WIDTHS = [360, 390, 768, 1280, 1440, 1920];
const SCROLLS = [0, 0.25, 0.5, 0.75, 1];

const CHECK = () => {
  const SEL = 'h1, h2, h3, p, a, button, label, summary, figcaption';
  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const hiddenFromA11y = (el) => !!el.closest('[aria-hidden="true"]');
  const els = [...document.querySelectorAll(SEL)].filter((el) => visible(el) && !hiddenFromA11y(el));
  const thumbs = [...document.querySelectorAll('[data-card], [data-card] img')].filter((el) => visible(el) && !hiddenFromA11y(el));

  let pairs = 0;
  const overlaps = [];
  const outside = [];

  const inter = (a, b) => {
    const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    return x * y;
  };

  for (let i = 0; i < els.length; i++) {
    const a = els[i];
    const ra = a.getBoundingClientRect();
    // 3) nothing outside the viewport
    if (ra.left < -1 || ra.right > innerWidth + 1) {
      outside.push(`${a.tagName}.${a.className || '-'}@${ra.left.toFixed(0)}..${ra.right.toFixed(0)}`);
    }
    for (let j = i + 1; j < els.length; j++) {
      const b = els[j];
      if (a.contains(b) || b.contains(a)) continue; // ancestor pairs excluded
      pairs++;
      const area = inter(ra, b.getBoundingClientRect());
      if (area > 2) overlaps.push(`${a.tagName}.${a.className || '-'}/${b.tagName}.${b.className || '-'}:${area.toFixed(0)}`);
    }
    // text over the realization thumbnail (caption pill excepted via figcaption)
    for (const t of thumbs) {
      if (a.contains(t) || t.contains(a)) continue;
      if (a.tagName === 'FIGCAPTION') continue;
      pairs++;
      const area = inter(ra, t.getBoundingClientRect());
      if (area > 2) overlaps.push(`${a.tagName}.${a.className || '-'}/IMG:${area.toFixed(0)}`);
    }
  }

  return {
    hScroll: Math.max(0, document.documentElement.scrollWidth - innerWidth),
    pairs,
    overlaps,
    outside,
    els: els.length,
  };
};

const run = async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const report = { widths: {}, totals: { pairs: 0, overlaps: 0, outside: 0, hScroll: 0 } };

  for (const w of WIDTHS) {
    const h = w <= 400 ? 844 : w <= 800 ? 1024 : 900;
    const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    const results = [];
    for (const f of SCROLLS) {
      await page.evaluate((v) => window.scrollTo(0, v * (document.documentElement.scrollHeight - window.innerHeight)), f);
      await page.waitForTimeout(250);
      results.push(await page.evaluate(CHECK));
    }

    const sum = {
      hScroll: Math.max(...results.map((r) => r.hScroll)),
      pairs: results.reduce((s, r) => s + r.pairs, 0),
      overlaps: results.flatMap((r) => r.overlaps),
      outside: results.flatMap((r) => r.outside),
    };
    report.widths[w] = {
      hScroll: sum.hScroll,
      pairs: sum.pairs,
      overlaps: sum.overlaps.length,
      outside: sum.outside.length,
      detail: [...new Set([...sum.overlaps, ...sum.outside])].slice(0, 12),
    };
    report.totals.pairs += sum.pairs;
    report.totals.overlaps += sum.overlaps.length;
    report.totals.outside += sum.outside.length;
    report.totals.hScroll = Math.max(report.totals.hScroll, sum.hScroll);
    await page.context().close();
  }

  await browser.close();
  console.log(JSON.stringify(report, null, 2));
  const pass = report.totals.overlaps === 0 && report.totals.outside === 0 && report.totals.hScroll === 0;
  console.log(`LAYOUT TEST: ${pass ? 'PASS' : 'FAIL'} — pairs checked: ${report.totals.pairs}`);
  process.exit(pass ? 0 : 1);
};

run();
