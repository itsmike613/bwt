import * as THREE from 'three';

class Balls {
  constructor(scene) {
    this.scene = scene;
    this.items = new Map();
    this.geo = new THREE.SphereGeometry(0.22, 8, 6);
    this.mat = new THREE.MeshBasicMaterial({ color: 0xff7a2f });
  }

  add(data) {
    if (this.items.has(data.id)) return;
    const mesh = new THREE.Mesh(this.geo, this.mat);
    mesh.position.set(data.x, data.y, data.z);
    this.scene.add(mesh);
    this.items.set(data.id, { ...data, mesh, age: data.age ?? 0 });
  }

  del(id) {
    const item = this.items.get(id);
    if (!item) return;
    item.mesh.parent?.remove(item.mesh);
    this.items.delete(id);
  }

  tick(dt, hit = null) {
    for (const item of [...this.items.values()]) {
      item.age += dt;
      item.mesh.position.x += item.vx * dt;
      item.mesh.position.y += item.vy * dt;
      item.mesh.position.z += item.vz * dt;
      if (hit) hit(item);
    }
  }

  dump() {
    return [...this.items.values()].map(item => ({
      id: item.id, owner: item.owner,
      x: item.mesh.position.x, y: item.mesh.position.y, z: item.mesh.position.z,
      vx: item.vx, vy: item.vy, vz: item.vz, age: item.age
    }));
  }

  load(list = []) {
    for (const id of [...this.items.keys()]) this.del(id);
    for (const data of list) this.add(data);
  }

  close() {
    for (const item of this.items.values()) item.mesh.parent?.remove(item.mesh);
    this.items.clear();
    this.geo.dispose();
    this.mat.dispose();
  }
}

export { Balls };
