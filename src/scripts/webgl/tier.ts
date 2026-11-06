// Tier detection (MASTERPROMPT załącznik B) + QA-only forced tier.
export type Tier = 0 | 1 | 2;

export function detectTier(): Tier {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = !!(navigator as { connection?: { saveData?: boolean } }).connection?.saveData;
  if (reduce || saveData) return 0;

  const probe = document.createElement('canvas');
  const gl2 = probe.getContext('webgl2');
  if (!gl2) return 0;

  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as { deviceMemory?: number }).deviceMemory ?? 4; // absent in Safari/Firefox
  const coarse = matchMedia('(pointer: coarse)').matches;

  if (cores <= 2 || memory <= 2) return 1;
  if (coarse && (cores <= 4 || memory <= 4)) return 1;
  return 2;
}

// ?tier=0|1|2 only exists in dev builds or PUBLIC_QA=1 builds (masterprompt 11.3:
// debug affordances never ship to production).
export function resolveTier(): Tier {
  const qaAllowed = import.meta.env.DEV || import.meta.env.PUBLIC_QA === '1';
  if (qaAllowed) {
    const forced = new URLSearchParams(location.search).get('tier');
    if (forced === '0' || forced === '1' || forced === '2') {
      return Number(forced) as Tier;
    }
  }
  return detectTier();
}
