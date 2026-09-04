import { apple, armor, health } from '../data/balance.js';

class State {
  constructor(room) {
    this.teams = {};
    this.players = {};
    this.stats = {};
    for (const item of Object.values(room?.players ?? {})) {
      this.teams[item.uid] = item.team;
      this.players[item.uid] = { health: health.max, dead: false, out: false, armor: 'leather', regen: 0, pulse: 0 };
      this.stats[item.uid] = { kills: 0, deaths: 0, beds: 0 };
    }
    this.beds = { red: true, blue: true };
    this.breakers = { red: null, blue: null };
    this.forge = { red: 0, blue: 0 };
    this.winner = null;
  }

  load(data) {
    if (!data) return;
    this.players = structuredClone(data.players ?? this.players);
    for (const player of Object.values(this.players)) {
      if (!armor[player.armor]) player.armor = 'leather';
      player.regen = Math.max(0, Number(player.regen) || 0);
      player.pulse = Math.max(0, Number(player.pulse) || 0);
    }
    this.stats = structuredClone(data.stats ?? this.stats);
    for (const uid of Object.keys(this.players)) {
      const score = this.stats[uid] ?? {};
      this.stats[uid] = { kills: Math.max(0, Number(score.kills) || 0), deaths: Math.max(0, Number(score.deaths) || 0), beds: Math.max(0, Number(score.beds) || 0) };
    }
    this.beds = { ...this.beds, ...(data.beds ?? {}) };
    this.breakers = { ...this.breakers, ...(data.breakers ?? {}) };
    this.forge = { ...this.forge, ...(data.forge ?? {}) };
    this.winner = data.winner ?? null;
  }

  dump() {
    return {
      players: structuredClone(this.players),
      stats: structuredClone(this.stats),
      beds: { ...this.beds },
      breakers: { ...this.breakers },
      forge: { ...this.forge },
      winner: this.winner
    };
  }

  hurt(uid, amount, guard = true) {
    const player = this.players[uid];
    if (!player || player.dead || player.out || this.winner) return { ok: false };
    let damage = Math.max(0, Math.floor(amount));
    if (guard && damage) damage = Math.max(1, Math.round(damage * (1 - (armor[player.armor]?.reduce ?? 0))));
    if (!damage) return { ok: false };
    player.health = Math.max(0, player.health - damage);
    if (!player.health) return this.die(uid);
    return { ok: true, death: false, health: player.health, damage };
  }

  heal(uid, amount) {
    const player = this.players[uid];
    if (!player || player.dead || player.out || this.winner) return false;
    const before = player.health;
    player.health = Math.min(health.max, player.health + Math.max(0, Math.floor(amount)));
    return player.health !== before;
  }

  arm(uid, tier) {
    const player = this.players[uid];
    const next = armor[tier];
    const now = armor[player?.armor];
    if (!player || !next || !now || next.rank <= now.rank) return false;
    player.armor = tier;
    return true;
  }

  upgrade(team, level) {
    if (!['red', 'blue'].includes(team) || !Number.isInteger(level) || level !== this.forge[team] + 1 || level < 1 || level > 2) return false;
    this.forge[team] = level;
    return true;
  }

  eat(uid) {
    const player = this.players[uid];
    if (!player || player.dead || player.out || this.winner || player.regen > 0) return false;
    player.regen = apple.time;
    player.pulse = 0;
    return true;
  }

  tick(dt) {
    let changed = false;
    for (const player of Object.values(this.players)) {
      if (player.dead || player.out || player.regen <= 0) continue;
      const before = player.regen;
      const active = Math.min(before, dt);
      player.regen = Math.max(0, player.regen - dt);
      player.pulse += active;
      while (player.pulse >= apple.every && before > 0) {
        player.pulse -= apple.every;
        const old = player.health;
        player.health = Math.min(health.max, player.health + apple.heal);
        if (player.health !== old) changed = true;
      }
      if (before > 0 && player.regen === 0) changed = true;
    }
    return changed;
  }

  score(uid, killer = null) {
    const death = this.stats[uid];
    if (!death) return false;
    death.deaths++;
    if (killer && killer !== uid && this.stats[killer]) this.stats[killer].kills++;
    return true;
  }

  leave(uid) {
    const player = this.players[uid];
    if (!player || player.out || this.winner) return false;
    player.health = 0;
    player.dead = true;
    player.out = true;
    player.regen = 0;
    player.pulse = 0;
    this.win();
    return true;
  }

  die(uid) {
    const player = this.players[uid];
    if (!player || player.dead || player.out || this.winner) return { ok: false };
    const team = this.teams[uid];
    player.health = 0;
    player.dead = true;
    player.regen = 0;
    player.pulse = 0;
    if (!this.beds[team]) player.out = true;
    this.win();
    return { ok: true, death: true, mode: player.out ? 'out' : 'wait' };
  }

  respawn(uid) {
    const player = this.players[uid];
    if (!player || player.out || !player.dead || this.winner) return false;
    player.dead = false;
    player.health = health.max;
    player.regen = 0;
    player.pulse = 0;
    return true;
  }

  break(team, uid) {
    if (this.teams[uid] === team || !this.beds[team] || this.winner) return false;
    this.beds[team] = false;
    this.breakers[team] = uid;
    if (this.stats[uid]) this.stats[uid].beds++;
    this.win();
    return true;
  }

  win() {
    for (const team of ['red', 'blue']) {
      if (this.beds[team]) continue;
      const list = Object.keys(this.players).filter(uid => this.teams[uid] === team);
      if (list.length && list.every(uid => this.players[uid].out)) {
        this.winner = team === 'red' ? 'blue' : 'red';
        return this.winner;
      }
    }
    return null;
  }
}

export { State };
