import { item, list } from '../data/item.js';
import { armor, shop } from '../data/balance.js';

const weapons = list.filter(def => def.kind === 'weapon').map(def => def.id);

function event(action, uid, id, count = 1) {
  return { action, uid, item: id, count };
}

class Economy {
  constructor(bags, state) {
    this.bags = bags;
    this.state = state;
  }

  buy(uid, id) {
    const bag = this.bags.get(uid);
    const def = item(id);
    const tune = shop.item[id];
    if (!bag || !def || !tune) return { ok: false, code: 'item' };
    if (!tune.cost || tune.price <= 0) return { ok: false, code: 'default' };
    if (bag.count(tune.cost) < tune.price) return { ok: false, code: 'funds' };

    if (def.kind === 'tool') {
      if (bag.count(id)) return { ok: false, code: 'owned' };
      if (!bag.fit(id, tune.count)) return { ok: false, code: 'space' };
      bag.remove(tune.cost, tune.price);
      bag.add(id, tune.count);
      return { ok: true, bag: [event('remove', uid, tune.cost, tune.price), event('add', uid, id, tune.count)] };
    }

    if (def.kind === 'armor') {
      const player = this.state.players[uid];
      const now = armor[player?.armor];
      const next = armor[def.tier];
      if (!player || !now || !next || next.rank <= now.rank) return { ok: false, code: 'owned' };
      bag.remove(tune.cost, tune.price);
      this.state.arm(uid, def.tier);
      return { ok: true, state: true, bag: [event('remove', uid, tune.cost, tune.price)] };
    }

    if (def.kind === 'weapon') {
      const current = weapons.map(key => item(key)).find(weapon => bag.count(weapon.id));
      if (current && def.rank <= current.rank) return { ok: false, code: 'owned' };
      if (!current && !bag.fit(id, 1)) return { ok: false, code: 'space' };
      bag.remove(tune.cost, tune.price);
      const changes = [event('remove', uid, tune.cost, tune.price)];
      if (current) {
        bag.remove(current.id, 1);
        changes.push(event('remove', uid, current.id, 1));
      }
      bag.add(id, 1);
      changes.push(event('add', uid, id, 1));
      return { ok: true, bag: changes };
    }

    if (!bag.fit(id, tune.count)) return { ok: false, code: 'space' };
    bag.remove(tune.cost, tune.price);
    bag.add(id, tune.count);
    return { ok: true, bag: [event('remove', uid, tune.cost, tune.price), event('add', uid, id, tune.count)] };
  }

  forge(uid, id) {
    const bag = this.bags.get(uid);
    const tune = shop.forge[id];
    const team = this.state.teams[uid];
    if (!bag || !tune || !team) return { ok: false, code: 'item' };
    if (this.state.forge[team] >= tune.level) return { ok: false, code: 'owned' };
    if (tune.level !== this.state.forge[team] + 1) return { ok: false, code: 'order' };
    if (bag.count(tune.cost) < tune.price) return { ok: false, code: 'funds' };
    bag.remove(tune.cost, tune.price);
    if (!this.state.upgrade(team, tune.level)) return { ok: false, code: 'order' };
    return { ok: true, state: true, bag: [event('remove', uid, tune.cost, tune.price)] };
  }
}

export { Economy };
