import * as THREE from 'three';

class Bombs {
  constructor(scene) {
    this.scene = scene;
    this.items = new Map();
    this.geo = new THREE.BoxGeometry(0.85, 0.85, 0.85);
    this.base = new THREE.MeshLambertMaterial({ color: 0xc73535 });
  }

  add(data) {
    if (this.items.has(data.id)) return;
    const mat = this.base.clone();
    const mesh = new THREE.Mesh(this.geo, mat);
    mesh.position.set(data.x, data.y, data.z);
    this.scene.add(mesh);
    this.items.set(data.id, { ...data, left: data.left, mesh, mat });
  }

  del(id) {
    const item = this.items.get(id);
    if (!item) return;
    item.mat.dispose();
    item.mesh.parent?.remove(item.mesh);
    this.items.delete(id);
  }

  tick(dt, done = null) {
    for (const item of [...this.items.values()]) {
      item.left -= dt;
      const flash = item.left < 1 && Math.floor(item.left * 8) % 2 === 0;
      item.mat.color.setHex(flash ? 0xffffff : 0xc73535);
      const pulse = 1 + Math.max(0, 1 - item.left) * 0.08;
      item.mesh.scale.setScalar(pulse);
      if (done && item.left <= 0) done(item);
    }
  }

  dump() {
    return [...this.items.values()].map(item => ({ id: item.id, owner: item.owner, x: item.mesh.position.x, y: item.mesh.position.y, z: item.mesh.position.z, left: item.left }));
  }

  load(list = []) {
    for (const id of [...this.items.keys()]) this.del(id);
    for (const data of list) this.add(data);
  }

  close() {
    for (const id of [...this.items.keys()]) this.del(id);
    this.geo.dispose();
    this.base.dispose();
  }
}

export { Bombs };
