import * as THREE from 'three';

function sprite(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const node = new THREE.Sprite(mat);
  node.scale.set(3.2, 1, 1);
  return { canvas, ctx, texture, node, text: '', last: -1 };
}

function draw(item, name, left) {
  const value = Math.max(0, Math.ceil(left));
  if (item.last === value) return;
  item.last = value;
  const ctx = item.ctx;
  ctx.clearRect(0, 0, item.canvas.width, item.canvas.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 24px system-ui';
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#111';
  ctx.fillStyle = '#fff';
  ctx.strokeText(name, 128, 25);
  ctx.fillText(name, 128, 25);
  ctx.font = '20px system-ui';
  const text = `Spawns in ${value}s`;
  ctx.strokeText(text, 128, 55);
  ctx.fillText(text, 128, 55);
  item.texture.needsUpdate = true;
}

class Holo {
  constructor(scene, gens) {
    this.scene = scene;
    this.items = new Map();
    for (const gen of gens) {
      if (!gen.holo) continue;
      const item = sprite();
      item.node.position.set(gen.pos.x + 0.5, gen.pos.y + 1.8, gen.pos.z + 0.5);
      scene.add(item.node);
      this.items.set(gen.id, item);
    }
  }

  frame(gens) {
    for (const gen of gens) {
      const item = this.items.get(gen.id);
      if (!item) continue;
      const out = gen.outputs[0];
      const name = out.id === 'diamond' ? 'Diamond' : 'Emerald';
      draw(item, name, out.left);
    }
  }

  close() {
    for (const item of this.items.values()) {
      item.node.parent?.remove(item.node);
      item.texture.dispose();
      item.node.material.dispose();
    }
    this.items.clear();
  }
}

export { Holo };
