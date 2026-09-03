import { Runtime } from '../core/runtime.js';
import { Player } from '../core/player.js';
import { Fly } from '../core/fly.js';
import { Build } from '../core/build.js';
import { cast } from '../core/ray.js';
import { read } from '../core/map.js';
import { Inventory } from '../core/inventory.js';
import { item } from '../data/item.js';
import { drops as dropcfg, health, send } from '../data/balance.js';
import { move as tune } from '../data/tune.js';
import { State } from './state.js';
import { make as generators } from './generator.js';
import { Drops } from './drop.js';
import { Beds } from './bed.js';
import { Holo } from './holo.js';
import { Actors } from './actors.js';
import { Hud } from './hud.js';

function point(value) {
  return value && Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z);
}

function check(markers) {
  const need = [
    markers?.red?.spawn,
    markers?.blue?.spawn,
    markers?.red?.bed,
    markers?.blue?.bed,
    markers?.red?.forge,
    markers?.blue?.forge,
    markers?.spectator
  ];
  if (need.some(value => !point(value))) throw new Error('Map is missing required team, bed, forge, or spectator markers.');
  if (!Array.isArray(markers?.diamond) || !markers.diamond.length || markers.diamond.some(value => !point(value))) throw new Error('Map needs at least one Diamond generator marker.');
  if (!Array.isArray(markers?.emerald) || !markers.emerald.length || markers.emerald.some(value => !point(value))) throw new Error('Map needs at least one Emerald generator marker.');
}

function dist(a, b) {
  const x = a.x - (b.x + 0.5);
  const y = (a.y + 0.9) - (b.y + 0.5);
  const z = a.z - (b.z + 0.5);
  return Math.hypot(x, y, z);
}

class Arena {
  constructor(stage, room, uid, peer, data) {
    this.room = room;
    this.uid = uid;
    this.peer = peer;
    this.runtime = new Runtime(stage);
    this.markers = read(this.runtime.world, data);
    check(this.markers);
    this.profile = room.players[uid];
    this.team = this.profile.team;
    this.player = new Player(this.runtime.world, this.runtime.input, this.runtime.view.camera);
    this.fly = null;
    this.build = new Build(this.runtime.world);
    this.inv = new Inventory();
    this.state = new State(room);
    this.gens = generators(this.markers);
    this.genmap = new Map(this.gens.map(gen => [gen.id, gen]));
    this.drops = new Drops(this.runtime.view.scene);
    this.beds = new Beds(this.runtime.view.scene, this.markers);
    this.holo = new Holo(this.runtime.view.scene, this.gens);
    this.actors = new Actors(this.runtime.view.scene, room, uid);
    this.hud = new Hud(this.runtime.input);
    this.hud.bind(this.inv);
    this.host = uid === room.host;
    this.mode = 'live';
    this.clock = 0;
    this.peak = 0;
    this.air = false;
    this.pending = false;
    this.pickups = new Set();
    this.positions = new Map();
    this.timers = new Map();
    this.seq = 0;
    this.net = 0;
    this.stamp = performance.now() / 1000;
  }

  start() {
    this.spawn();
    this.beds.sync(this.state);
    this.actors.state(this.state);
    this.hud.draw(this.state, this.uid);
    this.runtime.tick = dt => this.tick(dt);
    this.runtime.frame = alpha => this.frame(alpha);
    this.runtime.start();
    if (!this.host) this.peer.data({ kind: 'ready' });
  }

  spawn() {
    const pos = this.markers[this.team].spawn;
    this.player.spawn(pos.x + 0.5, pos.y + 0.001, pos.z + 0.5);
    this.mode = 'live';
    this.fly = null;
    this.pending = false;
    this.peak = this.player.pos.y;
    this.hud.count(0);
    this.hud.say('');
  }

  wait() {
    const pos = this.markers.spectator;
    this.player.spawn(pos.x + 0.5, pos.y + 0.001, pos.z + 0.5);
    this.mode = 'wait';
    this.clock = health.respawn;
    this.pending = false;
  }

  out() {
    const pos = this.markers.spectator;
    this.fly = new Fly(this.runtime.input, this.runtime.view.camera);
    this.fly.pos.set(pos.x + 0.5, pos.y + 0.8, pos.z + 0.5);
    this.fly.yaw = this.player.yaw;
    this.fly.pitch = this.player.pitch;
    this.mode = 'out';
    this.pending = false;
    this.hud.count(0);
    this.hud.say('Eliminated — spectator mode');
  }

  sync(data) {
    this.state.load(data);
    const after = this.state.players[this.uid];
    this.beds.sync(this.state);
    this.actors.state(this.state);
    this.hud.draw(this.state, this.uid);
    if (!after) return;
    if (after.out && this.mode !== 'out' && this.mode !== 'end') {
      this.out();
    } else if (after.dead && !after.out && this.mode === 'live') {
      this.wait();
    } else if (!after.dead && this.mode === 'wait') {
      this.spawn();
    }
    if (this.state.winner) {
      this.mode = 'end';
      this.hud.count(0);
      this.hud.say(`${this.state.winner === 'red' ? 'Red' : 'Blue'} wins`);
      document.exitPointerLock?.();
    }
  }

  emit(data) {
    this.apply(data);
    this.peer.data(data);
  }

  apply(data) {
    if (data.kind === 'state') {
      this.sync(data.data);
      return;
    }
    if (data.kind === 'drop') {
      if (data.action === 'add') this.drops.add(data.data);
      else this.drops.del(data.id);
      return;
    }
    if (data.kind === 'take') {
      this.drops.del(data.id);
      this.pickups.delete(data.id);
      if (data.uid === this.uid) {
        this.inv.add(data.item, data.count);
        this.hud.draw(this.state, this.uid);
      }
      return;
    }
    if (data.kind === 'clock') {
      this.genmap.get(data.gen)?.clock(data.item, data.left);
      return;
    }
    if (data.kind === 'block') {
      if (data.action === 'place') {
        this.runtime.world.set(data.x, data.y, data.z, data.block, 2);
        if (data.uid === this.uid) this.inv.remove(data.item, 1);
      } else {
        this.runtime.world.del(data.x, data.y, data.z);
      }
      this.hud.draw(this.state, this.uid);
      return;
    }
    if (data.kind === 'move' && data.uid !== this.uid) this.actors.move(data.uid, data);
  }

  data(from, data) {
    if (!data || typeof data !== 'object') return;
    if (this.host) {
      if (data.kind === 'hello' || data.kind === 'ready') {
        this.seed(from);
        return;
      }
      if (data.kind === 'move') {
        this.move(from, data);
        return;
      }
      this.request(from, data);
      return;
    }
    if (from !== this.room.host) return;
    if (data.kind === 'sync') {
      this.sync(data.state);
      this.drops.load(data.drops);
      for (const gen of data.gens ?? []) {
        const target = this.genmap.get(gen.id);
        for (const out of gen.outputs ?? []) target?.clock(out.id, out.left);
      }
      for (const [uid, pos] of Object.entries(data.moves ?? {})) this.actors.move(uid, pos);
      return;
    }
    this.apply(data);
  }

  seed(uid) {
    const moves = {};
    for (const [key, value] of this.positions) moves[key] = value;
    this.peer.send(uid, {
      kind: 'sync',
      state: this.state.dump(),
      drops: this.drops.dump(),
      gens: this.gens.map(gen => ({ id: gen.id, outputs: gen.dump() })),
      moves
    });
  }

  move(uid, data) {
    const pos = {
      x: Number(data.x), y: Number(data.y), z: Number(data.z),
      yaw: Number(data.yaw) || 0,
      crouch: Boolean(data.crouch),
      speed: Math.max(0, Number(data.speed) || 0)
    };
    if (![pos.x, pos.y, pos.z].every(Number.isFinite)) return;
    this.positions.set(uid, pos);
    this.actors.move(uid, pos);
    this.peer.data({ kind: 'move', uid, ...pos });
  }

  request(uid, data) {
    const player = this.state.players[uid];
    if (!player || player.dead || player.out || this.state.winner) return;
    if (data.kind === 'take') this.take(uid, data.id);
    if (data.kind === 'hurt') this.hurt(uid, data.amount);
    if (data.kind === 'death') this.die(uid);
    if (data.kind === 'bed') this.bed(uid, data.team);
    if (data.kind === 'place') this.place(uid, data);
    if (data.kind === 'break') this.break(uid, data);
  }

  hurt(uid, amount) {
    const result = this.state.hurt(uid, amount);
    if (!result.ok) return;
    this.emit({ kind: 'state', data: this.state.dump() });
    if (result.death && result.mode === 'wait') this.timer(uid);
  }

  die(uid) {
    const result = this.state.die(uid);
    if (!result.ok) return;
    this.emit({ kind: 'state', data: this.state.dump() });
    if (result.mode === 'wait') this.timer(uid);
  }

  timer(uid) {
    clearTimeout(this.timers.get(uid));
    const timer = setTimeout(() => {
      this.timers.delete(uid);
      if (this.state.respawn(uid)) this.emit({ kind: 'state', data: this.state.dump() });
    }, health.respawn * 1000);
    this.timers.set(uid, timer);
  }

  bed(uid, team) {
    if (!['red', 'blue'].includes(team)) return;
    const pos = uid === this.uid ? this.player.pos : this.positions.get(uid);
    const mark = this.markers[team].bed;
    if (!pos || dist(pos, mark) > tune.reach + 0.75) return;
    if (this.state.break(team, uid)) this.emit({ kind: 'state', data: this.state.dump() });
  }

  take(uid, id) {
    const drop = this.drops.get(id);
    const pos = uid === this.uid ? this.player.pos : this.positions.get(uid);
    if (!drop || !pos || dist(pos, { x: drop.x - 0.5, y: drop.y - 0.5, z: drop.z - 0.5 }) > dropcfg.reach + 0.7) return;
    this.emit({ kind: 'take', id, uid, item: drop.item, count: drop.count });
  }

  place(uid, data) {
    const def = item(data.item);
    if (!def || def.kind !== 'block' || def.block !== data.block) return;
    if (![data.x, data.y, data.z].every(Number.isInteger)) return;
    if (this.runtime.world.get(data.x, data.y, data.z)) return;
    this.emit({ kind: 'block', action: 'place', uid, item: def.id, block: def.block, x: data.x, y: data.y, z: data.z });
  }

  break(uid, data) {
    if (![data.x, data.y, data.z].every(Number.isInteger)) return;
    if (this.runtime.world.kind(data.x, data.y, data.z) !== 2) return;
    this.emit({ kind: 'block', action: 'break', uid, x: data.x, y: data.y, z: data.z });
  }

  local(data) {
    if (this.host) this.request(this.uid, data);
    else this.peer.data(data);
  }

  gen(gen, out) {
    if (this.drops.items.size >= dropcfg.cap) {
      const id = this.drops.first();
      if (id) this.emit({ kind: 'drop', action: 'del', id });
    }
    const data = {
      id: `${gen.id}-${++this.seq}`,
      item: out.id,
      count: 1,
      x: gen.pos.x + 0.5,
      y: gen.pos.y + 0.3,
      z: gen.pos.z + 0.5,
      age: 0
    };
    this.emit({ kind: 'drop', action: 'add', data });
    this.emit({ kind: 'clock', gen: gen.id, item: out.id, left: out.left });
  }

  interact() {
    const input = this.runtime.input;
    const left = input.click(0);
    const right = input.click(2);
    if (!left && !right) return;
    const hit = cast(this.runtime.world, this.runtime.view.camera, tune.reach);
    if (left) {
      const bed = this.beds.hit(this.runtime.view.camera, tune.reach);
      if (bed && (!hit || bed.dist < hit.dist)) {
        if (bed.team !== this.team) this.local({ kind: 'bed', team: bed.team });
        return;
      }
      if (hit && this.runtime.world.kind(hit.x, hit.y, hit.z) === 2) this.local({ kind: 'break', x: hit.x, y: hit.y, z: hit.z });
      return;
    }
    if (!hit) return;
    const slot = this.inv.slot();
    const def = slot ? item(slot.id) : null;
    if (!def?.block) return;
    const pos = this.build.spot(hit, this.player);
    if (!pos) return;
    this.local({ kind: 'place', item: def.id, block: def.block, x: pos.x, y: pos.y, z: pos.z });
  }

  keys() {
    const input = this.runtime.input;
    for (let i = 0; i < 9; i++) if (input.press(`Digit${i + 1}`)) this.hud.select(i);
    if (input.press('KeyE')) this.hud.toggle();
  }

  fall(was) {
    if (!this.player.ground) this.peak = Math.max(this.peak, this.player.pos.y);
    if (this.player.ground && !was) {
      const depth = this.peak - this.player.pos.y;
      this.peak = this.player.pos.y;
      const damage = Math.floor(depth - health.safe);
      if (damage > 0) this.local({ kind: 'hurt', amount: damage, cause: 'fall' });
    } else if (this.player.ground) {
      this.peak = this.player.pos.y;
    }
    if (this.player.pos.y < health.void && !this.pending) {
      this.pending = true;
      this.local({ kind: 'death', cause: 'void' });
    }
  }

  snapshot(dt) {
    this.net += dt;
    if (this.net < send) return;
    this.net = 0;
    const speed = Math.hypot(this.player.vel.x, this.player.vel.z);
    const data = {
      kind: 'move', uid: this.uid,
      x: this.player.pos.x, y: this.player.pos.y, z: this.player.pos.z,
      yaw: this.player.yaw, crouch: this.player.crouch, speed
    };
    this.positions.set(this.uid, data);
    if (this.host) this.peer.data(data);
    else this.peer.data({ ...data, uid: undefined });
  }

  pickup() {
    const drop = this.drops.near(this.player.pos);
    if (!drop || this.pickups.has(drop.id)) return;
    this.pickups.add(drop.id);
    this.local({ kind: 'take', id: drop.id });
  }

  tick(dt) {
    this.keys();
    if (this.mode === 'end') return;
    if (this.host) for (const gen of this.gens) gen.tick(dt, (base, out) => this.gen(base, out));
    else for (const gen of this.gens) gen.tick(dt);

    if (this.mode === 'out') {
      if (!this.hud.shown) this.fly.tick(dt);
      return;
    }
    if (this.mode === 'wait') {
      this.clock = Math.max(0, this.clock - dt);
      this.hud.count(Math.max(1, Math.ceil(this.clock)));
      return;
    }
    if (this.hud.shown) return;
    const was = this.player.ground;
    this.player.tick(dt);
    this.fall(was);
    this.snapshot(dt);
    this.pickup();
    if (this.runtime.input.locked) this.interact();
  }

  frame(alpha) {
    const now = performance.now() / 1000;
    const dt = Math.min(0.1, now - this.stamp);
    this.stamp = now;
    if (this.mode !== 'out') this.player.frame(alpha);
    this.actors.frame(dt);
    this.drops.frame(dt);
    this.holo.frame(this.gens);
  }

  network(open, total) {
    this.hud.net(open, total);
  }

  close() {
    this.runtime.stop();
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
    this.drops.close();
    this.beds.close();
    this.holo.close();
  }
}

export { Arena };
