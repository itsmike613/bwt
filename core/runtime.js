import { Loop } from './loop.js';
import { Input } from './input.js';
import { View } from './view.js';
import { World } from './world.js';
import { make } from './block.js';
import { mesh } from './mesh.js';

class Runtime {
  constructor(node) {
    this.view = new View(node);
    this.world = new World();
    this.input = new Input(this.view.render.domElement);
    this.mats = make();
    this.loop = new Loop();
    this.closed = false;
    this.mesh = chunk => {
      const group = mesh(this.world, chunk, this.mats);
      this.view.scene.add(group);
    };
    this.tick = null;
    this.frame = null;
    this.loop.tick = dt => {
      this.tick?.(dt);
      this.input.clear();
    };
    this.loop.draw = alpha => {
      this.frame?.(alpha);
      this.sync();
      this.view.draw();
    };
  }

  sync() {
    if (!this.closed) this.world.flush(this.mesh);
  }

  start() {
    if (this.closed) return;
    this.sync();
    this.loop.start();
  }

  stop() {
    this.loop.stop();
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.stop();
    this.input.close();
    this.world.clear();
    for (const material of this.mats.values()) {
      material.map?.dispose?.();
      material.dispose?.();
    }
    this.mats.clear();
    this.tick = null;
    this.frame = null;
    this.loop.tick = null;
    this.loop.draw = null;
    this.view.close();
  }
}

export { Runtime };
