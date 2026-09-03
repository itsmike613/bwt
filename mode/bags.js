import { Inventory } from '../core/inventory.js';

class Bags {
  constructor(room) {
    this.items = new Map();
    for (const player of Object.values(room?.players ?? {})) {
      const bag = new Inventory();
      bag.add('swordwood', 1);
      this.items.set(player.uid, bag);
    }
  }

  get(uid) {
    return this.items.get(uid) ?? null;
  }

  has(uid, id, count = 1) {
    return (this.get(uid)?.count(id) ?? 0) >= count;
  }

  add(uid, id, count = 1) {
    const bag = this.get(uid);
    return bag ? bag.add(id, count) : count;
  }

  remove(uid, id, count = 1) {
    return this.get(uid)?.remove(id, count) ?? false;
  }

  death(uid) {
    return this.get(uid)?.death() ?? { diamond: 0, emerald: 0 };
  }
}

export { Bags };
