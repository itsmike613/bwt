import { combat } from '../data/balance.js';
import { item } from '../data/item.js';

function damage(id = '') {
  const def = item(id);
  return def?.kind === 'weapon' ? def.damage : combat.fist;
}

function reach(a, b, limit = combat.reach) {
  if (!a || !b) return false;
  const dx = b.x - a.x;
  const dy = (b.y + 0.9) - (a.y + 0.9);
  const dz = b.z - a.z;
  return dx * dx + dy * dy + dz * dz <= limit * limit;
}

function vector(a) {
  const cp = Math.cos(a.pitch ?? 0);
  return { x: -Math.sin(a.yaw ?? 0) * cp, y: Math.sin(a.pitch ?? 0), z: -Math.cos(a.yaw ?? 0) * cp };
}

function aim(a, b) {
  const dx = b.x - a.x;
  const dy = (b.y + 0.9) - (a.y + 1.62);
  const dz = b.z - a.z;
  const length = Math.hypot(dx, dy, dz) || 1;
  const dir = vector(a);
  return (dir.x * dx + dir.y * dy + dir.z * dz) / length;
}

function knock(a, b, power = combat.knock, lift = combat.lift) {
  let x = b.x - a.x;
  let z = b.z - a.z;
  const length = Math.hypot(x, z) || 1;
  x /= length;
  z /= length;
  return { x: x * power, y: lift, z: z * power };
}

export { aim, damage, knock, reach, vector };
