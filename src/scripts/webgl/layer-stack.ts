// LayerStack (PATCH v1.1 §2): one object — five 16:10 panels stacked in Z that
// tell "a website is built layer by layer": 1 blueprint -> 2 layout -> 3
// content -> 4 accents -> 5 the real client screenshot. Additive glowing edges;
// `explode` spreads the layers, `fill` lights them up in sequence.
import * as THREE from 'three';

export interface LayerStackState {
  explode: number; // 0..1 (0 = assembled single plane)
  fill: number; // 0..5 (continuous: which layers are lit)
  opacity: number; // 0..1 whole object
  tiltX: number;
  tiltY: number;
}

export interface LayerStackHandle {
  group: THREE.Group;
  setState(s: Partial<LayerStackState>): void;
  setGrade(grade: number): void;
  update(time: number): void;
  dispose(): void;
}

const PANEL_W = 3.2;
const PANEL_H = 2.0;

function canvasTexture(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): THREE.CanvasTexture {
  const w = 640;
  const h = 400;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function blueprintTexture(): THREE.CanvasTexture {
  return canvasTexture((ctx, w, h) => {
    ctx.fillStyle = 'rgba(22, 20, 48, 0.5)';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(143, 211, 255, 0.34)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(143, 211, 255, 0.7)';
    ctx.strokeRect(24, 24, w - 48, h - 48);
  });
}

function layoutTexture(): THREE.CanvasTexture {
  return canvasTexture((ctx, w, h) => {
    ctx.fillStyle = 'rgba(22, 20, 48, 0.42)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(143, 211, 255, 0.34)';
    ctx.fillRect(36, 32, w - 72, 52); // nav
    ctx.fillRect(36, 108, w * 0.5, 120); // hero block
    ctx.fillRect(w * 0.56, 108, w * 0.38, 120); // side block
    ctx.fillRect(36, 252, w * 0.28, 110);
    ctx.fillRect(36 + w * 0.31, 252, w * 0.28, 110);
    ctx.fillRect(36 + w * 0.62, 252, w * 0.32, 110);
  });
}

function contentTexture(): THREE.CanvasTexture {
  return canvasTexture((ctx, w, h) => {
    ctx.fillStyle = 'rgba(22, 20, 48, 0.38)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(232, 237, 250, 0.8)';
    ctx.fillRect(36, 40, w * 0.36, 26); // heading
    ctx.fillStyle = 'rgba(232, 237, 250, 0.5)';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(36, 92 + i * 22, w * (0.62 - i * 0.07), 9);
    }
    ctx.fillStyle = 'rgba(232, 237, 250, 0.72)';
    ctx.fillRect(36, 240, w * 0.44, 22);
    ctx.fillStyle = 'rgba(232, 237, 250, 0.45)';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(36, 282 + i * 20, w * 0.3, 8);
    }
  });
}

function accentsTexture(): THREE.CanvasTexture {
  return canvasTexture((ctx, w, h) => {
    ctx.fillStyle = 'rgba(22, 20, 48, 0.34)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(232, 237, 250, 0.95)';
    ctx.fillRect(36, 44, w * 0.4, 30); // heading solid
    ctx.fillStyle = 'rgba(255, 138, 91, 1)';
    ctx.fillRect(36, 110, 150, 46); // primary button
    ctx.fillStyle = 'rgba(255, 138, 91, 0.75)';
    ctx.fillRect(200, 110, 120, 46); // secondary
    ctx.fillRect(36, 208, 8, 120); // accent rail
    ctx.fillStyle = 'rgba(143, 211, 255, 0.75)';
    ctx.fillRect(60, 208, w * 0.3, 8);
    ctx.fillRect(60, 236, w * 0.22, 8);
  });
}

export function createLayerStack(screenshot: THREE.Texture | null): LayerStackHandle {
  const group = new THREE.Group();

  const textures: THREE.Texture[] = [
    blueprintTexture(),
    layoutTexture(),
    contentTexture(),
    accentsTexture(),
  ];
  if (screenshot) textures.push(screenshot);

  const panels: THREE.Mesh[] = [];
  const edges: THREE.LineSegments[] = [];
  const edgeGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(PANEL_W, PANEL_H));
  const planeGeo = new THREE.PlaneGeometry(PANEL_W, PANEL_H);

  for (let i = 0; i < textures.length; i++) {
    const mat = new THREE.MeshBasicMaterial({
      map: textures[i],
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(planeGeo, mat);
    mesh.renderOrder = 10 + i;
    group.add(mesh);
    panels.push(mesh);

    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x8fd3ff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const line = new THREE.LineSegments(edgeGeo, edgeMat);
    line.renderOrder = 20 + i;
    group.add(line);
    edges.push(line);
  }

  const state: LayerStackState = {
    explode: 0.6,
    fill: 2,
    opacity: 1,
    tiltX: -0.12,
    tiltY: 0.16,
  };

  const ice = new THREE.Color(0x8fd3ff);
  const dawn = new THREE.Color(0xff8a5b);

  function apply(): void {
    const spacing = 0.08 + state.explode * 1.05;
    panels.forEach((panel, i) => {
      panel.position.z = -i * spacing;
      const lit = Math.min(1, Math.max(0, state.fill - i));
      const base = i === 4 ? 1 : 0.88;
      (panel.material as THREE.MeshBasicMaterial).opacity = lit * base * state.opacity;
    });
    edges.forEach((line, i) => {
      line.position.z = -i * spacing;
      (line.material as THREE.LineBasicMaterial).opacity =
        (0.16 + 0.5 * Math.min(1, Math.max(0, state.fill - i))) * state.opacity;
    });
    group.rotation.x = state.tiltX;
    group.rotation.y = state.tiltY;
    group.visible = state.opacity > 0.004;
  }

  apply();

  return {
    group,
    setState(s: Partial<LayerStackState>) {
      Object.assign(state, s);
      apply();
    },
    setGrade(grade: number) {
      const c = ice.clone().lerp(dawn, Math.min(1, Math.max(0, grade * 1.1)));
      edges.forEach((line) => (line.material as THREE.LineBasicMaterial).color.copy(c));
    },
    update(time: number) {
      // Slow idle drift keeps the object alive at rest.
      group.rotation.y = state.tiltY + Math.sin(time * 0.00012) * 0.05;
      group.rotation.x = state.tiltX + Math.sin(time * 0.00009) * 0.025;
    },
    dispose() {
      planeGeo.dispose();
      edgeGeo.dispose();
      textures.forEach((t) => t.dispose());
      panels.forEach((m) => (m.material as THREE.MeshBasicMaterial).dispose());
      edges.forEach((l) => (l.material as THREE.LineBasicMaterial).dispose());
    },
  };
}
