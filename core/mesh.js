import * as THREE from 'three';
import { size } from './world.js';

const faces = [
  { n: [1, 0, 0], v: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]] },
  { n: [-1, 0, 0], v: [[0,0,1],[0,1,1],[0,1,0],[0,0,0]] },
  { n: [0, 1, 0], v: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]] },
  { n: [0, -1, 0], v: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]] },
  { n: [0, 0, 1], v: [[1,0,1],[1,1,1],[0,1,1],[0,0,1]] },
  { n: [0, 0, -1], v: [[0,0,0],[0,1,0],[1,1,0],[1,0,0]] }
];

const uv = [[0,0],[0,1],[1,1],[1,0]];

function mesh(world, chunk, mats) {
  if (chunk.group) {
    chunk.group.parent?.remove(chunk.group);
    chunk.group.traverse(node => {
      if (node.geometry) node.geometry.dispose();
    });
  }

  const group = new THREE.Group();
  const buckets = new Map();
  const ox = chunk.x * size;
  const oy = chunk.y * size;
  const oz = chunk.z * size;

  for (let y = 0; y < size; y++) {
    for (let z = 0; z < size; z++) {
      for (let x = 0; x < size; x++) {
        const wx = ox + x;
        const wy = oy + y;
        const wz = oz + z;
        const id = world.get(wx, wy, wz);
        if (!id) continue;
        let bucket = buckets.get(id);
        if (!bucket) {
          bucket = { pos: [], norm: [], uv: [], idx: [] };
          buckets.set(id, bucket);
        }
        for (const face of faces) {
          const nx = wx + face.n[0];
          const ny = wy + face.n[1];
          const nz = wz + face.n[2];
          if (world.get(nx, ny, nz)) continue;
          const base = bucket.pos.length / 3;
          for (let i = 0; i < 4; i++) {
            const v = face.v[i];
            bucket.pos.push(x + v[0], y + v[1], z + v[2]);
            bucket.norm.push(face.n[0], face.n[1], face.n[2]);
            bucket.uv.push(uv[i][0], uv[i][1]);
          }
          bucket.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
        }
      }
    }
  }

  for (const [id, bucket] of buckets) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(bucket.pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(bucket.norm, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(bucket.uv, 2));
    geo.setIndex(bucket.idx);
    geo.computeBoundingSphere();
    const part = new THREE.Mesh(geo, mats.get(id));
    group.add(part);
  }

  group.position.set(ox, oy, oz);
  chunk.group = group;
  chunk.dirty = false;
  return group;
}

export { mesh };
