const eps = 0.0001;
const depth = 0.08;

function box(player, x = player.pos.x, y = player.pos.y, z = player.pos.z) {
  const half = player.width / 2;
  return {
    min: { x: x - half, y, z: z - half },
    max: { x: x + half, y: y + player.height, z: z + half }
  };
}

function scan(world, minx, miny, minz, maxx, maxy, maxz) {
  const x0 = Math.floor(minx + eps);
  const y0 = Math.floor(miny + eps);
  const z0 = Math.floor(minz + eps);
  const x1 = Math.floor(maxx - eps);
  const y1 = Math.floor(maxy - eps);
  const z1 = Math.floor(maxz - eps);
  for (let y = y0; y <= y1; y++) {
    for (let z = z0; z <= z1; z++) {
      for (let x = x0; x <= x1; x++) {
        if (world.get(x, y, z)) return true;
      }
    }
  }
  return false;
}

function solid(world, area) {
  return scan(
    world,
    area.min.x, area.min.y, area.min.z,
    area.max.x, area.max.y, area.max.z
  );
}

function body(world, player, x = player.pos.x, y = player.pos.y, z = player.pos.z) {
  const half = player.width / 2;
  return scan(
    world,
    x - half, y, z - half,
    x + half, y + player.height, z + half
  );
}

function support(world, player, x = player.pos.x, z = player.pos.z) {
  const half = player.width / 2;
  const x0 = Math.floor(x - half + eps);
  const x1 = Math.floor(x + half - eps);
  const z0 = Math.floor(z - half + eps);
  const z1 = Math.floor(z + half - eps);
  const y0 = Math.floor(player.pos.y - depth);
  const y1 = Math.floor(player.pos.y - eps);

  for (let y = y0; y <= y1; y++) {
    if (y + 1 > player.pos.y + 0.01) continue;
    for (let z = z0; z <= z1; z++) {
      for (let x = x0; x <= x1; x++) {
        if (world.get(x, y, z)) return true;
      }
    }
  }
  return false;
}

function axis(world, player, name, amount) {
  if (!amount) return false;
  let x = player.pos.x;
  let y = player.pos.y;
  let z = player.pos.z;
  if (name === 'x') x += amount;
  if (name === 'y') y += amount;
  if (name === 'z') z += amount;

  if (!body(world, player, x, y, z)) {
    player.pos[name] += amount;
    return false;
  }

  const dir = Math.sign(amount);
  let left = Math.abs(amount);
  while (left > 0.0005) {
    const step = Math.min(left, 0.02) * dir;
    x = player.pos.x;
    y = player.pos.y;
    z = player.pos.z;
    if (name === 'x') x += step;
    if (name === 'y') y += step;
    if (name === 'z') z += step;
    if (body(world, player, x, y, z)) break;
    player.pos[name] += step;
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
}

export { box, move, solid, support };
