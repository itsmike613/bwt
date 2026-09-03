import { item } from '../data/item.js';

class Inventory {
  constructor() {
    this.slots = Array.from({ length: 36 }, () => null);
    this.pick = 0;
  }

  select(index) {
    if (Number.isInteger(index) && index >= 0 && index < 9) this.pick = index;
    return this.pick;
  }

  slot(index = this.pick) {
    return this.slots[index] ?? null;
  }

  count(id) {
    let total = 0;
    for (const slot of this.slots) if (slot?.id === id) total += slot.count;
    return total;
  }

  fit(id, count = 1) {
    const def = item(id);
    if (!def || count <= 0) return false;
    let room = 0;
    for (const slot of this.slots) {
      if (!slot) room += def.stack;
      else if (slot.id === id) room += Math.max(0, def.stack - slot.count);
      if (room >= count) return true;
    }
    return room >= count;
  }

  add(id, count = 1) {
    const def = item(id);
    if (!def || count <= 0) return count;
    let left = count;
    for (const slot of this.slots) {
      if (!slot || slot.id !== id || slot.count >= def.stack) continue;
      const room = def.stack - slot.count;
      const take = Math.min(room, left);
      slot.count += take;
      left -= take;
      if (!left) return 0;
    }
    for (let i = 0; i < this.slots.length && left; i++) {
      if (this.slots[i]) continue;
      const take = Math.min(def.stack, left);
      this.slots[i] = { id, count: take };
      left -= take;
    }
    return left;
  }

  take(index = this.pick, count = 1) {
    const slot = this.slots[index];
    if (!slot || count <= 0) return false;
    slot.count -= count;
    if (slot.count <= 0) this.slots[index] = null;
    return true;
  }

  remove(id, count = 1) {
    let left = count;
    for (let i = 0; i < this.slots.length && left; i++) {
      const slot = this.slots[i];
      if (!slot || slot.id !== id) continue;
      const take = Math.min(slot.count, left);
      slot.count -= take;
      left -= take;
      if (!slot.count) this.slots[i] = null;
    }
    return left === 0;
  }

  swap(a, b) {
    if (a === b || a < 0 || b < 0 || a >= 36 || b >= 36) return false;
    [this.slots[a], this.slots[b]] = [this.slots[b], this.slots[a]];
    return true;
  }

  clear() {
    this.slots.fill(null);
  }

  load(data = []) {
    this.slots = Array.from({ length: 36 }, (_, i) => {
      const slot = data[i];
      const def = slot ? item(slot.id) : null;
      if (!def) return null;
      const count = Math.max(1, Math.min(def.stack, Math.floor(slot.count ?? 1)));
      return { id: def.id, count };
    });
  }

  death() {
    const loot = {
      diamond: this.count('diamond'),
      emerald: this.count('emerald')
    };
    const keep = this.slots.filter(slot => slot && item(slot.id)?.persist).map(slot => ({ ...slot }));
    this.clear();
    for (const slot of keep) this.add(slot.id, slot.count);
    this.add('swordwood', 1);
    this.pick = 0;
    return loot;
  }

  dump() {
    return this.slots.map(slot => slot ? { ...slot } : null);
  }
}

export { Inventory };
