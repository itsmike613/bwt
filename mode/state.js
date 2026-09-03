import { health } from '../data/balance.js';

class State {
  constructor(room) {
    this.teams = {};
    this.players = {};
    for (const item of Object.values(room?.players ?? {})) {
      this.teams[item.uid] = item.team;
      this.players[item.uid] = { health: health.max, dead: false, out: false };
    }
    this.beds = { red: true, blue: true };
    this.breakers = { red: null, blue: null };
    this.winner = null;
  }

  load(data) {
    if (!data) return;
    this.players = structuredClone(data.players ?? this.players);
    this.beds = { ...this.beds, ...(data.beds ?? {}) };
    this.breakers = { ...this.breakers, ...(data.breakers ?? {}) };
    this.winner = data.winner ?? null;
  }

  dump() {
    return {
      players: structuredClone(this.players),
      beds: { ...this.beds },
      breakers: { ...this.breakers },
      winner: this.winner
    };
  }

  hurt(uid, amount) {
    const item = this.players[uid];
    if (!item || item.dead || item.out || this.winner) return { ok: false };
    const damage = Math.max(0, Math.floor(amount));
    if (!damage) return { ok: false };
    item.health = Math.max(0, item.health - damage);
    if (!item.health) return this.die(uid);
    return { ok: true, death: false, health: item.health };
  }

  die(uid) {
    const item = this.players[uid];
    if (!item || item.dead || item.out || this.winner) return { ok: false };
    const team = this.teams[uid];
    item.health = 0;
    item.dead = true;
    if (!this.beds[team]) item.out = true;
    this.win();
    return { ok: true, death: true, mode: item.out ? 'out' : 'wait' };
  }

  respawn(uid) {
    const item = this.players[uid];
    if (!item || item.out || !item.dead || this.winner) return false;
    item.dead = false;
    item.health = health.max;
    return true;
  }

  break(team, uid) {
    if (this.teams[uid] === team || !this.beds[team] || this.winner) return false;
    this.beds[team] = false;
    this.breakers[team] = uid;
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
