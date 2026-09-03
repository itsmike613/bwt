import { World } from './world.js';
import { write, read } from './map.js';
import { Build } from './build.js';
import { Player } from './player.js';
import { wish } from './motion.js';
import { move as tune } from '../data/tune.js';

function assert(value, message) {
  if (!value) throw new Error(message);
}

function close(value, target, span = 0.03) {
  return Math.abs(value - target) <= span;
}

class Keys {
  constructor() {
    this.keys = new Set();
    this.down = new Set();
    this.x = 0;
    this.y = 0;
  }

  held(code) {
    return this.keys.has(code);
  }

  press(code) {
    return this.down.has(code);
  }

  mouse() {
    const move = { x: this.x, y: this.y };
    this.x = 0;
    this.y = 0;
    return move;
  }

  aim(x, y) {
    this.x += x;
    this.y += y;
  }

  hold(code) {
    this.keys.add(code);
  }

  lift(code) {
    this.keys.delete(code);
  }

  tap(code) {
    this.keys.add(code);
    this.down.add(code);
  }

  clear() {
    this.down.clear();
  }
}

function camera() {
  return {
    position: {
      x: 0,
      y: 0,
      z: 0,
      set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
      }
    },
    rotation: { order: 'YXZ', x: 0, y: 0 }
  };
}

function floor(world, min = -8, max = 8) {
  for (let z = min; z <= max; z++) {
    for (let x = min; x <= max; x++) world.set(x, 0, z, 1, 1);
  }
}

function step(player, input, count = 1, dt = 1 / 60) {
  for (let i = 0; i < count; i++) {
    player.tick(dt);
    input.clear();
  }
}

function make(world, creative = false) {
  const input = new Keys();
  const player = new Player(world, input, camera(), creative);
  player.spawn(0.5, 1.001, 0.5);
  return { input, player };
}

function double(player, input) {
  input.tap('Space');
  step(player, input);
  input.lift('Space');
  step(player, input, 5);
  input.tap('Space');
  step(player, input);
  input.lift('Space');
  step(player, input);
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



const empty = new World();
empty.del(99, 99, 99);
assert(empty.chunks.size === 0, 'deleting empty space does not allocate an empty chunk');

const dirty = new World();
dirty.set(0, 0, 0, 1, 1);
let rebuilds = 0;
dirty.flush(chunk => {
  rebuilds++;
  chunk.dirty = false;
});
assert(rebuilds === 1, 'new voxel dirties its chunk once');
dirty.set(0, 0, 0, 1, 1);
dirty.flush(() => rebuilds++);
assert(rebuilds === 1, 'setting identical voxel data does not dirty/remesh a chunk');
dirty.set(0, 0, 0, 1, 2);
dirty.flush(() => rebuilds++);
assert(rebuilds === 1, 'provenance-only changes do not dirty visual geometry');
dirty.set(15, 0, 0, 1, 1);
dirty.set(16, 0, 0, 1, 1);
dirty.flush(chunk => {
  rebuilds++;
  chunk.dirty = false;
});
const beforeedge = rebuilds;
dirty.del(15, 0, 0);
dirty.flush(chunk => {
  rebuilds++;
  chunk.dirty = false;
});
assert(rebuilds - beforeedge === 2, 'boundary occupancy changes dirty both affected chunks only');

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

const dir = { x: 0, z: 0 };
wish(0, 1, 0, dir);
assert(close(dir.x, 0) && close(dir.z, -1), 'yaw 0 W faces -Z');
wish(0, -1, 0, dir);
assert(close(dir.x, 0) && close(dir.z, 1), 'yaw 0 S faces +Z');
wish(0, 0, -1, dir);
assert(close(dir.x, -1) && close(dir.z, 0), 'yaw 0 A faces -X');
wish(0, 0, 1, dir);
assert(close(dir.x, 1) && close(dir.z, 0), 'yaw 0 D faces +X');
wish(Math.PI / 2, 1, 0, dir);
assert(close(dir.x, -1) && close(dir.z, 0), 'yaw +90 W faces -X');
wish(Math.PI / 2, 0, 1, dir);
assert(close(dir.x, 0) && close(dir.z, -1), 'yaw +90 D faces -Z');
wish(Math.PI, 1, 0, dir);
assert(close(dir.x, 0) && close(dir.z, 1), 'yaw 180 W faces +Z');
wish(-Math.PI / 2, 1, 0, dir);
assert(close(dir.x, 1) && close(dir.z, 0), 'yaw -90 W faces +X');

const ground = new World();
floor(ground);
const moves = [
  [0, 'KeyW', 'z', -1], [0, 'KeyS', 'z', 1], [0, 'KeyA', 'x', -1], [0, 'KeyD', 'x', 1],
  [Math.PI / 2, 'KeyW', 'x', -1], [Math.PI / 2, 'KeyS', 'x', 1], [Math.PI / 2, 'KeyA', 'z', 1], [Math.PI / 2, 'KeyD', 'z', -1],
  [Math.PI, 'KeyW', 'z', 1], [Math.PI, 'KeyS', 'z', -1], [Math.PI, 'KeyA', 'x', 1], [Math.PI, 'KeyD', 'x', -1],
  [-Math.PI / 2, 'KeyW', 'x', 1], [-Math.PI / 2, 'KeyS', 'x', -1], [-Math.PI / 2, 'KeyA', 'z', -1], [-Math.PI / 2, 'KeyD', 'z', 1]
];
for (const [yaw, key, axis, sign] of moves) {
  const test = make(ground);
  test.player.yaw = yaw;
  test.input.hold(key);
  step(test.player, test.input, 30);
  test.input.lift(key);
  const delta = test.player.pos[axis] - 0.5;
  assert(delta * sign > 1, `${key} follows yaw ${yaw}`);
}

const look = make(ground);
look.input.aim(100, -50);
look.player.frame(1);
assert(close(look.player.yaw, -100 * tune.mouse, 0.0001), 'mouse yaw updates on render frame');
assert(close(look.player.pitch, 50 * tune.mouse, 0.0001), 'mouse pitch updates on render frame');
assert(close(look.player.camera.rotation.y, look.player.yaw, 0.0001), 'camera receives render-frame look');

floor(ground);
const first = make(ground);
assert(first.player.ground, 'player starts grounded');
first.input.hold('KeyW');
step(first.player, first.input, 60);
first.input.lift('KeyW');
assert(first.player.pos.z < -2.5 && close(first.player.pos.x, 0.5, 0.08), 'W moves with camera at yaw 0');
assert(first.player.ground && close(first.player.pos.y, 1.001, 0.03), 'walking stays on ground');

const turn = make(ground);
turn.player.yaw = Math.PI / 2;
turn.input.hold('KeyW');
step(turn.player, turn.input, 60);
turn.input.lift('KeyW');
assert(turn.player.pos.x < -2.5 && close(turn.player.pos.z, 0.5, 0.08), 'W rotates with camera yaw');

const jump = make(ground);
jump.input.tap('Space');
step(jump.player, jump.input);
jump.input.lift('Space');
assert(jump.player.vel.y > 0 && jump.player.pos.y > 1.001, 'jump leaves ground upward');
step(jump.player, jump.input, 120);
assert(jump.player.ground && close(jump.player.pos.y, 1.001, 0.03), 'jump lands on blocks');



const holdjump = new World();
floor(holdjump, -48, 8);
const repeat = make(holdjump);
repeat.input.hold('Space');
let leaps = 0;
let oldvel = repeat.player.vel.y;
for (let i = 0; i < 300; i++) {
  repeat.player.tick(1 / 60);
  repeat.input.clear();
  if (oldvel <= 0 && repeat.player.vel.y > 0) leaps++;
  oldvel = repeat.player.vel.y;
}
repeat.input.lift('Space');
assert(leaps >= 5, 'holding Space repeatedly jumps after each landing');

const buffered = make(ground);
buffered.player.pos.y = 1.35;
buffered.player.prev.y = 1.35;
buffered.player.ground = false;
buffered.player.vel.y = -3;
buffered.input.tap('Space');
step(buffered.player, buffered.input);
buffered.input.lift('Space');
let bufferedjump = false;
for (let i = 0; i < 10; i++) {
  buffered.player.tick(1 / 60);
  buffered.input.clear();
  if (buffered.player.vel.y > 0) bufferedjump = true;
}
assert(bufferedjump, 'jump buffer preserves a jump pressed shortly before landing');


const flatrun = new World();
floor(flatrun, -64, 8);
const flat = make(flatrun);
flat.input.hold('KeyW');
flat.input.hold('ControlLeft');
flat.input.hold('Space');
let flatjumps = 0;
oldvel = flat.player.vel.y;
for (let i = 0; i < 360; i++) {
  flat.player.tick(1 / 60);
  flat.input.clear();
  if (oldvel <= 0 && flat.player.vel.y > 0) flatjumps++;
  oldvel = flat.player.vel.y;
}
flat.input.lift('KeyW');
flat.input.lift('ControlLeft');
flat.input.lift('Space');
assert(flatjumps >= 7 && flat.player.pos.z < -25, 'continuous sprint-jumping crosses flat terrain');

const ledge = new World();
for (let z = -4; z <= 4; z++) {
  for (let x = -2; x <= 2; x++) ledge.set(x, 0, z, 1, 1);
}
for (let z = -2; z <= 0; z++) {
  for (let x = -1; x <= 1; x++) ledge.set(x, 1, z, 1, 1);
}
const landing = make(ledge);
landing.player.pos.z = -0.5;
landing.player.prev.z = -0.5;
landing.player.pos.y = 4;
landing.player.prev.y = 4;
landing.player.ground = false;
step(landing.player, landing.input, 180);
assert(landing.player.ground && close(landing.player.pos.y, 2.001, 0.03), 'landing on a raised block restores grounded support');
landing.input.hold('Space');
step(landing.player, landing.input);
landing.input.lift('Space');
assert(landing.player.vel.y > 0 && landing.player.pos.y > 2.001, 'raised-block support allows an immediate next jump');

const wallstep = make(ledge);
wallstep.player.pos.z = 1.5;
wallstep.player.prev.z = 1.5;
wallstep.input.hold('KeyW');
step(wallstep.player, wallstep.input, 120);
wallstep.input.lift('KeyW');
assert(wallstep.player.pos.z > 0.29 && wallstep.player.pos.y < 1.05, 'walking does not auto-step onto one-block-high terrain');

const course = new World();
for (let z = -50; z <= 8; z++) {
  for (let x = -2; x <= 2; x++) course.set(x, 0, z, 1, 1);
}
for (let z = -7; z >= -16; z--) {
  for (let x = -2; x <= 2; x++) course.set(x, 1, z, 1, 1);
}
const runner = make(course);
runner.input.hold('KeyW');
runner.input.hold('ControlLeft');
runner.input.hold('Space');
let runjumps = 0;
let highjump = false;
let highseen = false;
let lowseen = false;
oldvel = runner.player.vel.y;
for (let i = 0; i < 500; i++) {
  runner.player.tick(1 / 60);
  runner.input.clear();
  if (oldvel <= 0 && runner.player.vel.y > 0) {
    runjumps++;
    if (runner.player.pos.y > 1.9 && runner.player.pos.z < -7 && runner.player.pos.z > -17) highjump = true;
  }
  oldvel = runner.player.vel.y;
  if (runner.player.pos.z < -7 && runner.player.pos.z > -16 && runner.player.pos.y > 1.9) highseen = true;
  if (runner.player.pos.z < -17 && runner.player.pos.y < 1.9) lowseen = true;
}
runner.input.lift('KeyW');
runner.input.lift('ControlLeft');
runner.input.lift('Space');
assert(runjumps >= 8, 'continuous sprint-jumping repeats across terrain');
assert(highseen, 'sprint-jump reaches one-block-high terrain');
assert(highjump, 'landing/support on raised blocks allows the next held jump');
assert(lowseen && runner.player.pos.z < -30, 'sprint-jump continues smoothly off raised terrain');

const creativerepeat = make(holdjump, true);
creativerepeat.input.tap('Space');
step(creativerepeat.player, creativerepeat.input);
let creativejumps = 1;
oldvel = creativerepeat.player.vel.y;
for (let i = 0; i < 240; i++) {
  creativerepeat.player.tick(1 / 60);
  creativerepeat.input.clear();
  if (oldvel <= 0 && creativerepeat.player.vel.y > 0) creativejumps++;
  oldvel = creativerepeat.player.vel.y;
}
creativerepeat.input.lift('Space');
assert(!creativerepeat.player.flight, 'holding Space alone does not trigger creative flight');
assert(creativejumps >= 4, 'creative grounded mode preserves held repeated jumping');

const edge = new World();
edge.set(0, 0, 0, 1, 1);
const crouch = make(edge);
crouch.input.hold('ShiftLeft');
crouch.input.hold('KeyW');
step(crouch.player, crouch.input, 180);
assert(crouch.player.crouch && close(crouch.player.height, tune.duck), 'shift crouches when grounded');
assert(crouch.player.ground && crouch.player.pos.z >= -0.3, 'crouch prevents walking off block edge');
crouch.input.lift('ShiftLeft');
crouch.input.lift('KeyW');
step(crouch.player, crouch.input);
assert(!crouch.player.crouch && close(crouch.player.height, tune.stand), 'releasing shift stands when clear');

const air = make(ground, true);
double(air.player, air.input);
assert(air.player.flight, 'double Space enables creative flight');
const hover = air.player.pos.y;
step(air.player, air.input, 30);
assert(close(air.player.pos.y, hover, 0.08), 'creative flight hovers without gravity');
air.input.hold('Space');
step(air.player, air.input, 30);
air.input.lift('Space');
assert(air.player.pos.y > hover + 1, 'Space rises while flying');
const high = air.player.pos.y;
air.input.hold('ShiftLeft');
step(air.player, air.input, 20);
air.input.lift('ShiftLeft');
assert(air.player.pos.y < high - 0.5, 'Shift descends while flying');

const wall = new World();
floor(wall);
for (let y = 1; y <= 4; y++) wall.set(0, y, -2, 1, 1);
const blocked = make(wall, true);
blocked.player.flight = true;
blocked.input.hold('KeyW');
step(blocked.player, blocked.input, 120);
blocked.input.lift('KeyW');
assert(blocked.player.pos.z >= -0.705, 'creative flight collides with wall blocks');

const roof = new World();
floor(roof);
roof.set(0, 4, 0, 1, 1);
const rise = make(roof, true);
rise.player.flight = true;
rise.input.hold('Space');
step(rise.player, rise.input, 120);
rise.input.lift('Space');
assert(rise.player.pos.y <= 2.205, 'creative flight collides with ceilings');

const fall = make(ground, true);
fall.player.flight = true;
fall.player.pos.y = 4;
fall.player.prev.y = 4;
double(fall.player, fall.input);
assert(!fall.player.flight, 'second double Space disables creative flight');
step(fall.player, fall.input, 180);
assert(fall.player.ground && close(fall.player.pos.y, 1.001, 0.03), 'disabled flight falls and lands normally');

console.log('core movement tests passed');
