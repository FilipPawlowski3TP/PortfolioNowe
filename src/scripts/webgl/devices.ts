// Act IV mockups: simple laptop + phone geometry with OUR OWN screenshots of
// koparkapawlowski.pl as textures (no hotlinking; masterprompt sekcja 9).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export interface DevicesHandle {
  group: THREE.Group;
  setOpacity(alpha: number): void;
  dispose(): void;
}

export function createDevices(renderer: THREE.WebGLRenderer): DevicesHandle {
  const group = new THREE.Group();
  const loader = new THREE.TextureLoader();
  const anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.MeshBasicMaterial[] = [];
  const textures: THREE.Texture[] = [];

  const makeTexture = (url: string): THREE.Texture => {
    const tex = loader.load(url);
    tex.colorSpace = THREE.SRGBColorSpace; // screenshots are sRGB
    tex.anisotropy = anisotropy;
    textures.push(tex);
    return tex;
  };

  const bodyMaterial = () => {
    const m = new THREE.MeshBasicMaterial({ color: 0x18223d, transparent: true, opacity: 0 });
    materials.push(m);
    return m;
  };

  const screenMaterial = (map: THREE.Texture) => {
    const m = new THREE.MeshBasicMaterial({ map, transparent: true, opacity: 0 });
    materials.push(m);
    return m;
  };

  // --- Laptop ---
  const laptop = new THREE.Group();
  const baseGeo = new RoundedBoxGeometry(3.4, 0.16, 2.3, 4, 0.05);
  geometries.push(baseGeo);
  laptop.add(new THREE.Mesh(baseGeo, bodyMaterial()));

  const screenGroup = new THREE.Group();
  const lidGeo = new RoundedBoxGeometry(3.4, 2.2, 0.1, 4, 0.05);
  geometries.push(lidGeo);
  screenGroup.add(new THREE.Mesh(lidGeo, bodyMaterial()));

  const screenGeo = new THREE.PlaneGeometry(3.15, 2.0);
  geometries.push(screenGeo);
  const laptopScreen = new THREE.Mesh(
    screenGeo,
    screenMaterial(makeTexture('/media/case-desktop-hero.png')),
  );
  laptopScreen.position.z = 0.06;
  screenGroup.add(laptopScreen);

  screenGroup.position.set(0, 1.12, -1.12);
  screenGroup.rotation.x = -0.1;
  laptop.add(screenGroup);

  laptop.position.set(-1.6, -0.6, -1.2);
  laptop.rotation.y = 0.32;
  group.add(laptop);

  // --- Phone ---
  const phone = new THREE.Group();
  const phoneGeo = new RoundedBoxGeometry(1.05, 2.15, 0.1, 4, 0.06);
  geometries.push(phoneGeo);
  phone.add(new THREE.Mesh(phoneGeo, bodyMaterial()));

  const phoneScreenGeo = new THREE.PlaneGeometry(0.95, 2.0);
  geometries.push(phoneScreenGeo);
  const phoneScreen = new THREE.Mesh(
    phoneScreenGeo,
    screenMaterial(makeTexture('/media/case-mobile-hero.png')),
  );
  phoneScreen.position.z = 0.06;
  phone.add(phoneScreen);

  phone.position.set(2.1, -0.35, 0.4);
  phone.rotation.set(-0.05, -0.35, 0.06);
  group.add(phone);

  group.position.set(2.4, 0.2, -0.6);
  group.visible = false;

  return {
    group,
    setOpacity(alpha: number) {
      for (const m of materials) m.opacity = alpha;
    },
    dispose() {
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      for (const t of textures) t.dispose();
    },
  };
}
