function raybox(origin, dir, box) {
  let low = -Infinity;
  let high = Infinity;
  for (const key of ['x', 'y', 'z']) {
    const start = origin[key];
    const step = dir[key];
    const min = box.min[key];
    const max = box.max[key];
    if (Math.abs(step) < 1e-9) {
      if (start < min || start > max) return Infinity;
      continue;
    }
    let a = (min - start) / step;
    let b = (max - start) / step;
    if (a > b) [a, b] = [b, a];
    low = Math.max(low, a);
    high = Math.min(high, b);
    if (low > high) return Infinity;
  }
  if (high < 0) return Infinity;
  return Math.max(0, low);
}

function distance(pos, mark) {
  if (!pos || !mark) return Infinity;
  return Math.hypot(pos.x - (mark.x + 0.5), pos.y + 0.9 - (mark.y + 0.8), pos.z - (mark.z + 0.5));
}

function target(origin, dir, pos, team, markers, reach, block = Infinity) {
  if (!origin || !dir || !pos || !team || !markers) return null;
  let best = null;
  for (const kind of ['item', 'island']) {
    const mark = markers?.[team]?.[kind];
    if (!mark || distance(pos, mark) > reach) continue;
    const box = {
      min: { x: mark.x + 0.05, y: mark.y, z: mark.z + 0.05 },
      max: { x: mark.x + 0.95, y: mark.y + 2.12, z: mark.z + 0.95 }
    };
    const dist = raybox(origin, dir, box);
    if (!Number.isFinite(dist) || dist > reach || dist >= block) continue;
    if (!best || dist < best.dist) best = { kind, dist };
  }
  return best;
}

export { distance, raybox, target };
