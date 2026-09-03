function write(world, markers = {}) {
  const blocks = [];
  world.each(chunk => {
    const size = 16;
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        for (let x = 0; x < size; x++) {
          const wx = chunk.x * size + x;
          const wy = chunk.y * size + y;
          const wz = chunk.z * size + z;
          const id = world.get(wx, wy, wz);
          if (id) blocks.push({ x: wx, y: wy, z: wz, id });
        }
      }
    }
  });
  blocks.sort((a, b) => a.y - b.y || a.z - b.z || a.x - b.x);
  return { version: 1, blocks, markers };
}

function read(world, data) {
  if (!data || data.version !== 1 || !Array.isArray(data.blocks)) throw new Error('Unsupported map format.');
  world.clear();
  for (const block of data.blocks) {
    if (!Number.isInteger(block.x) || !Number.isInteger(block.y) || !Number.isInteger(block.z) || !Number.isInteger(block.id)) continue;
    world.set(block.x, block.y, block.z, block.id, 1);
  }
  return data.markers && typeof data.markers === 'object' ? data.markers : {};
}

export { read, write };
