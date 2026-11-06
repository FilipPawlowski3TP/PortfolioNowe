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

## Faza 3 — Warstwa statyczna — GOTOWE (2026-11-06)

**Zrobione:** wszystkie sekcje (Header/Hero/Oferta/Proces/CaseStudy/Standard/FAQ/Kontakt/Footer), strony prawne (projekty do weryfikacji prawnika) + 404, `T.astro` + `typo()`, wordmark, hero wariant C, CSS wg tokenów (`layout.css`, `components.css`, `legal.css`), responsywność mobile-first.
**Dowody (`docs/qa/phase3/`):** 7 viewportów (360–1920): brak poziomego scrolla, 1×h1, 0 błędów konsoli, 0 uszkodzonych obrazów; axe (WCAG 2.x AA): **0 naruszeń serious/critical**; Lighthouse (localhost): **SEO 100, dostępność 100, best-practices 100**; przegląd wizualny zrzutów: układ hierarchiczny, case study kompletny (zrzuty klienta w ramkach), stopka OK, mobile OK.
**Poprawki po przeglądzie:** rozmiar/waga drobnych etykiet (0,72→0,8 rem, 500), placeholder selecta, margines nagłówków sekcji, skrypt QA wymusza leniwe obrazy przed zrzutem.
**Dalej:** Faza 4 — ruch (Lenis + GSAP: wejście hero, reveals, menu mobilne, reduced-motion).

## Faza 4 — Warstwa ruchu — GOTOWE (2026-11-06)

**Zrobione:** `smooth-scroll.ts` (Lenis ↔ ScrollTrigger, jedna pętla gsap.ticker, zał. A), `reveals.ts` (wejście hero ≤1,2 s, masked line reveals SplitText `aria:'auto'`, fades dla intro, pin procesu ≤2 ekrany desktop), `menu.ts` (details + Esc + `inert` + `lenis.stop()`), `boot.ts` (reduced-motion, watchdog 3 s → `reveal-all`, `ScrollTrigger.refresh` po fontach/obrazach), `motion.css` (stany początkowe tylko `.js` + no-preference).
**Dowody (`docs/qa/phase4/`, skrypty phase4-qa):** boot gotowy, hero widoczne po wejściu (opacity 1×4), kotwica „Oferta” → hash + scrollY 956 + fokus na `#offer-h2`, 0 błędów konsoli; reduced-motion: treść widoczna, 0 pinów; JS wyłączony: treść widoczna; menu mobilne: inert na main + Esc zamyka; CLS **0,001** (Lighthouse mobile, perf 99, LCP 1,99 s, TBT 1 ms); axe serious/critical **0** na 7 viewportach i w środku pinu.
**Poprawka:** pin procesu pierwotnie ściemniał tekst kroków (kontrast 2,43:1, axe serious) — efekt zmieniony na ruch + kolor numerów (dostępność > efekty, MASTERPROMPT sekcja 0.2).
**Dalej:** Faza 5 — WebGL (tier.ts, scena blueprint, cząsteczki, mockupy, crossfade z fallbacku).

## Faza 5 — Warstwa WebGL — GOTOWE (2026-11-06), [BRAMKA G2] do akceptacji

**Zrobione:** `webgl/` (tier.ts z wymuszaniem `?tier=` tylko w buildzie QA, acts.ts, scene.ts — jeden fixed canvas + scena sterowana scrollem, particles.ts (instancjonowane, ≤3500), devices.ts (laptop+phone `RoundedBoxGeometry` z teksturami = własne zrzuty case study, SRGB, anisotropy ≤4), adaptive.ts (90 klatek → p95 > 22 ms → DPR → cząsteczki → tier, bez awansów), shadery GLSL ES 3.00 (`?raw`: siatka blueprint z `uGrade` noc→świt, cząsteczki), render na żądanie 60 FPS → ambient 30 FPS, pauza na `document.hidden`, `webglcontextlost/restored` → Tier 0, ResizeObserver z debouncingiem (mobile ignoruje Δh < 120 px). Scena ładowana po `load` + `requestIdleCallback` (dynamiczny import), crossfade 400 ms z CSS fallbacku. Tła sekcji półprzezroczyste (scena widoczna w całej podróży).
**Dowody (`docs/qa/phase5/`):** tiery 0/1/2 (wymuszone) — ALL PASS; budżety: draw calls **7** (≤40), trójkąty **2 922** (≤150k), cząsteczki 3500/1500/600 per tier, DPR 1/1/1 (≤1,75/1,25/1); axe serious/critical **0** przy 5 pozycjach scrolla na żywej scenie; Lighthouse mobile (scena): **perf 100, LCP 1,24 s, CLS 0,006, TBT 62 ms**; desktop: **perf 100, LCP 0,34 s**; Tier 0 mobile: **perf 100**; budżety gzip: sceny three+kod **130,7 KB** (cel ≤200), boot+motion **52,9 KB**, fonty 72 KB.
**Poprawka jakościowa:** LCP element (tekst hero) czekał na JS (3,18 s) — wejście hero przeniesione na czysty CSS transform-only („LCP nie czeka na JS”), LCP 1,24 s.
**Uwaga:** FPS/frame-times w headless Edge = SwiftShader (brak GPU) — pomiary klatek wymagają testu na realnych urządzeniach (właściciel).
**Dalej:** [BRAMKA G2] — zrzuty kluczowych momentów do akceptacji; po niej Faza 6 (formularz + nagłówki + deploy).

## Rewizja G2 (2026-11-06) — „Światło i głębia" wg feedbacku właściciela

Feedback: siatka blueprint zbyt „geekowa" dla Kowalskiego; podobają się mockupy Koparek i pin Procesu; cała strona ma tak płynnie działać. Decyzje właściciela: **A — Światło i głębia**, więcej pinów + scrub wszędzie.
**Zmiany:** siatka usunięta → shader atmosferyczny (noc→świt, ciepła poświata rosnąca ze scrollem, dither anty-banding) + 3 miękkie warstwy głębi (paralaks) + bokeh zamiast technicznego pyłu; choreografia scrub na całej stronie (wyjście hero z paralaksą, fala kart oferty, standard/FAQ/kontakt); **pin Realizacji** (1 ekran, etykiety Problem→Efekt rozgrzewają się do akcentu, mockupy dryfują); scrollspy w nawigacji (aktywna sekcja na dawn-400); fallback CSS = ten sam klimat.
**Dowody:** phase5 ALL PASS (tiery, budżety: 5–7 draw calls, 2,9k trójkątów), axe 0 przy 5 pozycjach, mobile perf **98** (LCP 1,24 s, TBT 142 ms), desktop **100** (LCP 0,20 s), phase4 regresja ALL PASS.
**Dalej:** [BRAMKA G2 — ponowna akceptacja] po pokazaniu nowych zrzutów.

## Rewizja G2 v3 (2026-11-06) — „płynna jazda" + nowy hero (B: Rzeźba świetlna)

Feedback: przerwy między pinami niszczą efekt (martwe odcinki scrolla), oferta wisi za wysoko, hero „źle zrobiony/środek ekranu", kropki out, 3D zostaje; hero B/C — agent wybrał B (z nutką C).
**Zmiany:** (1) przejścia na pełnym dystansie — każda sekcja wjeżdża scrubem od `top bottom` do `top 15%`, sekcje warstwowo nakładane (z-index), piórkowane maski krawędzi (bez twardych linii); hero pin ma pełne wyjście treści (`-85vh`) — zero martwych pikseli scrolla; (2) akty wyśrodkowane w viewport (min-height 100svh, flex) — „za wysoko" naprawione; (3) hero: kompozycja asymetryczna, bez ramki, ciaśniejszy rytm (CTA nad zgięciem), rzeźba świetlna 3D (3 pierścienie + rdzeń, fresnel additive, noc→świt, okno 0,09–0,16); (4) kolizja pinów = trigger order + refreshPriority + anticipatePin (weryfikacja: 72 pozycje scrolla, 0 kolizji).
**Dowody:** phase4/phase5 ALL PASS, axe 0 mid-pin, mobile **perf 97 / TBT 191 ms** (budżet ≤200), LCP 1,24 s, CLS 0,010; doc 12 ekranów desktop (dystans pinów = „jazda" wg życzenia właściciela).
**Dalej:** akceptacja przejazdu → Faza 6 (formularz + bezpieczeństwo).
