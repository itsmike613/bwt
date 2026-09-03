import { diamond, emerald, forge } from '../data/balance.js';

class Generator {
  constructor(id, pos, outputs, holo = false, team = '') {
    this.id = id;
    this.pos = { ...pos };
    this.outputs = outputs.map(item => ({ ...item, left: item.every }));
    this.holo = holo;
    this.team = team;
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

  level(value = 0) {
    if (!this.team) return;
    const tune = forge[Math.max(0, Math.min(forge.length - 1, value))] ?? forge[0];
    for (const item of this.outputs) {
      const every = tune[item.id];
      if (!Number.isFinite(every)) continue;
      item.every = every;
      item.left = Math.min(item.left, every);
    }
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
    const tune = forge[0];
    if (pos) list.push(new Generator(`${team}forge`, pos, [
      { id: 'iron', every: tune.iron },
      { id: 'gold', every: tune.gold }
    ], false, team));
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
