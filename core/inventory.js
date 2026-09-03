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

  dump() {
    return this.slots.map(slot => slot ? { ...slot } : null);
  }
}

export { Inventory };
