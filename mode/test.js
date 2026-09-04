import assert from 'node:assert/strict';
import { Inventory } from '../core/inventory.js';
import { State } from './state.js';
import { Generator, make } from './generator.js';
import { readFileSync } from 'node:fs';
import { World } from '../core/world.js';
import { time as minetime } from './mine.js';
import { aim, damage, knock, reach } from './fight.js';
import { blocks as blast } from './blast.js';
import { Bags } from './bags.js';
import { Economy } from './economy.js';
import { shop } from '../data/balance.js';
import { target } from './interact.js';

function room() {
  return {
    players: {
      red: { uid: 'red', team: 'red' },
      blue: { uid: 'blue', team: 'blue' }
    }
  };
}

{
  const inv = new Inventory();
  assert.equal(inv.slots.length, 36);
  assert.equal(inv.add('iron', 70), 0);
  assert.deepEqual(inv.slots[0], { id: 'iron', count: 64 });
  assert.deepEqual(inv.slots[1], { id: 'iron', count: 6 });
  inv.select(1);
  assert.equal(inv.slot().count, 6);
  assert.equal(inv.remove('iron', 65), true);
  assert.deepEqual(inv.slots[0], null);
  assert.deepEqual(inv.slots[1], { id: 'iron', count: 5 });
  inv.swap(1, 9);
  assert.deepEqual(inv.slots[9], { id: 'iron', count: 5 });
  inv.clear();
  assert.equal(inv.slots.every(slot => slot === null), true);
}

{
  const state = new State(room());
  assert.equal(state.players.red.health, 20);
  assert.equal(state.hurt('red', 5).health, 15);
  const death = state.die('red');
  assert.equal(death.mode, 'wait');
  assert.equal(state.players.red.dead, true);
  assert.equal(state.players.red.out, false);
  assert.equal(state.respawn('red'), true);
  assert.equal(state.players.red.health, 20);
  assert.equal(state.break('red', 'red'), false);
  assert.equal(state.break('red', 'blue'), true);
  assert.equal(state.breakers.red, 'blue');
  const out = state.die('red');
  assert.equal(out.mode, 'out');
  assert.equal(state.players.red.out, true);
  assert.equal(state.winner, 'blue');
}

{
  const state = new State({
    players: {
      red1: { uid: 'red1', team: 'red' },
      red2: { uid: 'red2', team: 'red' },
      blue: { uid: 'blue', team: 'blue' }
    }
  });
  state.break('red', 'blue');
  state.die('red1');
  assert.equal(state.winner, null);
  state.die('red2');
  assert.equal(state.winner, 'blue');
}

{
  const gen = new Generator('test', { x: 0, y: 1, z: 0 }, [
    { id: 'iron', every: 2 },
    { id: 'gold', every: 8 }
  ]);
  const out = [];
  gen.tick(2, (base, item) => out.push([base.id, item.id]));
  assert.deepEqual(out, [['test', 'iron']]);
  gen.tick(6, (base, item) => out.push([base.id, item.id]));
  assert.equal(out.filter(item => item[1] === 'iron').length, 4);
  assert.equal(out.filter(item => item[1] === 'gold').length, 1);
}

{
  const list = make({
    red: { forge: { x: 0, y: 1, z: 0 } },
    blue: { forge: { x: 10, y: 1, z: 0 } },
    diamond: [{ x: 5, y: 1, z: -5 }, { x: 5, y: 1, z: 5 }],
    emerald: [{ x: 5, y: 1, z: 0 }]
  });
  assert.equal(list.length, 5);
  assert.equal(list.filter(item => item.id.includes('forge')).length, 2);
  assert.equal(list.filter(item => item.holo).length, 3);
  assert.equal(list.find(item => item.id === 'redforge').outputs.length, 2);
}


{
  const data = JSON.parse(readFileSync(new URL('../data/map.json', import.meta.url), 'utf8'));
  const mark = data.markers;
  assert.ok(mark.red?.spawn && mark.blue?.spawn);
  assert.ok(mark.red?.bed && mark.blue?.bed);
  assert.ok(mark.red?.forge && mark.blue?.forge);
  assert.ok(mark.red?.item && mark.blue?.item);
  assert.ok(mark.red?.island && mark.blue?.island);
  assert.ok(mark.spectator);
  assert.ok(Array.isArray(mark.diamond) && mark.diamond.length > 0);
  assert.ok(Array.isArray(mark.emerald) && mark.emerald.length > 0);
}


{
  const inv = new Inventory();
  inv.add('pickaxe', 1);
  inv.add('axe', 1);
  inv.add('shears', 1);
  inv.add('sworddiamond', 1);
  inv.add('diamond', 4);
  inv.add('emerald', 2);
  inv.add('iron', 20);
  inv.add('wool', 16);
  const loot = inv.death();
  assert.deepEqual(loot, { diamond: 4, emerald: 2 });
  assert.equal(inv.count('pickaxe'), 1);
  assert.equal(inv.count('axe'), 1);
  assert.equal(inv.count('shears'), 1);
  assert.equal(inv.count('sworddiamond'), 0);
  assert.equal(inv.count('swordwood'), 1);
  assert.equal(inv.count('diamond'), 0);
  assert.equal(inv.count('emerald'), 0);
  assert.equal(inv.count('iron'), 0);
  assert.equal(inv.count('wool'), 0);
}

{
  const bags = new Bags(room());
  assert.equal(bags.has('red', 'swordwood'), true);
  bags.add('red', 'diamond', 3);
  bags.add('red', 'emerald', 1);
  const loot = bags.death('red');
  assert.deepEqual(loot, { diamond: 3, emerald: 1 });
  assert.equal(bags.has('red', 'swordwood'), true);
}

{
  assert.ok(minetime(2, 'shears') < minetime(2, 'pickaxe'));
  assert.ok(minetime(3, 'axe') < minetime(3, 'swordwood'));
  assert.ok(minetime(4, 'pickaxe') < minetime(4, 'axe'));
  assert.ok(minetime(5, 'pickaxe') > minetime(4, 'pickaxe'));
  assert.equal(damage('swordwood'), 4);
  assert.equal(damage('swordiron'), 6);
  assert.equal(damage('sworddiamond'), 7);
  assert.equal(damage('wool'), 1);
  const a = { x: 0, y: 1, z: 0, yaw: 0, pitch: 0 };
  const front = { x: 0, y: 1, z: -2 };
  const back = { x: 0, y: 1, z: 2 };
  assert.equal(reach(a, front), true);
  assert.ok(aim(a, front) > 0.9);
  assert.ok(aim(a, back) < -0.9);
  const force = knock(a, front);
  assert.ok(force.z < 0 && force.y > 0);
}

{
  const world = new World();
  world.set(0, 0, 0, 2, 1);
  world.set(1, 0, 0, 2, 2);
  world.set(2, 0, 0, 3, 2);
  world.set(3, 0, 0, 4, 2);
  world.set(4, 0, 0, 5, 2);
  const list = blast(world, { x: 2.5, y: 0.5, z: 0.5 }, 5, 4);
  assert.equal(list.some(item => item.x === 0), false, 'original map blocks must never be blast-breakable');
  assert.equal(list.some(item => item.x === 1), true);
  assert.equal(list.some(item => item.x === 2), true);
  assert.equal(list.some(item => item.x === 3), true);
  assert.equal(list.some(item => item.x === 4), false, 'Obsidian must resist normal V1 explosions');
}

{
  const skin = readFileSync(new URL('../core/skin.js', import.meta.url), 'utf8');
  const actors = readFileSync(new URL('./actors.js', import.meta.url), 'utf8');
  assert.equal(skin.includes('transparent: true, alphaTest'), false, 'skin cutouts should not use sorted transparent materials');
  assert.ok(skin.includes('alphaTest: 0.5'));
  assert.ok(actors.includes('face(data.yaw'));
  assert.ok(actors.includes('actor.model.group.visible = actor.alive'));
}



{
  const state = new State(room());
  assert.equal(state.players.red.armor, 'leather');
  assert.equal(state.hurt('red', 4).damage, 4, 'Leather should preserve the accepted Wooden Sword baseline damage after rounding');
  state.players.red.health = 20;
  assert.equal(state.arm('red', 'iron'), true);
  assert.equal(state.hurt('red', 4).damage, 3);
  state.die('red');
  state.respawn('red');
  assert.equal(state.players.red.armor, 'iron', 'armor must persist through death');
  assert.equal(state.arm('red', 'diamond'), true);
  assert.equal(state.arm('red', 'iron'), false, 'armor must not downgrade');
}

{
  const state = new State(room());
  state.players.red.health = 10;
  assert.equal(state.eat('red'), true);
  assert.equal(state.eat('red'), false, 'Golden Apple regeneration must not stack');
  assert.equal(state.tick(1.01), true);
  assert.equal(state.players.red.health, 11);
  state.tick(30);
  assert.equal(state.players.red.regen, 0);
  assert.equal(state.eat('red'), true, 'another Golden Apple may be eaten after regeneration ends');
}

{
  const bags = new Bags(room());
  const state = new State(room());
  const economy = new Economy(bags, state);
  const bag = bags.get('red');
  bag.add('iron', 64);
  bag.add('iron', 64);
  bag.add('gold', 64);
  bag.add('emerald', 32);
  bag.add('diamond', 16);

  assert.equal(economy.buy('red', 'wool').ok, true);
  assert.equal(bag.count('wool'), 16);
  assert.equal(economy.buy('red', 'wood').ok, true);
  assert.equal(bag.count('wood'), 16);
  assert.equal(economy.buy('red', 'end').ok, true);
  assert.equal(bag.count('end'), 12);
  assert.equal(economy.buy('red', 'obsidian').ok, true);
  assert.equal(bag.count('obsidian'), 4);

  for (const id of ['pickaxe', 'axe', 'shears']) assert.equal(economy.buy('red', id).ok, true);
  assert.equal(economy.buy('red', 'pickaxe').code, 'owned');

  assert.equal(economy.buy('red', 'swordiron').ok, true);
  assert.equal(bag.count('swordwood'), 0);
  assert.equal(bag.count('swordiron'), 1);
  assert.equal(economy.buy('red', 'sworddiamond').ok, true);
  assert.equal(bag.count('swordiron'), 0);
  assert.equal(bag.count('sworddiamond'), 1);

  assert.equal(economy.buy('red', 'ironarmor').ok, true);
  assert.equal(state.players.red.armor, 'iron');
  assert.equal(economy.buy('red', 'diamondarmor').ok, true);
  assert.equal(state.players.red.armor, 'diamond');

  for (const id of ['apple', 'tnt', 'fireball']) assert.equal(economy.buy('red', id).ok, true);
  assert.equal(bag.count('apple'), 1);
  assert.equal(bag.count('tnt'), 1);
  assert.equal(bag.count('fireball'), 1);

  assert.equal(economy.forge('red', 'forge2').code, 'order');
  assert.equal(economy.forge('red', 'forge1').ok, true);
  assert.equal(state.forge.red, 1);
  assert.equal(economy.forge('red', 'forge2').ok, true);
  assert.equal(state.forge.red, 2);
  assert.equal(state.forge.blue, 0);

  bags.death('red');
  assert.equal(bag.count('pickaxe'), 1);
  assert.equal(bag.count('axe'), 1);
  assert.equal(bag.count('shears'), 1);
  assert.equal(bag.count('sworddiamond'), 0);
  assert.equal(bag.count('swordwood'), 1);
  assert.equal(bag.count('apple'), 0);
  assert.equal(bag.count('tnt'), 0);
  assert.equal(bag.count('fireball'), 0);
  assert.equal(state.players.red.armor, 'diamond');
}

{
  const required = ['wool', 'wood', 'end', 'obsidian', 'swordwood', 'swordiron', 'sworddiamond', 'leather', 'ironarmor', 'diamondarmor', 'pickaxe', 'axe', 'shears', 'apple', 'tnt', 'fireball'];
  for (const id of required) assert.ok(shop.item[id], `missing centralized Item Shop entry for ${id}`);
  assert.deepEqual(Object.keys(shop.forge), ['forge1', 'forge2']);
  const currencies = new Set(Object.values(shop.item).map(entry => entry.cost).filter(Boolean));
  for (const id of ['iron', 'gold', 'emerald']) assert.equal(currencies.has(id), true);
  assert.equal(Object.values(shop.forge).every(entry => entry.cost === 'diamond'), true);
}

{
  const list = make({
    red: { forge: { x: 0, y: 1, z: 0 } },
    blue: { forge: { x: 10, y: 1, z: 0 } },
    diamond: [{ x: 5, y: 1, z: -5 }],
    emerald: [{ x: 5, y: 1, z: 5 }]
  });
  const gen = list.find(item => item.id === 'redforge');
  gen.level(1);
  assert.equal(gen.outputs.find(item => item.id === 'iron').every, 1.5);
  assert.equal(gen.outputs.find(item => item.id === 'gold').every, 6);
  gen.level(2);
  assert.equal(gen.outputs.find(item => item.id === 'iron').every, 1);
  assert.equal(gen.outputs.find(item => item.id === 'gold').every, 4);
}


{
  const markers = {
    red: {
      item: { x: 0, y: 0, z: -2 },
      island: { x: 3, y: 0, z: -2 }
    }
  };
  const pos = { x: 0.5, y: 0, z: 0.5 };
  const origin = { x: 0.5, y: 1.62, z: 0.5 };
  const direct = { x: 0, y: 0, z: -1 };
  const away = { x: 1, y: 0, z: 0 };
  assert.equal(target(origin, direct, pos, 'red', markers, shop.reach)?.kind, 'item', 'aiming directly at a shop within range should target it');
  assert.equal(target(origin, away, pos, 'red', markers, shop.reach), null, 'aiming away while near a shop should not target it');
  assert.equal(target(origin, direct, pos, 'red', markers, shop.reach, 1), null, 'a nearer block should occlude a shop');
  assert.equal(target(origin, direct, { x: 0.5, y: 0, z: 3.5 }, 'red', markers, shop.reach), null, 'an out-of-range shop should not target');
}


{
  const state = new State(room());
  state.score('blue', 'red');
  assert.deepEqual(state.stats.red, { kills: 1, deaths: 0, beds: 0 });
  assert.deepEqual(state.stats.blue, { kills: 0, deaths: 1, beds: 0 });
  assert.equal(state.break('blue', 'red'), true);
  assert.equal(state.stats.red.beds, 1, 'bed breaks are recorded in match statistics');
  assert.equal(state.leave('blue'), true, 'disconnected player can be removed from active match state');
  assert.equal(state.players.blue.out, true);
  assert.equal(state.winner, 'red', 'a departed last enemy cannot block the win condition');
}

{
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
  const arena = readFileSync(new URL('./arena.js', import.meta.url), 'utf8');
  assert.ok(html.includes('id="shop"'));
  assert.ok(html.includes('id="shoptabs"'));
  assert.ok(css.includes('backdrop-filter: blur(3px)'));
  assert.ok(arena.includes("data.kind === 'buy'"));
  assert.ok(arena.includes("data.kind === 'forge'"));
  assert.ok(arena.includes("data.kind === 'eat'"));
  assert.ok(arena.includes('this.shop.hit(camera'), 'shop opening should require a crosshair hit');
  assert.ok(html.includes('id="chatinput"'));
  assert.ok(html.includes('id="victory"'));
  assert.ok(html.includes('id="endgame"'));
  assert.ok(arena.includes("kind: 'chat'"));
  assert.ok(arena.includes('/^\\/shout'));
  assert.ok(arena.includes('this.victory.open'));
  assert.ok(arena.includes('this.state.score(uid, killer)'));
  assert.equal(arena.includes('this.shop.near(this.player.pos'), false, 'proximity-only shop opening must stay removed');
}

console.log('Milestone 5 multiplayer plus Milestone 4 economy/interaction regression tests passed');
