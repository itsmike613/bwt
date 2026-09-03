import { box, solid } from './collide.js';

class Build {
  constructor(world) {
    this.world = world;
  }

  place(hit, id, player = null, kind = 2) {
    if (!hit || !id) return false;
    const x = hit.x + hit.face.x;
    const y = hit.y + hit.face.y;
    const z = hit.z + hit.face.z;
    if (this.world.get(x, y, z)) return false;
    this.world.set(x, y, z, id, kind);
    if (player && solid(this.world, box(player))) {
      this.world.del(x, y, z);
      return false;
    }
    return true;
  }

  break(hit, edit = false) {
    if (!hit) return false;
    if (!edit && this.world.kind(hit.x, hit.y, hit.z) !== 2) return false;
    this.world.del(hit.x, hit.y, hit.z);
    return true;
  }
}

export { Build };
