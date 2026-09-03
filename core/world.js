const size = 16;
const volume = size * size * size;

function div(value) {
  return Math.floor(value / size);
}

function mod(value) {
  return ((value % size) + size) % size;
}

function key(x, y, z) {
  return `${x},${y},${z}`;
}

function slot(x, y, z) {
  return x + size * (z + size * y);
}

class Chunk {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.data = new Uint8Array(volume);
    this.kind = new Uint8Array(volume);
    this.dirty = true;
    this.group = null;
  }
}

class World {
  constructor() {
    this.chunks = new Map();
  }

  chunk(x, y, z, create = false) {
    const cx = div(x);
    const cy = div(y);
    const cz = div(z);
    const id = key(cx, cy, cz);
    let chunk = this.chunks.get(id);
    if (!chunk && create) {
      chunk = new Chunk(cx, cy, cz);
      this.chunks.set(id, chunk);
    }
    return chunk ?? null;
  }

  get(x, y, z) {
    const chunk = this.chunk(x, y, z);
    if (!chunk) return 0;
    return chunk.data[slot(mod(x), mod(y), mod(z))];
  }

  kind(x, y, z) {
    const chunk = this.chunk(x, y, z);
    if (!chunk) return 0;
    return chunk.kind[slot(mod(x), mod(y), mod(z))];
  }

  set(x, y, z, id, kind = 1) {
    const chunk = this.chunk(x, y, z, true);
    const index = slot(mod(x), mod(y), mod(z));
    chunk.data[index] = id;
    chunk.kind[index] = id ? kind : 0;
    this.touch(x, y, z);
  }

  del(x, y, z) {
    this.set(x, y, z, 0, 0);
  }

  touch(x, y, z) {
    const chunk = this.chunk(x, y, z);
    if (chunk) chunk.dirty = true;
    const lx = mod(x);
    const ly = mod(y);
    const lz = mod(z);
    if (lx === 0) this.mark(div(x) - 1, div(y), div(z));
    if (lx === size - 1) this.mark(div(x) + 1, div(y), div(z));
    if (ly === 0) this.mark(div(x), div(y) - 1, div(z));
    if (ly === size - 1) this.mark(div(x), div(y) + 1, div(z));
    if (lz === 0) this.mark(div(x), div(y), div(z) - 1);
    if (lz === size - 1) this.mark(div(x), div(y), div(z) + 1);
  }

  mark(x, y, z) {
    const chunk = this.chunks.get(key(x, y, z));
    if (chunk) chunk.dirty = true;
  }

  each(run) {
    for (const chunk of this.chunks.values()) run(chunk);
  }

  clear() {
    for (const chunk of this.chunks.values()) {
      if (!chunk.group) continue;
      chunk.group.parent?.remove(chunk.group);
      chunk.group.traverse(node => {
        if (node.geometry) node.geometry.dispose();
      });
    }
    this.chunks.clear();
  }
}

export { World, size };
