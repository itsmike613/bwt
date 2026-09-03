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

console.log('Milestone 3 state, combat, mining, and inventory tests passed');
