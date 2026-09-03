import { box } from './collide.js';

function overlap(area, x, y, z) {
  return area.max.x > x && area.min.x < x + 1 &&
    area.max.y > y && area.min.y < y + 1 &&
    area.max.z > z && area.min.z < z + 1;
}

class Build {
  constructor(world) {
    this.world = world;
  }

  spot(hit, player = null) {
    if (!hit) return null;
    const x = hit.x + hit.face.x;
    const y = hit.y + hit.face.y;
    const z = hit.z + hit.face.z;
    if (this.world.get(x, y, z)) return null;
    if (player && overlap(box(player), x, y, z)) return null;
    return { x, y, z };
  }

  place(hit, id, player = null, kind = 2) {
    if (!id) return false;
    const pos = this.spot(hit, player);
    if (!pos) return false;
    this.world.set(pos.x, pos.y, pos.z, id, kind);
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
