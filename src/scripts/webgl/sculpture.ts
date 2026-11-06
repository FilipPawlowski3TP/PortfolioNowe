// "Rzeźba świetlna" — the hero 3D subject (G2 hero decision: option B with a
// nod to C: the rings slowly "assemble" as the user scrolls). Three glowing
// rings + a pulsing core, additive fresnel glow, night -> dawn with uGrade.
import * as THREE from 'three';
import sculptureVert from './shaders/sculpture.vert.glsl?raw';
import sculptureFrag from './shaders/sculpture.frag.glsl?raw';

export interface SculptureHandle {
  group: THREE.Group;
  setOpacity(alpha: number): void;
  update(elapsed: number, progress: number, pointer: THREE.Vector2): void;
  dispose(): void;
}

export function createSculpture(sharedUniforms: Record<string, THREE.IUniform>): SculptureHandle {
  const group = new THREE.Group();
  const materials: THREE.ShaderMaterial[] = [];

  const makeMaterial = () => {
    const material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: sculptureVert,
      fragmentShader: sculptureFrag,
      uniforms: { ...sharedUniforms, uOpacity: { value: 1 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    materials.push(material);
    return material;
  };

  const ringSpecs = [
    { radius: 2.05, tube: 0.05, rx: 1.15, ry: 0.2, rz: 0 },
    { radius: 1.58, tube: 0.045, rx: 0.35, ry: 0.9, rz: 0.3 },
    { radius: 1.12, tube: 0.04, rx: 1.5, ry: 0.35, rz: 1.0 },
  ];
  const rings: THREE.Mesh[] = ringSpecs.map((spec) => {
    const geometry = new THREE.TorusGeometry(spec.radius, spec.tube, 20, 140);
    const mesh = new THREE.Mesh(geometry, makeMaterial());
    mesh.rotation.set(spec.rx, spec.ry, spec.rz);
    group.add(mesh);
    return mesh;
  });

  const coreGeometry = new THREE.IcosahedronGeometry(0.62, 2);
  const core = new THREE.Mesh(coreGeometry, makeMaterial());
  group.add(core);

  group.position.set(2.35, 1.05, -0.9);
  group.scale.setScalar(1.18);

  return {
    group,
    setOpacity(alpha: number) {
      for (const material of materials) {
        (material.uniforms.uOpacity.value as number) = alpha;
      }
      group.visible = alpha > 0.004;
    },
    update(elapsed, progress, pointer) {
      group.rotation.y = elapsed * 0.06 + progress * 1.6 + pointer.x * 0.12;
      group.rotation.x = 0.12 * Math.sin(elapsed * 0.14) + pointer.y * 0.08;
      rings.forEach((ring, i) => {
        ring.rotation.z += 0.0009 * (i + 1) * (1 + progress * 2.2);
        ring.rotation.x += 0.0004 * (i % 2 === 0 ? 1 : -1);
      });
      core.rotation.y = elapsed * 0.12;
      core.scale.setScalar(1 + 0.04 * Math.sin(elapsed * 0.7));
    },
    dispose() {
      for (const ring of rings) ring.geometry.dispose();
      coreGeometry.dispose();
      for (const material of materials) material.dispose();
    },
  };
}
