// VISUAL RESET v2 — Krok 5 gate evidence: the huge cropped footer wordmark
// at 360/768/1440/1920 (mosaic) + it must not cause horizontal scroll and its
// visible part must stay within the viewport (clipped by design).
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const BASE = 'http://127.0.0.1:4321/';
const OUT = 'C:/Users/karolina/Desktop/PortfolioClaud/docs/qa/visual-reset';
mkdirSync(OUT, { recursive: true });

const run = async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const report = {};
  const shots = [];

  for (const w of [360, 768, 1440, 1920]) {
    const h = w <= 400 ? 844 : 900;
    const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(600);
    const path = `${OUT}/k5-footer-${w}.png`;
    await page.screenshot({ path });
    shots.push({ name: `${w}px`, path });

    report[`w${w}`] = await page.evaluate(() => {
      const giant = document.querySelector('.site-footer__giant');
      const span = giant ? giant.querySelector('span') : null;
      const gs = giant ? getComputedStyle(giant) : null;
      let textW = 0;
      if (span) {
        const r = document.createRange();
        r.selectNodeContents(span);
        textW = r.getBoundingClientRect().width;
      }
      return {
        present: !!giant,
        wrapperOverflow: gs ? `${gs.overflowX}/${gs.overflowY}` : null,
        textW: textW | 0,
        croppedSides: textW > innerWidth + 4,
        hScroll: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      };
    });
    await page.context().close();
  }

  const mosaicPage = await (await browser.newContext({ viewport: { width: 1500, height: 800 } })).newPage();
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
  await mosaicPage.screenshot({ path: `${OUT}/mosaic-k5.png`, fullPage: true });
  await mosaicPage.context().close();

  await browser.close();
  writeFileSync(`${OUT}/gate5-report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
};

run();
