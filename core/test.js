import { World } from './world.js';
import { write, read } from './map.js';
import { Build } from './build.js';

function assert(value, message) {
  if (!value) throw new Error(message);
}

const world = new World();
world.set(0, 0, 0, 1, 1);
world.set(16, -1, -16, 2, 2);
assert(world.get(0, 0, 0) === 1, 'origin block');
assert(world.kind(16, -1, -16) === 2, 'provenance');

const build = new Build(world);
assert(build.break({ x: 0, y: 0, z: 0 }, false) === false, 'map protection');
assert(world.get(0, 0, 0) === 1, 'protected block remains');
assert(build.break({ x: 16, y: -1, z: -16 }, false) === true, 'placed break');
assert(world.get(16, -1, -16) === 0, 'placed block removed');
world.set(16, -1, -16, 2, 2);

const markers = {
  red: { spawn: { x: 1, y: 2, z: 3 } },
  diamond: [{ x: 4, y: 5, z: 6 }, { x: -4, y: 5, z: -6 }]
};
const data = write(world, markers);
const copy = new World();
const marks = read(copy, data);
assert(copy.get(16, -1, -16) === 2, 'round trip block');
assert(copy.kind(16, -1, -16) === 1, 'loaded blocks become map blocks');
assert(marks.red.spawn.x === 1, 'round trip marker');
assert(marks.diamond.length === 2, 'repeating generator markers');
console.log('core tests passed');
