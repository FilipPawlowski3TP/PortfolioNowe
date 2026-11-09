// VISUAL RESET v2 — Krok 3 gate evidence: interaction-state mosaic
// (hero after intro, guiding revealed, offer hover with drawn line, FAQ open,
// copy-email status, hidden header) + behavioral assertions (live clock,
// clipboard status, accordion, header hide) + reduced-motion/no-JS sanity.
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const BASE = 'http://127.0.0.1:4321/';
const OUT = 'C:/Users/karolina/Desktop/PortfolioClaud/docs/qa/visual-reset';
mkdirSync(OUT, { recursive: true });

const run = async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const report = {};
  const shots = [];

  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1600); // let the intro finish (<= 1.2 s)

  const snap = async (name) => {
    const path = `${OUT}/k3-${name}.png`;
    await page.screenshot({ path });
    shots.push({ name, path });
  };

  await snap('01-hero-intro-done');

  // live clock (§5.4)
  report.clock = await page.evaluate(() => ({
    time: document.querySelector('[data-clock-time]').textContent,
    day: document.querySelector('[data-clock-day]').textContent,
    sample: document.querySelector('[data-clock]').textContent.trim().replace(/\s+/g, ' '),
  }));

  // guiding sentence revealed
  await page.evaluate(() => document.querySelector('.guiding__text').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(1100);
  await snap('02-guiding-revealed');

  // offer row hover: shift + arrow + drawn line
  await page.evaluate(() => document.querySelector('.offer').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(900);
  const row = page.locator('.offer-row').nth(1);
  await row.hover();
  await page.waitForTimeout(600);
  report.offerHover = await page.evaluate(() => {
    const r = document.querySelectorAll('.offer-row')[1];
    const name = r.querySelector('.offer-row__name');
    const arrow = r.querySelector('.offer-row__arrow');
    const line = r.querySelector('.offer-row__line line');
    return {
      nameTransform: getComputedStyle(name).transform,
      arrowOpacity: getComputedStyle(arrow).opacity,
      lineDashoffset: getComputedStyle(line).strokeDashoffset,
    };
  });
  await snap('03-offer-hover');

  // FAQ open: smooth expand + rotated plus
  await page.evaluate(() => document.querySelector('.faq').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(900);
  await page.locator('.faq-item summary').first().click();
  await page.waitForTimeout(600);
  report.faq = await page.evaluate(() => {
    const d = document.querySelector('.faq-item');
    return {
      open: d.open,
      answerVisible: d.querySelector('.faq-item__answer').getBoundingClientRect().height > 10,
      plusTransform: getComputedStyle(d.querySelector('summary'), '::after').transform,
    };
  });
  await snap('04-faq-open');

  // copy email: "Skopiowano" in place (§5.6)
  await page.evaluate(() => document.querySelector('.contact').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(900);
  await page.locator('[data-copy-email]').click();
  await page.waitForTimeout(300);
  report.copy = await page.evaluate(() => ({
    status: document.querySelector('[data-copy-status]').textContent,
  }));
  await snap('05-copy-status');

  // header hides on scroll down (§5)
  await page.evaluate(() => window.scrollTo(0, window.scrollY + 700));
  await page.waitForTimeout(500);
  report.headerHide = await page.evaluate(() =>
    document.querySelector('.site-header').classList.contains('is-hidden'),
  );
  await snap('06-header-hidden');

  report.pageErrors = errors.length ? errors : 'none';

  // mosaic
  const mosaicPage = await (await browser.newContext({ viewport: { width: 1500, height: 1000 } })).newPage();
  const cells = shots
    .map((s) => {
      const b64 = readFileSync(s.path).toString('base64');
      return `<figure><figcaption>${s.name}</figcaption><img src="data:image/png;base64,${b64}" /></figure>`;
    })
    .join('');
  await mosaicPage.setContent(`<style>
    body { margin: 0; background: #222; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 8px; padding: 8px; font: 14px sans-serif; color: #fff; }
    figure { margin: 0; } figcaption { padding: 4px; } img { width: 100%; display: block; border: 1px solid #444; }
  </style>${cells}`);
  await mosaicPage.waitForTimeout(600);
  await mosaicPage.screenshot({ path: `${OUT}/mosaic-k3.png`, fullPage: true });
  await mosaicPage.context().close();

  // reduced-motion + no-JS sanity (content + fallbacks intact)
  for (const mode of ['reduce', 'nojs']) {
    const c = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: mode === 'reduce' ? 'reduce' : 'no-preference',
      javaScriptEnabled: mode !== 'nojs',
    });
    const p = await c.newPage();
    await p.goto(BASE, { waitUntil: 'load' });
    await p.waitForTimeout(700);
    report[`fallback-${mode}`] = await p.evaluate(() => {
      const h1 = document.querySelector('h1');
      return {
        h1Visible: h1.getBoundingClientRect().height > 0,
        wrapHidden: getComputedStyle(document.querySelector('[data-frame-wrap]')).display === 'none',
        thumbVisible: getComputedStyle(document.querySelector('.hero__shot-frame img')).visibility !== 'hidden',
      };
    });
    await c.close();
  }

  await browser.close();
  writeFileSync(`${OUT}/gate3-report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
};

run();
