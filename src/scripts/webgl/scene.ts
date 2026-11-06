// One fixed canvas, one scene, scroll-driven state (masterprompt sekcja 11).
// Render scheduling: ~60 FPS while the user scrolls/moves the pointer (1.5 s),
// ambient 30 FPS after; paused when the tab is hidden. Joined to the SAME
// gsap.ticker that drives Lenis (masterprompt sekcja 10).
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import atmosphereVert from './shaders/atmosphere.vert.glsl?raw';
import atmosphereFrag from './shaders/atmosphere.frag.glsl?raw';
import layersVert from './shaders/layers.vert.glsl?raw';
import layersFrag from './shaders/layers.frag.glsl?raw';
import { createDevices, type DevicesHandle } from './devices';
import { createSculpture, type SculptureHandle } from './sculpture';
import { AdaptiveController } from './adaptive';
import { updateAct, type SceneState } from './acts';
import type { Tier } from './tier';

export interface SceneHandle {
  destroy(): void;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function initScene(tier: Tier, state: SceneState, mount: HTMLElement): SceneHandle | null {
  if (tier === 0) return null;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  mount.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: tier === 2,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 160);
  camera.position.set(0, 1.6, 9);

  const uniforms: Record<string, THREE.IUniform> = {
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uGrade: { value: 0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uRes: { value: new THREE.Vector2(1, 1) },
    uPixelRatio: { value: 1 },
  };

  // --- Atmosphere (cinematic night -> dawn glow; G2 decision: option A) ---
  const skyGeometry = new THREE.PlaneGeometry(2, 2);
  const skyMaterial = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: atmosphereVert,
    fragmentShader: atmosphereFrag,
    uniforms,
    depthTest: false,
    depthWrite: false,
  });
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  sky.frustumCulled = false;
  sky.renderOrder = -1;
  scene.add(sky);

  // --- Soft depth layers (parallax planes) ---
  const layerGeometry = new THREE.PlaneGeometry(34, 18);
  const layerMaterials: THREE.ShaderMaterial[] = [];
  const layerConfigs = [
    { z: -6, y: 0.4, x: -1.5 },
    { z: -12, y: 1.4, x: 1.5 },
    { z: -20, y: 2.6, x: -0.5 },
  ];
  layerConfigs.forEach((cfg, i) => {
    const material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: layersVert,
      fragmentShader: layersFrag,
      uniforms: { ...uniforms, uLayer: { value: i / Math.max(1, layerConfigs.length - 1) } },
      transparent: true,
      depthWrite: false,
    });
    layerMaterials.push(material);
    const mesh = new THREE.Mesh(layerGeometry, material);
    mesh.position.set(cfg.x, cfg.y, cfg.z);
    scene.add(mesh);
  });

  // --- Dust particles removed per owner feedback (dots in the background) ---

  // --- Light sculpture: hero 3D subject (concept B) ---
  const sculpture: SculptureHandle = createSculpture(uniforms);
  scene.add(sculpture.group);

  // --- Device mockups with case-study textures (Tier 2 only) ---
  let devices: DevicesHandle | null = null;
  if (tier === 2) {
    devices = createDevices(renderer);
    scene.add(devices.group);
  }

  // --- Adaptive quality ---
  const coarse = matchMedia('(pointer: coarse)').matches;
  let destroyed = false;
  const adaptive = new AdaptiveController(tier, coarse, {
    setDpr(dpr: number) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dpr));
      (uniforms.uPixelRatio.value as number) = Math.min(window.devicePixelRatio || 1, dpr);
    },
    downgradeTier() {
      // Step down hard: drop the scene entirely (Tier 0 fallback) rather than
      // flicker between quality levels mid-session.
      handle.destroy();
      mount.classList.add('scene-tier-0');
    },
  });

  // --- Sizing (ResizeObserver + debounce; ignore mobile URL-bar height noise) ---
  let lastWidth = 0;
  let lastHeight = 0;
  let resizeTimer = 0;
  const applySize = () => {
    const width = mount.clientWidth;
    const height = mount.clientHeight;
    lastWidth = width;
    lastHeight = height;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
    (uniforms.uRes.value as THREE.Vector2).set(width, height);
  };
  applySize();

  const observer = new ResizeObserver((entries) => {
    const rect = entries[0]?.contentRect;
    if (!rect) return;
    const widthChanged = Math.abs(rect.width - lastWidth) > 2;
    const heightDelta = Math.abs(rect.height - lastHeight);
    if (coarse && !widthChanged && heightDelta < 120) return; // mobile URL bar
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(applySize, 150);
  });
  observer.observe(mount);

  // --- Scroll + pointer feeds into sceneState ---
  let lastActiveAt = 0;
  const scrollTrigger = ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      state.progress = self.progress;
      updateAct(state);
      lastActiveAt = performance.now();
    },
  });

  const onPointerMove = (event: PointerEvent) => {
    state.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    state.pointer.y = (event.clientY / window.innerHeight) * -2 + 1;
    lastActiveAt = performance.now();
  };
  const fine = matchMedia('(pointer: fine)').matches;
  if (fine) window.addEventListener('pointermove', onPointerMove, { passive: true });

  // --- Context loss -> Tier 0 fallback (masterprompt 11.3) ---
  const onContextLost = (event: Event) => {
    event.preventDefault();
  };
  const onContextRestored = () => {
    handle.destroy();
    mount.classList.add('scene-tier-0');
  };
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);

  // --- Render loop on gsap.ticker (shared with Lenis) ---
  const smooth = { progress: 0, grade: 0, pointer: new THREE.Vector2(0, 0) };
  let lastRenderAt = 0;
  let firstFrame = true;

  const tick = (time: number) => {
    if (destroyed || document.hidden) return;
    const now = performance.now();
    const active = now - lastActiveAt < 1500;
    const minFrameMs = active ? 0 : 33.3; // 60 FPS active, ambient 30 FPS
    if (now - lastRenderAt < minFrameMs) return;
    lastRenderAt = now;

    adaptive.sample(now);

    smooth.progress += (state.progress - smooth.progress) * 0.06;
    smooth.grade += (state.grade - smooth.grade) * 0.04;
    smooth.pointer.x += (state.pointer.x - smooth.pointer.x) * 0.06;
    smooth.pointer.y += (state.pointer.y - smooth.pointer.y) * 0.06;

    uniforms.uTime.value = time;
    uniforms.uProgress.value = smooth.progress;
    uniforms.uGrade.value = smooth.grade;
    (uniforms.uPointer.value as THREE.Vector2).copy(smooth.pointer);

    // Camera: slow push-in across the page + subtle pointer parallax
    camera.position.x = smooth.pointer.x * 0.45;
    camera.position.y = 1.6 - smooth.progress * 0.5 - smooth.pointer.y * 0.25;
    camera.position.z = 9 - smooth.progress * 3.2;
    camera.lookAt(0, 0.9 - smooth.progress * 0.4, -2);

    // Devices window (Act IV): fade in around the case study, fade out after
    if (devices) {
      const window01 =
        smoothstep(0.42, 0.54, smooth.progress) * (1 - smoothstep(0.68, 0.8, smooth.progress));
      devices.setOpacity(window01);
      devices.group.visible = window01 > 0.004;
    }

    // Sculpture window: hero act, hands the stage over before section edges
    const sculptWin = 1 - smoothstep(0.09, 0.16, smooth.progress);
    sculpture.setOpacity(sculptWin);
    sculpture.update(time, smooth.progress, smooth.pointer);

    renderer.render(scene, camera);

    if (firstFrame) {
      firstFrame = false;
      mount.classList.add('scene-live'); // 400 ms crossfade from CSS fallback
    }
  };
  gsap.ticker.add(tick);

  // --- Debug affordances: dev / PUBLIC_QA builds only ---
  if (import.meta.env.DEV || import.meta.env.PUBLIC_QA === '1') {
    (window as unknown as Record<string, unknown>).__SCENE_DEBUG__ = {
      state,
      tier,
      setProgress(progress: number) {
        state.progress = Math.min(1, Math.max(0, progress));
        updateAct(state);
      },
      getRenderInfo: () => ({
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        particles: 0,
        dpr: renderer.getPixelRatio(),
      }),
    };
  }

  const handle: SceneHandle = {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      gsap.ticker.remove(tick);
      scrollTrigger.kill();
      if (fine) window.removeEventListener('pointermove', onPointerMove);
      observer.disconnect();
      window.clearTimeout(resizeTimer);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      devices?.dispose();
      sculpture.dispose();
      skyGeometry.dispose();
      skyMaterial.dispose();
      layerGeometry.dispose();
      for (const m of layerMaterials) m.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };

  return handle;
}
