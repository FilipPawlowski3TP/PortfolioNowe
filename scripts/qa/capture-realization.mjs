// VISUAL RESET v2, Krok 0: realization screenshots from the live site.
// Desktop 1440x900 first screen + full page cropped to 3200px, mobile 390x844
// first screen + full page cropped to 2800px. WebP (via in-page canvas), saved
// to public/media/, with size measurement. Budgets (§6): thumb <= 80 KB,
// full <= 450 KB.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const URL = 'https://koparkapawlowski.pl/';
const OUT = 'C:/Users/karolina/Desktop/PortfolioClaud/public/media';
mkdirSync(OUT, { recursive: true });

// PNG buffer -> WebP via the browser's canvas encoder; returns buffer + dims.
async function toWebp(page, png, { maxW = Infinity, maxH = Infinity, startQ = 0.82 }) {
  const b64 = png.toString('base64');
  for (let q = startQ; q >= 0.4; q -= 0.08) {
    const out = await page.evaluate(
      async ({ b64, maxW, maxH, q }) => {
        const img = new Image();
        img.src = 'data:image/png;base64,' + b64;
        await img.decode();
        const scale = Math.min(1, maxW / img.width, maxH / img.height);
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        const ctx = c.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, c.width, c.height);
        return c.toDataURL('image/webp', q).split(',')[1];
      },
      { b64, maxW, maxH, q },
    );
    const buf = Buffer.from(out, 'base64');
    if (buf.length <= 460_000 || q <= 0.4) return { buf, q };
  }
  return { buf: Buffer.alloc(0), q: 0 };
}

const run = async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const results = [];

  for (const dev of [
    { tag: 'desktop', viewport: { width: 1440, height: 900 }, dpr: 2, cropH: 3200 },
    { tag: 'mobile', viewport: { width: 390, height: 844 }, dpr: 2, cropH: 2800 },
  ]) {
    const ctx = await browser.newContext({ viewport: dev.viewport, deviceScaleFactor: dev.dpr });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // 1) first screen -> thumb (desktop: 900px wide per §6; mobile: native)
    const first = await page.screenshot();
    const thumbMaxW = dev.tag === 'desktop' ? 900 : Infinity;
    const thumb = await toWebp(page, first, { maxW: thumbMaxW, startQ: 0.82 });
    writeFileSync(`${OUT}/case-${dev.tag}-thumb.webp`, thumb.buf);

    // 2) full page cropped to cropH (CSS px -> image px by dpr)
    const full = await page.screenshot({ fullPage: true });
    const fullWebp = await toWebp(page, full, { maxH: dev.cropH * dev.dpr, startQ: 0.75 });
    writeFileSync(`${OUT}/case-${dev.tag}-full.webp`, fullWebp.buf);

    results.push({
      dev: dev.tag,
      thumb: { bytes: thumb.buf.length, q: thumb.q },
      full: { bytes: fullWebp.buf.length, q: fullWebp.q },
    });
    await ctx.close();
  }

  await browser.close();
  writeFileSync(`C:/Users/karolina/Desktop/PortfolioClaud/docs/qa/realization-shots.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
};

run();
