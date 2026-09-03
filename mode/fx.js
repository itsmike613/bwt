import * as THREE from 'three';

class Fx {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.geo = new THREE.SphereGeometry(1, 10, 8);
  }

  boom(pos, radius = 2) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffc36a, transparent: true, opacity: 0.7, depthWrite: false });
    const mesh = new THREE.Mesh(this.geo, mat);
    mesh.position.set(pos.x, pos.y, pos.z);
    mesh.scale.setScalar(0.2);
    this.scene.add(mesh);
    this.items.push({ mesh, mat, age: 0, radius });
  }

  frame(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.age += dt;
      const ratio = Math.min(1, item.age / 0.3);
      item.mesh.scale.setScalar(0.2 + item.radius * ratio);
      item.mat.opacity = 0.7 * (1 - ratio);
      if (ratio >= 1) {
        item.mat.dispose();
        item.mesh.parent?.remove(item.mesh);
        this.items.splice(i, 1);
      }
    }
  }

  close() {
    for (const item of this.items) {
      item.mat.dispose();
      item.mesh.parent?.remove(item.mesh);
    }
    this.items.length = 0;
    this.geo.dispose();
  }
}

export { Fx };
