import * as THREE from 'three';

function texture(stage) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 64, 64);
  ctx.strokeStyle = 'rgba(20,20,20,0.82)';
  ctx.lineWidth = 2;
  const count = 2 + stage * 2;
  for (let i = 0; i < count; i++) {
    const angle = ((i * 2.399) + stage * 0.31) % (Math.PI * 2);
    const length = 12 + ((i * 13 + stage * 7) % 22);
    const x = 32 + Math.cos(angle) * length;
    const y = 32 + Math.sin(angle) * length;
    ctx.beginPath();
    ctx.moveTo(32, 32);
    ctx.lineTo(x, y);
    if (stage > 2) {
      ctx.lineTo(x + Math.sin(angle) * 7, y - Math.cos(angle) * 7);
    }
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}

class Cracks {
  constructor(scene) {
    this.scene = scene;
    this.items = new Map();
    this.maps = Array.from({ length: 8 }, (_, i) => texture(i));
  }

  start(uid, data) {
    this.stop(uid);
    const mat = new THREE.MeshBasicMaterial({
      map: this.maps[0],
      transparent: true,
      depthWrite: false,
      alphaTest: 0.02,
      polygonOffset: true,
      polygonOffsetFactor: -2
    });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.006, 1.006, 1.006), mat);
    mesh.position.set(data.x + 0.5, data.y + 0.5, data.z + 0.5);
    this.scene.add(mesh);
    this.items.set(uid, { mesh, mat, age: 0, time: Math.max(0.05, data.time), stage: -1 });
  }

  stop(uid) {
    const item = this.items.get(uid);
    if (!item) return;
    item.mesh.geometry.dispose();
    item.mat.dispose();
    item.mesh.parent?.remove(item.mesh);
    this.items.delete(uid);
  }

  frame(dt) {
    for (const item of this.items.values()) {
      item.age += dt;
      const ratio = Math.min(0.999, item.age / item.time);
      const stage = Math.min(7, Math.floor(ratio * 8));
      if (stage !== item.stage) {
        item.stage = stage;
        item.mat.map = this.maps[stage];
        item.mat.needsUpdate = true;
      }
    }
  }

  close() {
    for (const uid of [...this.items.keys()]) this.stop(uid);
    for (const tex of this.maps) tex.dispose();
  }
}

export { Cracks };
