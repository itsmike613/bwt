import { diamond, emerald, forge } from '../data/balance.js';

class Generator {
  constructor(id, pos, outputs, holo = false) {
    this.id = id;
    this.pos = { ...pos };
    this.outputs = outputs.map(item => ({ ...item, left: item.every }));
    this.holo = holo;
  }

  tick(dt, spawn = null) {
    for (const item of this.outputs) {
      item.left -= dt;
      if (!spawn) {
        item.left = Math.max(0, item.left);
        continue;
      }
      while (item.left <= 0) {
        item.left += item.every;
        spawn(this, item);
      }
    }
  }

  clock(id, left) {
    const item = this.outputs.find(item => item.id === id);
    if (item) item.left = left;
  }

  dump() {
    return this.outputs.map(item => ({ id: item.id, left: item.left }));
  }
}

function many(value) {
  return Array.isArray(value) ? value : [];
}

function make(markers) {
  const list = [];
  for (const team of ['red', 'blue']) {
    const pos = markers?.[team]?.forge;
    if (pos) list.push(new Generator(`${team}forge`, pos, [
      { id: 'iron', every: forge.iron },
      { id: 'gold', every: forge.gold }
    ]));
  }
  many(markers?.diamond).forEach((pos, index) => {
    list.push(new Generator(`diamond${index}`, pos, [{ id: 'diamond', every: diamond }], true));
  });
  many(markers?.emerald).forEach((pos, index) => {
    list.push(new Generator(`emerald${index}`, pos, [{ id: 'emerald', every: emerald }], true));
  });
  return list;
}

export { Generator, make };
