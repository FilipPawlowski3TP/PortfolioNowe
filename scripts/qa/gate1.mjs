// VISUAL RESET v2 — gate evidence: mosaics (1440x900 + 390x844, 5 scroll
// positions), axe (serious/critical), focus-visible probe.
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const BASE = 'http://127.0.0.1:4321/';
const OUT = 'C:/Users/karolina/Desktop/PortfolioClaud/docs/qa/visual-reset';
mkdirSync(OUT, { recursive: true });

async function capture(page, tag) {
  const shots = [];
  for (const f of [0, 0.25, 0.5, 0.75, 1]) {
    await page.evaluate((v) => window.scrollTo(0, v * (document.documentElement.scrollHeight - window.innerHeight)), f);
    await page.waitForTimeout(350);
    const path = `${OUT}/${tag}-${String(f * 100).padStart(3, '0')}.png`;
    await page.screenshot({ path });
    shots.push({ name: `${Math.round(f * 100)}%`, path });
  }
  return shots;
}

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
  await p.screenshot({ path: `${OUT}/mosaic-${tag}.png`, fullPage: true });
  await p.close();
}

const run = async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const report = {};

  for (const dev of [
    { tag: 'desktop', viewport: { width: 1440, height: 900 } },
    { tag: 'mobile', viewport: { width: 390, height: 844 } },
  ]) {
    const page = await (await browser.newContext({ viewport: dev.viewport })).newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    const shots = await capture(page, dev.tag);
    await mosaic(browser, shots, dev.tag);

    const axe = await new AxeBuilder({ page }).analyze();
    report[dev.tag] = {
      axeSeriousCritical: axe.violations
        .filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map((v) => v.id + ' x' + v.nodes.length),
      consoleErrors: errors.length ? errors : 'none',
    };

    // focus-visible probe: tab to first interactive element, read the outline
    await page.keyboard.press('Tab');
    const focus = await page.evaluate(() => {
      const el = document.activeElement;
      const s = el ? getComputedStyle(el) : null;
      return s ? { tag: el.tagName, outline: `${s.outlineWidth} ${s.outlineStyle} ${s.outlineColor}` } : null;
    });
    report[dev.tag].focus = focus;
    await page.context().close();
  }

  await browser.close();
  writeFileSync(`${OUT}/gate1-report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
};

run();
