import * as THREE from 'three';
import { drops as tune } from '../data/balance.js';

const colors = {
  iron: 0xd8d8d8,
  gold: 0xf1c84a,
  diamond: 0x48d8df,
  emerald: 0x42cf69
};

class Drops {
  constructor(scene) {
    this.scene = scene;
    this.items = new Map();
    this.meshes = new Map();
    this.dummy = new THREE.Object3D();
    for (const id of Object.keys(colors)) {
      const geo = new THREE.BoxGeometry(0.28, 0.14, 0.28);
      const mat = new THREE.MeshLambertMaterial({ color: colors[id] });
      const mesh = new THREE.InstancedMesh(geo, mat, tune.cap);
      mesh.count = 0;
      mesh.frustumCulled = false;
      scene.add(mesh);
      this.meshes.set(id, mesh);
    }
  }

  add(data) {
    if (!data?.id || !this.meshes.has(data.item)) return false;
    this.items.set(data.id, {
      id: data.id,
      item: data.item,
      count: data.count ?? 1,
      x: data.x,
      y: data.y,
      z: data.z,
      age: data.age ?? 0
    });
    return true;
  }

  del(id) {
    return this.items.delete(id);
  }

  get(id) {
    return this.items.get(id) ?? null;
  }

  first() {
    return this.items.keys().next().value ?? null;
  }

  load(list) {
    this.items.clear();
    for (const item of list ?? []) this.add(item);
  }

  dump() {
    return [...this.items.values()].map(item => ({ ...item }));
  }

  near(pos) {
    const reach = tune.reach * tune.reach;
    let best = null;
    let dist = reach;
    for (const item of this.items.values()) {
      const x = item.x - pos.x;
      const y = item.y - (pos.y + 0.7);
      const z = item.z - pos.z;
      const next = x * x + y * y + z * z;
      if (next <= dist) {
        dist = next;
        best = item;
      }
    }
    return best;
  }

  frame(dt) {
    for (const item of this.items.values()) item.age += dt;
    for (const [id, mesh] of this.meshes) {
      let index = 0;
      for (const item of this.items.values()) {
        if (item.item !== id || index >= tune.cap) continue;
        this.dummy.position.set(item.x, item.y + Math.sin(item.age * 2.6) * 0.08, item.z);
        this.dummy.rotation.set(0, item.age * 1.8, 0);
        this.dummy.updateMatrix();
        mesh.setMatrixAt(index++, this.dummy.matrix);
      }
      mesh.count = index;
      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  close() {
    for (const mesh of this.meshes.values()) {
      mesh.parent?.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    this.meshes.clear();
    this.items.clear();
  }
}

export { Drops };
