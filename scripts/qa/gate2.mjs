// VISUAL RESET v2 — Krok 2 gate evidence: pinned-sequence mosaic at
// 0/25/50/75/100% (desktop + mobile), unpin continuity, hero fit and
// H1/thumbnail overlap at 1280/1440/1920/390, reduced-motion + no-JS fallbacks.
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const BASE = 'http://127.0.0.1:4321/';
const OUT = 'C:/Users/karolina/Desktop/PortfolioClaud/docs/qa/visual-reset';
mkdirSync(OUT, { recursive: true });

async function mosaic(browser, shots, tag) {
  const p = await (await browser.newContext({ viewport: { width: 1500, height: 1000 } })).newPage();
  const cells = shots
    .map((s) => {
      const b64 = readFileSync(s.path).toString('base64');
      return `<figure><figcaption>${s.name}</figcaption><img src="data:image/png;base64,${b64}" /></figure>`;
    })
    .join('');
  await p.setContent(`<style>
    body { margin: 0; background: #222; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 8px; font: 14px sans-serif; color: #fff; }
    figure { margin: 0; } figcaption { padding: 4px; } img { width: 100%; display: block; border: 1px solid #444; }
  </style>${cells}`);
  await p.waitForTimeout(600);
  await p.screenshot({ path: `${OUT}/mosaic-seq-${tag}.png`, fullPage: true });
  await p.close();
}

async function seqCapture(page, tag, distanceVh) {
  const shots = [];
  for (const f of [0, 0.25, 0.5, 0.75, 1]) {
    const y = f * (distanceVh * (await page.evaluate(() => innerHeight)) / 100);
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(450);
    const path = `${OUT}/seq-${tag}-${String(f * 100).padStart(3, '0')}.png`;
    await page.screenshot({ path });
    shots.push({ name: `seq ${Math.round(f * 100)}%`, path });
  }
  return shots;
}

const run = async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const report = {};

  // --- 1. hero fit + H1/thumbnail overlap at the four required widths ---
  for (const w of [1280, 1440, 1920, 390]) {
    const h = w <= 400 ? 844 : 900;
    const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);
    report[`fit${w}`] = await page.evaluate(() => {
      const hero = document.querySelector('[data-hero]');
      const h1 = document.querySelector('h1').getBoundingClientRect();
      const card = document.querySelector('[data-card]').getBoundingClientRect();
      const ix = Math.max(0, Math.min(h1.right, card.right) - Math.max(h1.left, card.left));
      const iy = Math.max(0, Math.min(h1.bottom, card.bottom) - Math.max(h1.top, card.top));
      return {
        heroH: Math.round(hero.getBoundingClientRect().height),
        viewportH: innerHeight,
        fits: hero.getBoundingClientRect().height <= innerHeight + 2,
        h1CardOverlapPx2: Math.round(ix * iy),
      };
    });
    await page.context().close();
  }

  // --- 2. pinned sequence mosaic (desktop + mobile) ---
  for (const dev of [
    { tag: 'desktop', viewport: { width: 1440, height: 900 }, distVh: 400 },
    { tag: 'mobile', viewport: { width: 390, height: 844 }, distVh: 280 },
  ]) {
    const page = await (await browser.newContext({ viewport: dev.viewport })).newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    const shots = await seqCapture(page, dev.tag, dev.distVh);
    await mosaic(browser, shots, dev.tag);

    // unpin continuity: hero must not jump at the pin end
    const end = await page.evaluate((vh) => {
      const hero = document.querySelector('[data-hero]');
      return hero.getBoundingClientRect().top + scrollY + (vh * innerHeight) / 100;
    }, dev.distVh);
    const topAt = async (y) => {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(450);
      return page.evaluate(() => document.querySelector('[data-frame]').getBoundingClientRect().top);
    };
    const before = await topAt(end - 30);
    const after = await topAt(end + 30);
    report[`unpin-${dev.tag}`] = {
      frameTopBefore: Math.round(before),
      frameTopAfter: Math.round(after),
      jump: Math.round(Math.abs(after - before) - 30), // natural move = 30px up
      pageErrors: errors.length ? errors : 'none',
    };
    await page.context().close();
  }

  // --- 3. fallbacks: reduced motion + no-JS ---
  for (const mode of ['reduce', 'nojs']) {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: mode === 'reduce' ? 'reduce' : 'no-preference',
      javaScriptEnabled: mode !== 'nojs',
    });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'load' });
    await page.waitForTimeout(800);
    report[`fallback-${mode}`] = await page.evaluate(() => ({
      frameHidden: getComputedStyle(document.querySelector('[data-frame]')).display === 'none',
      thumbVisible: getComputedStyle(document.querySelector('.hero__shot-frame img')).visibility !== 'hidden',
      realizacjaFallback: getComputedStyle(document.querySelector('.realizacja__fallback')).display !== 'none',
    }));
    await ctx.close();
  }

  await browser.close();
  writeFileSync(`${OUT}/gate2-report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
};

run();
