const eps = 0.0001;

function box(player, x = player.pos.x, y = player.pos.y, z = player.pos.z) {
  const half = player.width / 2;
  return {
    min: { x: x - half, y, z: z - half },
    max: { x: x + half, y: y + player.height, z: z + half }
  };
}

function solid(world, area) {
  const min = {
    x: Math.floor(area.min.x + eps),
    y: Math.floor(area.min.y + eps),
    z: Math.floor(area.min.z + eps)
  };
  const max = {
    x: Math.floor(area.max.x - eps),
    y: Math.floor(area.max.y - eps),
    z: Math.floor(area.max.z - eps)
  };
  for (let y = min.y; y <= max.y; y++) {
    for (let z = min.z; z <= max.z; z++) {
      for (let x = min.x; x <= max.x; x++) {
        if (world.get(x, y, z)) return true;
      }
    }
  }
  return false;
}

function support(world, player, x = player.pos.x, z = player.pos.z) {
  const area = box(player, x, player.pos.y - 0.08, z);
  area.max.y = player.pos.y + 0.02;
  return solid(world, area);
}

function axis(world, player, name, amount) {
  if (!amount) return false;
  const next = { x: player.pos.x, y: player.pos.y, z: player.pos.z };
  next[name] += amount;
  if (!solid(world, box(player, next.x, next.y, next.z))) {
    player.pos[name] = next[name];
    return false;
  }

  const dir = Math.sign(amount);
  let left = Math.abs(amount);
  while (left > 0.0005) {
    const step = Math.min(left, 0.02) * dir;
    const probe = { x: player.pos.x, y: player.pos.y, z: player.pos.z };
    probe[name] += step;
    if (solid(world, box(player, probe.x, probe.y, probe.z))) break;
    player.pos[name] = probe[name];
    left -= Math.abs(step);
  }
  player.vel[name] = 0;
  return true;
}

function move(world, player, dt) {
  let dx = player.vel.x * dt;
  let dz = player.vel.z * dt;

  if (player.crouch && player.ground && !player.flight && !support(world, player, player.pos.x + dx, player.pos.z)) dx = 0;
  const x = axis(world, player, 'x', dx);

  if (player.crouch && player.ground && !player.flight && !support(world, player, player.pos.x, player.pos.z + dz)) dz = 0;
  const z = axis(world, player, 'z', dz);

  const falling = player.vel.y <= 0;
  const y = axis(world, player, 'y', player.vel.y * dt);
  player.ground = (falling && y) || support(world, player);
  return { x, y, z };
}

export { box, move, solid, support };
