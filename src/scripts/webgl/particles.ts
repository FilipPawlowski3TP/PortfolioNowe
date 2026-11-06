// Instanced dust particles inside the Three.js scene (masterprompt 6.2:
// particles only as instanced objects inside the scene — never DOM confetti).
import * as THREE from 'three';
import particlesVert from './shaders/particles.vert.glsl?raw';
import particlesFrag from './shaders/particles.frag.glsl?raw';

export interface ParticlesHandle {
  points: THREE.Points;
  setCount(count: number): void;
  dispose(): void;
}

export const MAX_PARTICLES = 3500;

export function createParticles(sharedUniforms: Record<string, THREE.IUniform>): ParticlesHandle {
  const positions = new Float32Array(MAX_PARTICLES * 3);
  for (let i = 0; i < MAX_PARTICLES; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 30;
    positions[i * 3 + 1] = Math.random() * 14 - 4;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 30 - 3;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: particlesVert,
    fragmentShader: particlesFrag,
    uniforms: sharedUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);

  return {
    points,
    setCount(count: number) {
      geometry.setDrawRange(0, Math.min(count, MAX_PARTICLES));
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
