import { Runtime } from '../core/runtime.js';
import { Player } from '../core/player.js';
import { Fly } from '../core/fly.js';
import { Build } from '../core/build.js';
import { cast } from '../core/ray.js';
import { read } from '../core/map.js';
import { Inventory } from '../core/inventory.js';
import { item } from '../data/item.js';
import { combat, drops as dropcfg, fireball as ballcfg, health, send, shop as market, tnt as tntcfg } from '../data/balance.js';
import { move as tune } from '../data/tune.js';
import { grace } from '../data/net.js';
import { State } from './state.js';
import { make as generators } from './generator.js';
import { Drops } from './drop.js';
import { Beds } from './bed.js';
import { Holo } from './holo.js';
import { Actors } from './actors.js';
import { Hud } from './hud.js';
import { Bags } from './bags.js';
import { Cracks } from './crack.js';
import { Hand } from './hand.js';
import { Bombs } from './bomb.js';
import { Balls } from './ball.js';
import { Fx } from './fx.js';
import { time as minetime } from './mine.js';
import { aim, damage, knock, reach, vector } from './fight.js';
import { blocks as blastblocks, scale as blastscale } from './blast.js';
import { Economy } from './economy.js';
import { Shop } from './shop.js';
import { Chat } from './chat.js';
import { Victory } from './victory.js';

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
    markers?.red?.item,
    markers?.blue?.item,
    markers?.red?.island,
    markers?.blue?.island,
    markers?.spectator
  ];
  if (need.some(value => !point(value))) throw new Error('Map is missing required team, bed, forge, shop, or spectator markers.');
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
  constructor(stage, room, uid, peer, data, handlers = {}) {
    this.room = room;
    this.uid = uid;
    this.peer = peer;
    this.handlers = handlers;
    this.host = uid === room.host;
    this.runtime = new Runtime(stage);
    this.markers = read(this.runtime.world, data);
    check(this.markers);
    this.profile = room.players[uid];
    this.team = this.profile.team;
    this.player = new Player(this.runtime.world, this.runtime.input, this.runtime.view.camera);
    this.fly = null;
    this.build = new Build(this.runtime.world);
    this.bags = this.host ? new Bags(room) : null;
    this.inv = this.host ? this.bags.get(uid) : new Inventory();
    if (!this.host) this.inv.add('swordwood', 1);
    this.state = new State(room);
    this.economy = this.host ? new Economy(this.bags, this.state) : null;
    this.gens = generators(this.markers);
    this.genmap = new Map(this.gens.map(gen => [gen.id, gen]));
    this.drops = new Drops(this.runtime.view.scene);
    this.beds = new Beds(this.runtime.view.scene, this.markers);
    this.holo = new Holo(this.runtime.view.scene, this.gens);
    this.actors = new Actors(this.runtime.view.scene, room, uid);
    this.cracks = new Cracks(this.runtime.view.scene);
    this.hand = new Hand(this.runtime.view.scene, this.runtime.view.camera);
    this.bombs = new Bombs(this.runtime.view.scene);
    this.balls = new Balls(this.runtime.view.scene);
    this.fx = new Fx(this.runtime.view.scene);
    this.hud = new Hud(this.runtime.input);
    this.hud.bind(this.inv);
    this.shop = new Shop(this.runtime.view.scene, this.runtime.input, this.markers, {
      buy: id => this.local({ kind: 'buy', item: id }),
      forge: id => this.local({ kind: 'forge', item: id })
    });
    this.chat = new Chat(this.runtime.input, text => this.local({ kind: 'chat', text }));
    this.victory = new Victory({ leave: () => this.handlers.leave?.(), restart: () => this.handlers.restart?.() });
    this.endbtn = document.querySelector('#endgame');
    this.endfn = () => this.handlers.end?.();
    this.endbtn.hidden = !this.host;
    this.endbtn.addEventListener('click', this.endfn);
    this.mode = 'live';
    this.clock = 0;
    this.peak = 0;
    this.pending = false;
    this.pickups = new Set();
    this.positions = new Map();
    this.timers = new Map();
    this.away = new Map();
    this.miners = new Map();
    this.attacks = new Map();
    this.credits = new Map();
    this.minekey = '';
    this.seq = 0;
    this.net = 0;
    this.stamp = performance.now() / 1000;
  }

  start() {
    this.roster(this.room);
    this.spawn();
    this.beds.sync(this.state);
    this.actors.state(this.state);
    this.hud.draw(this.state, this.uid);
    this.rates();
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
    this.minekey = '';
    this.hud.count(0);
    this.hud.say('');
    this.shop?.close(false);
  }

  wait() {
    const pos = this.markers.spectator;
    this.player.spawn(pos.x + 0.5, pos.y + 0.001, pos.z + 0.5);
    this.mode = 'wait';
    this.clock = health.respawn;
    this.pending = false;
    this.minekey = '';
    this.shop?.close(false);
  }

  out() {
    const pos = this.markers.spectator;
    this.fly = new Fly(this.runtime.input, this.runtime.view.camera);
    this.fly.pos.set(pos.x + 0.5, pos.y + 0.8, pos.z + 0.5);
    this.fly.yaw = this.player.yaw;
    this.fly.pitch = this.player.pitch;
    this.mode = 'out';
    this.pending = false;
    this.minekey = '';
    this.hud.count(0);
    this.hud.say('Eliminated — spectator mode');
    this.shop?.close(false);
  }

  sync(data) {
    this.state.load(data);
    const after = this.state.players[this.uid];
    this.beds.sync(this.state);
    this.actors.state(this.state);
    this.hud.draw(this.state, this.uid);
    this.rates();
    this.shop.draw(this.state, this.uid, this.inv);
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
      this.hud.close(false);
      this.shop.close(false);
      this.chat.close(false);
      this.endbtn.hidden = true;
      this.victory.open(this.room, this.state, this.uid);
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
    if (data.kind === 'bag') {
      if (data.uid === this.uid) {
        if (!this.host) {
          if (data.action === 'add') this.inv.add(data.item, data.count);
          else if (data.action === 'remove') this.inv.remove(data.item, data.count);
          else if (data.action === 'reset') this.inv.load(data.data);
        }
        this.hud.draw(this.state, this.uid);
        this.shop.draw(this.state, this.uid, this.inv);
      }
      return;
    }
    if (data.kind === 'shop') {
      this.shop.result(data);
      return;
    }
    if (data.kind === 'chat') {
      this.chat.add(data);
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
      return;
    }
    if (data.kind === 'clock') {
      this.genmap.get(data.gen)?.clock(data.item, data.left);
      return;
    }
    if (data.kind === 'block') {
      if (data.action === 'place') this.runtime.world.set(data.x, data.y, data.z, data.block, 2);
      else this.runtime.world.del(data.x, data.y, data.z);
      this.hud.draw(this.state, this.uid);
      return;
    }
    if (data.kind === 'move' && data.uid !== this.uid) {
      this.actors.move(data.uid, data);
      return;
    }
    if (data.kind === 'swing') {
      if (data.uid === this.uid) this.hand.swing();
      else this.actors.swing(data.uid);
      return;
    }
    if (data.kind === 'hit') {
      if (data.uid === this.uid && this.mode === 'live') this.player.knock(data.x, data.y, data.z);
      if (data.from === this.uid) this.hud.hit();
      return;
    }
    if (data.kind === 'mine') {
      const on = data.action === 'start';
      if (on) this.cracks.start(data.uid, data);
      else this.cracks.stop(data.uid);
      if (data.uid === this.uid) {
        this.hand.mine(on);
        if (!on) this.minekey = '';
      } else {
        this.actors.mine(data.uid, on);
      }
      return;
    }
    if (data.kind === 'tnt') {
      if (data.action === 'add') this.bombs.add(data.data);
      else this.bombs.del(data.id);
      return;
    }
    if (data.kind === 'ball') {
      if (data.action === 'add') this.balls.add(data.data);
      else this.balls.del(data.id);
      return;
    }
    if (data.kind === 'blast') {
      for (const pos of data.blocks ?? []) this.runtime.world.del(pos.x, pos.y, pos.z);
      this.fx.boom(data.pos, data.radius);
    }
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
      this.inv.load(data.bag ?? []);
      this.hud.draw(this.state, this.uid);
      this.shop.draw(this.state, this.uid, this.inv);
      this.bombs.load(data.bombs);
      this.balls.load(data.balls);
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
      bag: this.bags.get(uid)?.dump() ?? [],
      drops: this.drops.dump(),
      bombs: this.bombs.dump(),
      balls: this.balls.dump(),
      gens: this.gens.map(gen => ({ id: gen.id, outputs: gen.dump() })),
      moves
    });
  }

  move(uid, data) {
    const held = typeof data.held === 'string' && this.bags.has(uid, data.held) ? data.held : '';
    const pos = {
      x: Number(data.x), y: Number(data.y), z: Number(data.z),
      yaw: Number(data.yaw) || 0,
      pitch: Number(data.pitch) || 0,
      crouch: Boolean(data.crouch),
      speed: Math.max(0, Number(data.speed) || 0),
      held
    };
    if (![pos.x, pos.y, pos.z].every(Number.isFinite)) return;
    this.positions.set(uid, pos);
    this.actors.move(uid, pos);
    this.peer.data({ kind: 'move', uid, ...pos });
  }

  request(uid, data) {
    if (data.kind === 'chat') {
      this.message(uid, data.text);
      return;
    }
    const player = this.state.players[uid];
    if (!player || player.dead || player.out || this.state.winner) return;
    if (data.kind === 'take') this.take(uid, data.id);
    if (data.kind === 'hurt' && data.cause === 'fall') this.hurt(uid, Math.min(health.max, Math.max(0, Number(data.amount) || 0)), this.killer(uid), false);
    if (data.kind === 'death' && data.cause === 'void') this.die(uid, this.killer(uid));
    if (data.kind === 'bed') this.bed(uid, data.team);
    if (data.kind === 'place') this.place(uid, data);
    if (data.kind === 'attack') this.attack(uid, data.target);
    if (data.kind === 'mine') this.dig(uid, data);
    if (data.kind === 'tnt') this.tnt(uid, data);
    if (data.kind === 'fire') this.fire(uid);
    if (data.kind === 'eat') this.eat(uid);
    if (data.kind === 'buy') this.buy(uid, data.item);
    if (data.kind === 'forge') this.forge(uid, data.item);
  }

  message(uid, value) {
    const profile = this.room.players?.[uid];
    const team = this.state.teams[uid];
    if (!profile || !['red', 'blue'].includes(team) || typeof value !== 'string') return;
    let text = value.trim().slice(0, 200);
    let shout = false;
    if (/^\/shout(?:\s|$)/i.test(text)) {
      shout = true;
      text = text.replace(/^\/shout\s*/i, '').trim();
    }
    if (!text) return;
    const data = { kind: 'chat', uid, name: profile.name, team, shout, text };
    for (const target of Object.keys(this.state.players)) {
      const live = this.room.players?.[target];
      if (!live || live.online === false) continue;
      if (!shout && this.state.teams[target] !== team) continue;
      if (target === this.uid) this.apply(data);
      else this.peer.send(target, data);
    }
  }

  roster(room) {
    this.room = room;
    this.actors.sync(room);
    if (!this.host || this.state.winner) return;
    for (const uid of Object.keys(this.state.players)) {
      if (uid === this.uid) continue;
      const live = room.players?.[uid]?.online !== false && Boolean(room.players?.[uid]);
      if (live) {
        clearTimeout(this.away.get(uid));
        this.away.delete(uid);
        continue;
      }
      if (this.away.has(uid)) continue;
      const timer = setTimeout(() => {
        this.away.delete(uid);
        const current = this.room.players?.[uid];
        if (current && current.online !== false) return;
        if (!this.state.leave(uid)) return;
        this.finish(uid, null, false);
        this.emit({ kind: 'state', data: this.state.dump() });
      }, grace * 1000);
      this.away.set(uid, timer);
    }
  }

  store(uid, kind) {
    const pos = this.spot(uid);
    const team = this.state.teams[uid];
    const mark = this.markers?.[team]?.[kind];
    return Boolean(pos && mark && dist(pos, mark) <= market.reach);
  }

  bagsync(result) {
    for (const data of result?.bag ?? []) this.emit({ kind: 'bag', ...data });
  }

  buy(uid, id) {
    if (!this.store(uid, 'item')) {
      this.emit({ kind: 'shop', uid, ok: false, code: 'range' });
      return;
    }
    const result = this.economy.buy(uid, id);
    this.bagsync(result);
    if (result.state) this.emit({ kind: 'state', data: this.state.dump() });
    this.emit({ kind: 'shop', uid, ok: result.ok, code: result.code ?? '' });
  }

  forge(uid, id) {
    if (!this.store(uid, 'island')) {
      this.emit({ kind: 'shop', uid, ok: false, code: 'range' });
      return;
    }
    const result = this.economy.forge(uid, id);
    this.bagsync(result);
    if (result.state) this.emit({ kind: 'state', data: this.state.dump() });
    this.emit({ kind: 'shop', uid, ok: result.ok, code: result.code ?? '' });
  }

  eat(uid) {
    if (this.held(uid) !== 'apple' || !this.bags.has(uid, 'apple')) return;
    if (!this.state.eat(uid)) return;
    if (!this.bags.remove(uid, 'apple', 1)) return;
    this.emit({ kind: 'bag', action: 'remove', uid, item: 'apple', count: 1 });
    this.emit({ kind: 'state', data: this.state.dump() });
  }

  rates() {
    for (const gen of this.gens) if (gen.team) gen.level(this.state.forge?.[gen.team] ?? 0);
  }

  menu() {
    return this.hud.shown || this.shop.shown || this.chat.shown || this.victory.shown;
  }

  finish(uid, killer = null, record = true) {
    this.undig(uid);
    if (record) this.state.score(uid, killer);
    const bag = this.bags.get(uid);
    const loot = this.bags.death(uid);
    if (bag) this.emit({ kind: 'bag', action: 'reset', uid, data: bag.dump() });
    if (killer && killer !== uid && this.bags.get(killer)) {
      if (loot.diamond) {
        this.bags.add(killer, 'diamond', loot.diamond);
        this.emit({ kind: 'bag', action: 'add', uid: killer, item: 'diamond', count: loot.diamond });
      }
      if (loot.emerald) {
        this.bags.add(killer, 'emerald', loot.emerald);
        this.emit({ kind: 'bag', action: 'add', uid: killer, item: 'emerald', count: loot.emerald });
      }
    }
  }

  hurt(uid, amount, killer = null, guard = true) {
    const result = this.state.hurt(uid, amount, guard);
    if (!result.ok) return;
    if (result.death) this.finish(uid, killer);
    this.emit({ kind: 'state', data: this.state.dump() });
    if (result.death && result.mode === 'wait') this.timer(uid);
  }

  die(uid, killer = null) {
    const result = this.state.die(uid);
    if (!result.ok) return;
    this.finish(uid, killer);
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

  credit(uid, from) {
    if (uid && from && uid !== from) this.credits.set(uid, { uid: from, left: combat.credit });
  }

  killer(uid) {
    const item = this.credits.get(uid);
    return item && item.left > 0 ? item.uid : null;
  }

  spot(uid) {
    if (uid === this.uid) {
      return {
        x: this.player.pos.x, y: this.player.pos.y, z: this.player.pos.z,
        yaw: this.player.yaw, pitch: this.player.pitch,
        held: this.inv.slot()?.id ?? ''
      };
    }
    return this.positions.get(uid) ?? null;
  }

  held(uid) {
    const pos = this.spot(uid);
    const id = pos?.held ?? '';
    return id && this.bags.has(uid, id) ? id : '';
  }

  attack(uid, target = '') {
    if ((this.attacks.get(uid) ?? 0) > 0) return;
    this.attacks.set(uid, combat.delay);
    this.emit({ kind: 'swing', uid });
    if (!target || target === uid) return;
    const source = this.state.players[uid];
    const victim = this.state.players[target];
    if (!source || !victim || victim.dead || victim.out || this.state.teams[uid] === this.state.teams[target]) return;
    const a = this.spot(uid);
    const b = this.spot(target);
    if (!reach(a, b) || aim(a, b) < combat.angle) return;
    const force = knock(a, b);
    this.credit(target, uid);
    const result = this.state.hurt(target, damage(this.held(uid)));
    if (!result.ok) return;
    this.emit({ kind: 'hit', uid: target, from: uid, ...force });
    if (result.death) this.finish(target, uid);
    this.emit({ kind: 'state', data: this.state.dump() });
    if (result.death && result.mode === 'wait') this.timer(target);
  }

  bed(uid, team) {
    if (!['red', 'blue'].includes(team)) return;
    const pos = this.spot(uid);
    const mark = this.markers[team].bed;
    if (!pos || dist(pos, mark) > tune.reach + 0.75) return;
    if (this.state.break(team, uid)) this.emit({ kind: 'state', data: this.state.dump() });
  }

  take(uid, id) {
    const drop = this.drops.get(id);
    const pos = this.spot(uid);
    if (!drop || !pos || dist(pos, { x: drop.x - 0.5, y: drop.y - 0.5, z: drop.z - 0.5 }) > dropcfg.reach + 0.7) return;
    if (this.bags.add(uid, drop.item, drop.count)) return;
    this.emit({ kind: 'take', id, uid, item: drop.item, count: drop.count });
    this.emit({ kind: 'bag', action: 'add', uid, item: drop.item, count: drop.count });
  }

  place(uid, data) {
    const def = item(data.item);
    if (!def || def.kind !== 'block' || def.block !== data.block || this.held(uid) !== def.id) return;
    if (![data.x, data.y, data.z].every(Number.isInteger)) return;
    if (this.runtime.world.get(data.x, data.y, data.z)) return;
    if (!this.bags.remove(uid, def.id, 1)) return;
    this.emit({ kind: 'block', action: 'place', uid, item: def.id, block: def.block, x: data.x, y: data.y, z: data.z });
    this.emit({ kind: 'bag', action: 'remove', uid, item: def.id, count: 1 });
  }

  dig(uid, data) {
    if (data.action === 'stop') {
      this.undig(uid);
      return;
    }
    if (data.action !== 'start' || ![data.x, data.y, data.z].every(Number.isInteger)) return;
    const pos = this.spot(uid);
    if (!pos || dist(pos, data) > tune.reach + 0.75 || this.runtime.world.kind(data.x, data.y, data.z) !== 2) return;
    this.undig(uid);
    const time = minetime(this.runtime.world.get(data.x, data.y, data.z), this.held(uid));
    if (!Number.isFinite(time)) return;
    this.miners.set(uid, { x: data.x, y: data.y, z: data.z, age: 0, time, tool: this.held(uid) });
    this.emit({ kind: 'swing', uid });
    this.emit({ kind: 'mine', action: 'start', uid, x: data.x, y: data.y, z: data.z, time });
  }

  undig(uid) {
    if (!this.miners.has(uid)) return;
    this.miners.delete(uid);
    this.emit({ kind: 'mine', action: 'stop', uid });
  }

  mining(dt) {
    for (const [uid, mine] of [...this.miners]) {
      const player = this.state.players[uid];
      const pos = this.spot(uid);
      if (!player || player.dead || player.out || !pos || dist(pos, mine) > tune.reach + 0.75 || this.runtime.world.kind(mine.x, mine.y, mine.z) !== 2 || this.held(uid) !== mine.tool) {
        this.undig(uid);
        continue;
      }
      mine.age += dt;
      if (mine.age < mine.time) continue;
      this.emit({ kind: 'block', action: 'break', uid, x: mine.x, y: mine.y, z: mine.z });
      this.undig(uid);
    }
  }

  tnt(uid, data) {
    if (this.held(uid) !== 'tnt' || !this.bags.has(uid, 'tnt')) return;
    if (![data.x, data.y, data.z].every(Number.isInteger)) return;
    const pos = this.spot(uid);
    if (!pos || dist(pos, data) > tune.reach + 0.75 || this.runtime.world.get(data.x, data.y, data.z)) return;
    if (!this.bags.remove(uid, 'tnt', 1)) return;
    const bomb = { id: `tnt-${++this.seq}`, owner: uid, x: data.x + 0.5, y: data.y + 0.5, z: data.z + 0.5, left: tntcfg.fuse };
    this.emit({ kind: 'tnt', action: 'add', data: bomb });
    this.emit({ kind: 'bag', action: 'remove', uid, item: 'tnt', count: 1 });
  }

  fire(uid) {
    if (this.held(uid) !== 'fireball' || !this.bags.remove(uid, 'fireball', 1)) return;
    const pos = this.spot(uid);
    if (!pos) return;
    const dir = vector(pos);
    const ball = {
      id: `ball-${++this.seq}`,
      owner: uid,
      x: pos.x + dir.x * 0.9,
      y: pos.y + 1.45 + dir.y * 0.9,
      z: pos.z + dir.z * 0.9,
      vx: dir.x * ballcfg.speed,
      vy: dir.y * ballcfg.speed,
      vz: dir.z * ballcfg.speed,
      age: 0
    };
    this.emit({ kind: 'ball', action: 'add', data: ball });
    this.emit({ kind: 'swing', uid });
    this.emit({ kind: 'bag', action: 'remove', uid, item: 'fireball', count: 1 });
  }

  explode(owner, pos, tune) {
    const broken = blastblocks(this.runtime.world, pos, tune.radius, tune.power);
    this.emit({ kind: 'blast', pos, radius: tune.radius, blocks: broken });
    let changed = false;
    for (const uid of Object.keys(this.state.players)) {
      const player = this.state.players[uid];
      const spot = this.spot(uid);
      if (!spot || player.dead || player.out) continue;
      if (owner && uid !== owner && this.state.teams[uid] === this.state.teams[owner]) continue;
      const dx = spot.x - pos.x;
      const dy = spot.y + 0.9 - pos.y;
      const dz = spot.z - pos.z;
      const dist = Math.hypot(dx, dy, dz);
      if (dist >= tune.radius) continue;
      const power = blastscale(dist, tune.radius);
      const amount = Math.max(1, Math.round(tune.damage * power));
      const flat = Math.hypot(dx, dz) || 1;
      const force = { x: dx / flat * tune.knock * power, y: tune.knock * 0.45 * power, z: dz / flat * tune.knock * power };
      if (owner && owner !== uid) this.credit(uid, owner);
      const result = this.state.hurt(uid, amount);
      if (!result.ok) continue;
      changed = true;
      this.emit({ kind: 'hit', uid, from: owner, ...force });
      if (result.death) {
        this.finish(uid, owner && owner !== uid ? owner : this.killer(uid));
        if (result.mode === 'wait') this.timer(uid);
      }
    }
    if (changed) this.emit({ kind: 'state', data: this.state.dump() });
  }

  projectile(ball) {
    const pos = ball.mesh.position;
    let hit = ball.age >= ballcfg.life || Boolean(this.runtime.world.get(Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z)));
    if (!hit) {
      for (const uid of Object.keys(this.state.players)) {
        if (uid === ball.owner && ball.age < 0.25) continue;
        const player = this.state.players[uid];
        const spot = this.spot(uid);
        if (!spot || player.dead || player.out) continue;
        if (Math.hypot(spot.x - pos.x, spot.y + 0.9 - pos.y, spot.z - pos.z) < 0.65) {
          hit = true;
          break;
        }
      }
    }
    if (!hit) return;
    const at = { x: pos.x, y: pos.y, z: pos.z };
    this.emit({ kind: 'ball', action: 'del', id: ball.id });
    this.explode(ball.owner, at, ballcfg);
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

  endmine() {
    if (!this.minekey) return;
    this.minekey = '';
    this.local({ kind: 'mine', action: 'stop' });
  }

  begin(hit) {
    const key = `${hit.x}:${hit.y}:${hit.z}`;
    if (key === this.minekey) return;
    this.endmine();
    this.minekey = key;
    this.local({ kind: 'mine', action: 'start', x: hit.x, y: hit.y, z: hit.z });
  }

  interact() {
    const input = this.runtime.input;
    const left = input.click(0);
    const hold = input.button(0);
    const right = input.click(2);
    if (!left && !hold && !right) {
      this.endmine();
      return;
    }
    const camera = this.runtime.view.camera;
    const hit = cast(this.runtime.world, camera, tune.reach);

    if (right) {
      const store = this.shop.hit(camera, this.player.pos, this.team, hit?.dist ?? Infinity);
      if (store) {
        this.endmine();
        if (this.hud.shown) this.hud.toggle();
        this.shop.open(store.kind, this.state, this.uid, this.inv);
        return;
      }
      const slot = this.inv.slot();
      const def = slot ? item(slot.id) : null;
      if (def?.kind === 'block' && hit) {
        const pos = this.build.spot(hit, this.player);
        if (pos) this.local({ kind: 'place', item: def.id, block: def.block, x: pos.x, y: pos.y, z: pos.z });
      } else if (def?.id === 'tnt' && hit) {
        const pos = this.build.spot(hit, this.player);
        if (pos) this.local({ kind: 'tnt', x: pos.x, y: pos.y, z: pos.z });
      } else if (def?.id === 'fireball') {
        this.local({ kind: 'fire' });
      } else if (def?.id === 'apple') {
        this.local({ kind: 'eat' });
      }
    }

    if (!hold) {
      this.endmine();
      return;
    }

    const actor = this.actors.hit(camera, combat.reach);
    const bed = this.beds.hit(camera, tune.reach);
    const blockdist = hit?.dist ?? Infinity;
    const actordist = actor?.dist ?? Infinity;
    const beddist = bed?.dist ?? Infinity;

    if (actordist < blockdist && actordist < beddist) {
      this.endmine();
      if (left) this.local({ kind: 'attack', target: actor.uid });
      return;
    }
    if (beddist < blockdist) {
      this.endmine();
      if (left && bed.team !== this.team) {
        this.hand.swing();
        this.local({ kind: 'bed', team: bed.team });
      }
      return;
    }
    if (hit && this.runtime.world.kind(hit.x, hit.y, hit.z) === 2) {
      this.begin(hit);
      return;
    }
    this.endmine();
    if (left) this.local({ kind: 'attack', target: '' });
  }

  keys() {
    const input = this.runtime.input;
    if (this.victory.shown || this.chat.shown) return;
    if (input.press('KeyT') || input.press('Slash')) {
      this.shop.close(false);
      this.hud.close(false);
      this.chat.open(input.press('Slash'));
      return;
    }
    for (let i = 0; i < 9; i++) if (input.press(`Digit${i + 1}`)) this.hud.select(i);
    if (input.press('KeyE')) {
      if (this.shop.shown) this.shop.close();
      else this.hud.toggle();
    }
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
      yaw: this.player.yaw, pitch: this.player.pitch,
      crouch: this.player.crouch, speed,
      held: this.inv.slot()?.id ?? ''
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

  timerset(dt) {
    for (const [uid, left] of [...this.attacks]) {
      const next = left - dt;
      if (next <= 0) this.attacks.delete(uid);
      else this.attacks.set(uid, next);
    }
    for (const [uid, item] of [...this.credits]) {
      item.left -= dt;
      if (item.left <= 0) this.credits.delete(uid);
    }
  }

  tick(dt) {
    this.keys();
    this.timerset(dt);
    if (this.mode === 'end') return;
    if (this.host) {
      if (this.state.tick(dt)) this.emit({ kind: 'state', data: this.state.dump() });
      for (const gen of this.gens) gen.tick(dt, (base, out) => this.gen(base, out));
      this.mining(dt);
      this.bombs.tick(dt, bomb => {
        const pos = { x: bomb.mesh.position.x, y: bomb.mesh.position.y, z: bomb.mesh.position.z };
        this.emit({ kind: 'tnt', action: 'del', id: bomb.id });
        this.explode(bomb.owner, pos, tntcfg);
      });
      this.balls.tick(dt, ball => this.projectile(ball));
    } else {
      for (const gen of this.gens) gen.tick(dt);
      this.bombs.tick(dt);
      this.balls.tick(dt);
    }

    if (this.mode === 'out') {
      if (!this.menu()) this.fly.tick(dt);
      return;
    }
    if (this.mode === 'wait') {
      this.clock = Math.max(0, this.clock - dt);
      this.hud.count(Math.max(1, Math.ceil(this.clock)));
      return;
    }
    if (this.menu()) {
      this.endmine();
      return;
    }
    const was = this.player.ground;
    this.player.tick(dt);
    this.fall(was);
    this.snapshot(dt);
    this.pickup();
    if (this.runtime.input.locked) this.interact();
    else this.endmine();
  }

  frame(alpha) {
    const now = performance.now() / 1000;
    const dt = Math.min(0.1, now - this.stamp);
    this.stamp = now;
    if (this.mode !== 'out') this.player.frame(alpha);
    this.hand.hold(this.inv.slot()?.id ?? '');
    this.hand.frame(dt, this.mode === 'live' && !this.menu());
    this.actors.frame(dt);
    this.cracks.frame(dt);
    this.fx.frame(dt);
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
    for (const timer of this.away.values()) clearTimeout(timer);
    this.away.clear();
    this.drops.close();
    this.beds.close();
    this.holo.close();
    this.actors.close();
    this.cracks.close();
    this.hand.close();
    this.bombs.close();
    this.balls.close();
    this.fx.close();
    this.shop.closeall();
    this.chat.closeall();
    this.victory.closeall();
    this.endbtn.removeEventListener('click', this.endfn);
    this.endbtn.hidden = true;
  }
}

export { Arena };
