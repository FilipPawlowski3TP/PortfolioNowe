// PATCH v1.1 — scene: living night->dawn sky + ONE LayerStack object that
// travels the page through DOM anchors (hero -> oferta -> proces -> realizacje)
// and vanishes cleanly before Standard/FAQ (no ghosts). Sky grade per §2 table.
import * as THREE from 'three';
import { AdaptiveController } from './adaptive';
import { updateAct, type SceneState } from './acts';
import type { Tier } from './tier';
import { collectAnchors, refreshAnchorRects, screenToWorld, type AnchorRec } from './anchors';
import { createLayerStack, type LayerStackHandle } from './layer-stack';
import skyVert from './shaders/sky.vert.glsl?raw';
import skyFrag from './shaders/sky.frag.glsl?raw';

const PANEL_W = 3.2;
const PANEL_H = 2.0;

interface ObjKey {
  p: number;
  anchor: string;
  explode: number;
  fill: number;
  opacity: number;
  heightFrac: number;
  useAnchorWidth: boolean;
}

// Object journey (PATCH v1.1 §2 scroll map). Keys match MEASURED section
// positions (computePoints in scripts/qa/patch11-qa.mjs): hero 2%, oferta 15%,
// proces 30%, realizacje 46%, faq 76%, kontakt 90%. GONE before Standard/FAQ —
// no ghosts (acceptance §5: "zero duchów obiektu").
const KEYS: ObjKey[] = [
  { p: 0.0, anchor: 'hero', explode: 0.5, fill: 2.2, opacity: 1, heightFrac: 0.55, useAnchorWidth: false },
  { p: 0.07, anchor: 'hero', explode: 0.5, fill: 2.2, opacity: 1, heightFrac: 0.55, useAnchorWidth: false },
  { p: 0.14, anchor: 'offer', explode: 0.42, fill: 3.0, opacity: 1, heightFrac: 0.36, useAnchorWidth: false },
  { p: 0.2, anchor: 'offer', explode: 0.42, fill: 3.0, opacity: 1, heightFrac: 0.36, useAnchorWidth: false },
  { p: 0.27, anchor: 'process', explode: 0.3, fill: 1.0, opacity: 1, heightFrac: 0.42, useAnchorWidth: false },
  { p: 0.35, anchor: 'process', explode: 0.12, fill: 5.0, opacity: 1, heightFrac: 0.42, useAnchorWidth: false },
  { p: 0.42, anchor: 'case', explode: 0.02, fill: 5.0, opacity: 1, heightFrac: 0.42, useAnchorWidth: true },
  { p: 0.52, anchor: 'case', explode: 0.02, fill: 5.0, opacity: 1, heightFrac: 0.42, useAnchorWidth: true },
  { p: 0.62, anchor: 'case', explode: 0.3, fill: 5.0, opacity: 0, heightFrac: 0.42, useAnchorWidth: true },
  { p: 1.0, anchor: 'contact', explode: 0.45, fill: 5.0, opacity: 0, heightFrac: 0.42, useAnchorWidth: false },
];

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / Math.max(1e-5, b - a)));
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function initScene(tier: Tier, state: SceneState, mount: HTMLElement): void {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
  } catch {
    mount.classList.add('scene-tier-0');
    return;
  }

  const coarsePointer = !window.matchMedia('(pointer: fine)').matches;
  const initialDpr = tier === 2 ? (coarsePointer ? 1.25 : 1.75) : 1;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, initialDpr));
  renderer.setSize(mount.clientWidth || window.innerWidth, mount.clientHeight || window.innerHeight);
  mount.appendChild(renderer.domElement);
  mount.classList.add('scene-live');
  document.documentElement.classList.add('webgl-on');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, (mount.clientWidth || 1) / (mount.clientHeight || 1), 0.1, 60);
  camera.position.set(0, 0, 9);

  // --- Sky (fullscreen quad) ---
  const skyUniforms = {
    uTime: { value: 0 },
    uGrade: { value: 0 },
    uScroll: { value: 0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uRes: { value: new THREE.Vector2(1, 1) },
    uOctaves: { value: tier === 2 ? 3 : 2 },
    uWarp: { value: tier === 2 ? 1 : 0 },
  };
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms: skyUniforms,
      vertexShader: skyVert,
      fragmentShader: skyFrag,
      depthTest: false,
      depthWrite: false,
    }),
  );
  sky.frustumCulled = false;
  sky.renderOrder = -10;
  scene.add(sky);

  // --- LayerStack object (screenshot panel fills in when the texture loads) ---
  const shotTex = new THREE.TextureLoader().load('/media/case-desktop-hero.png');
  shotTex.colorSpace = THREE.SRGBColorSpace;
  const stack: LayerStackHandle = createLayerStack(shotTex);
  scene.add(stack.group);

  // --- Anchors (live DOM rects) ---
  const anchors = collectAnchors();
  refreshAnchorRects(anchors);

  // --- Adaptive quality (DPR only; never destroys the scene) ---
  const adaptive = new AdaptiveController(tier, coarsePointer, {
    setDpr(dpr: number) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dpr));
    },
  });

  // --- Input state ---
  const pointer = { x: 0, y: 0 };
  const finePointer = !coarsePointer;
  if (finePointer) {
    window.addEventListener(
      'pointermove',
      (e) => {
        pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
      },
      { passive: true },
    );
  }

  const doc = document.documentElement;
  let forcedProgress: number | null = null;
  let smoothProgress = 0;
  let lastActivity = 0;

  const readScroll = () => {
    const max = Math.max(1, doc.scrollHeight - window.innerHeight);
    state.progress = Math.min(1, Math.max(0, window.scrollY / max));
  };
  readScroll();
  window.addEventListener('scroll', () => { readScroll(); lastActivity = performance.now(); }, { passive: true });

  const resize = () => {
    const w = mount.clientWidth || window.innerWidth;
    const h = mount.clientHeight || window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
    skyUniforms.uRes.value.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
    refreshAnchorRects(anchors);
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(mount);
  window.addEventListener('resize', resize);

  // --- Object journey interpolation ---
  const tmpV = new THREE.Vector3();
  function applyJourney(p: number, time: number): void {
    let i = 0;
    while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
    const a = KEYS[i];
    const b = KEYS[i + 1];
    const t = smoothstep(a.p, b.p, p);

    const explode = lerp(a.explode, b.explode, t);
    const fill = lerp(a.fill, b.fill, t);
    const opacity = lerp(a.opacity, b.opacity, t);
    const heightFrac = lerp(a.heightFrac, b.heightFrac, t);

    // Placement: interpolate live anchor rects (pins/resize included).
    const ra = anchors.get(a.anchor);
    const rb = anchors.get(b.anchor);
    const rec = ra ?? rb;
    if (!rec) return;
    const cx = lerp(ra ? ra.centerX : rec.centerX, rb ? rb.centerX : rec.centerX, t);
    const cy = lerp(ra ? ra.centerY : rec.centerY, rb ? rb.centerY : rec.centerY, t);
    screenToWorld(camera, cx, cy, tmpV);

    const worldH = 2 * Math.tan(((camera.fov * Math.PI) / 180) / 2) * camera.position.z;
    const worldW = worldH * camera.aspect;
    let scale: number;
    if (a.useAnchorWidth || b.useAnchorWidth) {
      const wpx = lerp(ra ? ra.width : rec.width, rb ? rb.width : rec.width, t);
      scale = ((wpx / window.innerWidth) * worldW) / PANEL_W;
    } else {
      scale = (heightFrac * worldH) / PANEL_H;
    }

    stack.group.position.copy(tmpV);
    stack.group.scale.setScalar(scale);
    stack.setState({
      explode,
      fill,
      opacity,
      tiltX: -0.12 + pointer.y * 0.05,
      tiltY: 0.16 + pointer.x * 0.09,
    });
    stack.setGrade(state.grade);
    stack.update(time);

    // Align the PROJECTED bounding box centre to the anchor centre: tilt and
    // perspective shift the visible box off the placeholder otherwise
    // (acceptance §5: within 24 px).
    if (opacity > 0.01) {
      for (let iter = 0; iter < 2; iter++) {
        stack.group.updateWorldMatrix(true, true);
        const box = new THREE.Box3().setFromObject(stack.group);
        const bb = projectBox(box);
        tmpV.x += ((cx - (bb.x + bb.w / 2)) / window.innerWidth) * worldW;
        tmpV.y -= ((cy - (bb.y + bb.h / 2)) / window.innerHeight) * worldH;
        stack.group.position.copy(tmpV);
      }
    }
  }

  // Projected screen bounding box of a world-space box (same math as the QA
  // debug hook, so measurements and alignment agree).
  const projTmp = new THREE.Vector3();
  function projectBox(box: THREE.Box3): { x: number; y: number; w: number; h: number } {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const x of [box.min.x, box.max.x])
      for (const y of [box.min.y, box.max.y])
        for (const z of [box.min.z, box.max.z]) {
          projTmp.set(x, y, z).project(camera);
          const sx = (projTmp.x * 0.5 + 0.5) * window.innerWidth;
          const sy = (-projTmp.y * 0.5 + 0.5) * window.innerHeight;
          minX = Math.min(minX, sx); maxX = Math.max(maxX, sx);
          minY = Math.min(minY, sy); maxY = Math.max(maxY, sy);
        }
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  // --- Debug hooks (QA builds only: dev or PUBLIC_QA=1) ---
  const debugAllowed = import.meta.env.DEV || import.meta.env.PUBLIC_QA === '1';
  if (debugAllowed) {
    (window as unknown as { __SCENE_DEBUG__?: object }).__SCENE_DEBUG__ = {
      setProgress(p: number) {
        forcedProgress = Math.min(1, Math.max(0, p));
        readScroll();
        smoothProgress = forcedProgress;
        state.progress = forcedProgress;
        updateAct(state);
        applyJourney(forcedProgress, performance.now());
        renderer.render(scene, camera);
      },
      getRenderInfo() {
        return {
          calls: renderer.info.render.calls,
          triangles: renderer.info.render.triangles,
          particles: 0,
          dpr: renderer.getPixelRatio(),
        };
      },
      getObjectScreenBox() {
        const box = new THREE.Box3().setFromObject(stack.group);
        return { ...projectBox(box), opacity: stack.group.visible };
      },
      getAnchors() {
        refreshAnchorRects(anchors);
        const out: Record<string, object> = {};
        anchors.forEach((rec, key) => {
          out[key] = {
            x: rec.centerX,
            y: rec.centerY,
            width: rec.width,
            height: rec.height,
          };
        });
        return out;
      },
    };
  }

  // --- Render loop: full rate while scrolling, 30 FPS ambient, paused hidden ---
  let raf = 0;
  let lastFrame = 0;
  const frame = (time: number) => {
    raf = requestAnimationFrame(frame);
    if (document.hidden) return;

    const active = time - lastActivity < 500;
    if (!active && time - lastFrame < 33) return;
    lastFrame = time;

    adaptive.sample(time);

    const target = forcedProgress ?? state.progress;
    smoothProgress += (target - smoothProgress) * 0.14;
    if (Math.abs(target - smoothProgress) < 0.0005) smoothProgress = target;

    updateAct(state);
    state.pointer.x += (pointer.x - state.pointer.x) * 0.06;
    state.pointer.y += (pointer.y - state.pointer.y) * 0.06;

    skyUniforms.uTime.value = time / 1000;
    skyUniforms.uGrade.value = state.grade;
    skyUniforms.uScroll.value = smoothProgress;
    skyUniforms.uPointer.value.set(state.pointer.x, state.pointer.y);

    // Camera pointer parallax (fine pointers only).
    if (finePointer) {
      camera.position.x = state.pointer.x * 0.28;
      camera.position.y = state.pointer.y * 0.18;
      camera.lookAt(0, 0, 0);
    }

    refreshAnchorRects(anchors);
    applyJourney(smoothProgress, time);

    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(frame);

  // Context loss: fall back cleanly (Tier 0) instead of leaving a dead canvas.
  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
    document.documentElement.classList.remove('webgl-on');
    mount.classList.add('scene-tier-0');
    renderer.dispose();
  });
}
