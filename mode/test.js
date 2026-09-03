import assert from 'node:assert/strict';
import { Inventory } from '../core/inventory.js';
import { State } from './state.js';
import { Generator, make } from './generator.js';
import { readFileSync } from 'node:fs';

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

console.log('Milestone 2 state and inventory tests passed');
