function wish(yaw, forward, side, out = { x: 0, z: 0 }) {
  const length = Math.hypot(forward, side);
  if (!length) {
    out.x = 0;
    out.z = 0;
    return out;
  }

  const f = forward / length;
  const s = side / length;
  const sin = Math.sin(yaw);
  const cos = Math.cos(yaw);
  out.x = -f * sin + s * cos;
  out.z = -f * cos - s * sin;
  return out;
}

function near(value, target, amount) {
  if (value < target) return Math.min(target, value + amount);
  if (value > target) return Math.max(target, value - amount);
  return target;
}

export { near, wish };
