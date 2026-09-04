import { Arena } from './arena.js';

class Match {
  constructor(handlers = {}) {
    this.handlers = handlers;
    this.node = document.querySelector('#match');
    this.code = document.querySelector('#matchcode');
    this.net = document.querySelector('#network');
    this.stage = document.querySelector('#stage');
    this.hud = document.querySelector('#hud');
    this.arena = null;
    this.task = null;
    this.key = '';
    this.queue = [];
    this.token = 0;
    this.room = null;
  }

  open(code, room, uid, peer) {
    this.room = room;
    const key = `${code}:${room.started ?? 'match'}`;
    if (this.key === key && (this.arena || this.task)) {
      this.arena?.roster(room);
      return this.task ?? Promise.resolve();
    }
    this.close();
    this.key = key;
    this.code.textContent = code;
    this.node.hidden = false;
    this.stage.hidden = true;
    this.hud.hidden = true;
    const token = this.token;
    this.task = this.load(room, uid, peer, token).finally(() => {
      this.task = null;
    });
    return this.task;
  }

  async load(room, uid, peer, token) {
    const response = await fetch('./data/map.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not load data/map.json.');
    const data = await response.json();
    if (token !== this.token) return;
    const latest = this.room ?? room;
    const arena = new Arena(this.stage, latest, uid, peer, data, this.handlers);
    this.arena = arena;
    this.stage.hidden = false;
    this.hud.hidden = false;
    this.node.hidden = true;
    arena.start();
    for (const item of this.queue.splice(0)) arena.data(item.from, item.data);
  }

  data(from, data) {
    if (this.arena) this.arena.data(from, data);
    else this.queue.push({ from, data });
  }

  network(open, total, host) {
    const target = host ? total : Math.min(total, 1);
    if (this.arena) this.arena.network(open, target);
    else this.net.textContent = `WebRTC ${open}/${target} connected`;
  }

  close() {
    this.token++;
    this.arena?.close();
    this.arena = null;
    this.queue.length = 0;
    this.key = '';
    this.room = null;
    this.node.hidden = true;
    this.stage.hidden = true;
    this.hud.hidden = true;
  }
}

export { Match };
