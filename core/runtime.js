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
    this.world.each(chunk => {
      if (!chunk.dirty) return;
      const group = mesh(this.world, chunk, this.mats);
      this.view.scene.add(group);
    });
  }

  start() {
    this.sync();
    this.loop.start();
  }
}

export { Runtime };
