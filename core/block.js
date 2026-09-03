import * as THREE from 'three';

const list = [
  null,
  { id: 1, name: 'Stone', file: 'stone.png', solid: true },
  { id: 2, name: 'Wool', file: 'wool.png', solid: true },
  { id: 3, name: 'Wood', file: 'wood.png', solid: true },
  { id: 4, name: 'End Stone', file: 'end.png', solid: true },
  { id: 5, name: 'Obsidian', file: 'obsidian.png', solid: true }
];

const files = new URL('../asset/texture/', import.meta.url);

function make() {
  const loader = new THREE.TextureLoader();
  const mats = new Map();
  for (const block of list) {
    if (!block) continue;
    const texture = loader.load(new URL(block.file, files).href);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshLambertMaterial({ map: texture });
    mats.set(block.id, material);
  }
  return mats;
}

function get(id) {
  return list[id] ?? null;
}

function all() {
  return list.filter(Boolean);
}

export { all, get, make };
