# PROGRESS — Portfolio studia webowego

Źródło prawdy: `MASTERPROMPT_portfolio_Cl.md` v1.0. Po przerwie zacznij od tego pliku.

## Faza 0 — Rozpoznanie i brief — W TOKU (bramka G0)

**Zrobione (2026-11-06):**
- Zweryfikowane wersje na żywo: Node 26.13.0, astro 7.4.7, @astrojs/sitemap 3.7.4, gsap 3.15.1, lenis 1.3.27, three 0.187.0, playwright 1.65.0, lighthouse 13.6.0.
- Przeczytana aktualna dokumentacja: README Lenis (1.3.27 — integracja GSAP zgodna z zał. A; nowość: domyślne respektowanie `prefers-reduced-motion`), SplitText (w pakiecie `gsap`, `SplitText.create`, `autoSplit`, `aria`), @astrojs/sitemap.
- Audyt koparkapawlowski.pl (Playwright + Edge headless + Lighthouse 13.6): dane w `docs/audit/`, zrzuty w `public/media/`, skrypt w `scripts/qa/case-study-audit.mjs`.
- Wyniki Lighthouse case study: mobile 100/100/92/100, desktop 100/100/92/100 (BP: CSP blokuje beacon Cloudflare Insights).
- `docs/BRIEF.md`, `docs/TODO_USER.md` zapisane.

**Dowody (komendy):**
- `npm view astro version` → 7.4.7 (gsap 3.15.1, lenis 1.3.27, three 0.187.0)
- `node scripts/qa/case-study-audit.mjs` (katalog roboczy z playwright-core) → `docs/audit/case-study-audit.json`
- `npx lighthouse@13.6.0 https://koparkapawlowski.pl/ --output=json --preset=desktop/mobile` → `docs/audit/lh-{desktop,mobile}.json`

**Uwagi techniczne środowiska:**
- Brak Chrome w systemie — audyty na Edge (`CHROME_PATH='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'`, Playwright `channel: 'msedge'`).
- `terminal` ($TMPDIR) i workspace wskazują inne katalogi scratch — skrypty Node umieszczaj obok `node_modules` (patrz `C:/Users/karolina/AppData/Local/Temp/audit`).
- Wyjście narzędzi maskuje numery telefonów w formacie międzynarodowym (PII) — nie jest to usterka stron; zapisuj telefony w formacie „792 611 777”.

**Dalej:**
- [BRAMKA G0] — ZAMKNIĘTA 2026-11-06: właściciel odpowiedział (Filip Pawłowski, e-mail, bez telefonu i danych firmowych, cała Polska + Wrocław, case study tak). Ustalenia: `docs/BRIEF.md` sekcja 3.
- Faza 1 w toku: `docs/DESIGN_PLAN.md` (tokeny + kontrasty WCAG policzone, typografia Bricolage Grotesque + Instrument Sans, 3 warianty hero → rekomendacja C „tytułówka rysunku”, wireframe'y desktop/mobile, storyboard sceny, motion spec, autokrytyka 8.5), copy deck w `src/data/site.ts` (title 43/60, desc 146/155, H1 8 słów — policzone).
- Test renderu polskich znaków: ZALICZONY (2026-11-06, weryfikacja wizualna zrzutu `docs/audit/font-test.png` — brak tofu/podmian glifów w Bricolage i Instrument Sans).
- [BRAMKA G1] — ZAMKNIĘTA 2026-11-06: marka = **Pawłowski Studio**, hero wariant C, 4 przewagi potwierdzone, 4. usługa „Opieka po wdrożeniu” dodana, treści zaakceptowane.

## Faza 2 — Szkielet projektu — GOTOWE (2026-11-06)

**Zrobione:** skafold Astro 7.4.7 (minimal, TS strict), `astro.config.mjs` (static, `trailingSlash: always`, `compressHTML`, sitemap z `filter`), tokeny CSS (`src/styles/tokens.css`) + `base.css`, `Base.astro` + `SeoHead.astro` (title/desc/canonical/OG/lang=pl), fonty self-hosted przez **wbudowaną obsługę fontów Astro 7** (`fontProviders.local()` + `<Font />`), subsety `src/assets/fonts/*.woff2` (39+30,7 KB), `scripts/check-placeholders.mjs`, `.prettierrc`, `docs/DEPENDENCIES.md`, `git init` + 2 commity.
**Dowody:** `astro build` → 1 strona + sitemap + kopiowanie 2 fontów, OK; `astro check` → 0 błędów, 0 ostrzeżeń (1 hint); `node scripts/check-placeholders.mjs` → FAILED na `todo_domena` (negatywny test bramy — działa zgodnie z MASTERPROMPT sekcja 3).
**Decyzje:** fonty subsetowane lokalnie (fonttools: instancer pin osi + subset latin+latin-ext) zamiast fontsource w buildzie — pełna kontrola budżetu; TS celowo 5.x (7.x niepewny z @astrojs/check).
**Blokada:** `npm run build` zatrzymuje się na check-placeholders do czasu podania `{{DOMENA}}` (pytanie do właściciela). `astro build` działa.
**Dalej:** Faza 3 — warstwa statyczna (wszystkie sekcje HTML/CSS, bez ruchu).

## Faza 1–9 — nie rozpoczęte

Wymagania i kryteria: MASTERPROMPT sekcja 18.
