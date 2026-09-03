import { block } from '../data/item.js';
import { resist } from '../data/balance.js';

function blocks(world, pos, radius, power) {
  const out = [];
  const minx = Math.floor(pos.x - radius);
  const maxx = Math.floor(pos.x + radius);
  const miny = Math.floor(pos.y - radius);
  const maxy = Math.floor(pos.y + radius);
  const minz = Math.floor(pos.z - radius);
  const maxz = Math.floor(pos.z + radius);
  for (let y = miny; y <= maxy; y++) {
    for (let z = minz; z <= maxz; z++) {
      for (let x = minx; x <= maxx; x++) {
        if (world.kind(x, y, z) !== 2) continue;
        const dx = x + 0.5 - pos.x;
        const dy = y + 0.5 - pos.y;
        const dz = z + 0.5 - pos.z;
        if (dx * dx + dy * dy + dz * dz > radius * radius) continue;
        const def = block(world.get(x, y, z));
        if (!def || (resist[def.id] ?? Infinity) > power) continue;
        out.push({ x, y, z });
      }
    }
  }
  return out;
}

function scale(dist, radius) {
  return Math.max(0, 1 - dist / radius);
}

export { blocks, scale };
