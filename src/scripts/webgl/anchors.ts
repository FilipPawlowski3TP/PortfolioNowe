// DOM anchoring (PATCH v1.1 §3): empty placeholders declare where the object
// stands; positions are read from live rects every frame, so pins/resize/scroll
// are always reflected — the object never "hangs" in canvas space.
import * as THREE from 'three';

export interface AnchorRec {
  key: string;
  el: HTMLElement;
  width: number;
  height: number;
  centerX: number; // viewport px (live)
  centerY: number; // viewport px (live)
}

// [data-anchor] wins; section fallbacks keep the scene working if a
// placeholder is missing.
const FALLBACKS: Record<string, string> = {
  hero: '[data-anchor="hero"], .hero',
  offer: '[data-anchor="offer"], #oferta',
  process: '[data-anchor="process"], #proces',
  case: '[data-anchor="case"], #realizacje',
  contact: '[data-anchor="contact"], #kontakt',
};

export function collectAnchors(): Map<string, AnchorRec> {
  const out = new Map<string, AnchorRec>();
  for (const [key, sel] of Object.entries(FALLBACKS)) {
    // The [data-anchor] placeholder wins; the section is only a fallback.
    // (querySelector on a combined list matched the SECTION first — bug.)
    const el =
      (document.querySelector(`[data-anchor="${key}"]`) as HTMLElement | null) ??
      (document.querySelector(sel) as HTMLElement | null);
    if (!el) continue;
    out.set(key, { key, el, width: 0, height: 0, centerX: 0, centerY: 0 });
  }
  return out;
}

export function refreshAnchorRects(anchors: Map<string, AnchorRec>): void {
  for (const rec of anchors.values()) {
    const r = rec.el.getBoundingClientRect();
    rec.width = r.width;
    rec.height = r.height;
    rec.centerX = r.left + r.width / 2;
    rec.centerY = r.top + r.height / 2;
  }
}

// Viewport px -> world coordinates on the z=0 plane (camera looks at origin).
export function screenToWorld(
  camera: THREE.PerspectiveCamera,
  x: number,
  y: number,
  out = new THREE.Vector3(),
): THREE.Vector3 {
  const dist = camera.position.z;
  const h = 2 * Math.tan(((camera.fov * Math.PI) / 180) / 2) * dist;
  const w = h * camera.aspect;
  return out.set(
    (x / window.innerWidth - 0.5) * w,
    -(y / window.innerHeight - 0.5) * h,
    0,
  );
}
