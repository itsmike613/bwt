import { message, players, valid } from '../data/room.js';
import { skin } from '../data/skins.js';
import { avatar } from '../core/skin.js';

class Lobby {
  constructor(handlers) {
    this.node = document.querySelector('#lobby');
    this.code = document.querySelector('#roomcode');
    this.players = document.querySelector('#players');
    this.error = document.querySelector('#lobbyerror');
    this.note = document.querySelector('#hostnote');
    this.random = document.querySelector('#random');
    this.start = document.querySelector('#start');
    this.handlers = handlers;
    this.random.addEventListener('click', () => this.handlers.random?.());
    this.start.addEventListener('click', () => this.handlers.start?.());
  }

  show() {
    this.node.hidden = false;
  }

  hide() {
    this.node.hidden = true;
  }

  fail(code) {
    this.error.textContent = message(code);
  }

  draw(room, self, code) {
    this.show();
    this.code.textContent = code;
    this.error.textContent = '';
    this.players.replaceChildren();
    const host = room.host === self;
    const list = players(room).sort((a, b) => (a.joined ?? 0) - (b.joined ?? 0) || a.name.localeCompare(b.name));

    for (const item of list) {
      const card = document.createElement('article');
      card.className = `player ${item.team}`;
      const face = document.createElement('canvas');
      face.width = 48;
      face.height = 48;
      face.className = 'face';
      avatar(face, skin(item.skin).file);
      const text = document.createElement('div');
      text.className = 'playertext';
      const name = document.createElement('strong');
      name.textContent = item.name;
      const role = document.createElement('span');
      role.textContent = item.uid === room.host ? 'Host' : 'Player';
      text.append(name, role);
      const team = document.createElement(host ? 'button' : 'span');
      team.className = `team ${item.team}`;
      team.textContent = item.team === 'none' ? 'Unassigned' : item.team === 'red' ? 'Red' : 'Blue';
      if (host) team.addEventListener('click', () => this.handlers.cycle?.(item.uid));
      card.append(face, text, team);
      this.players.append(card);
    }

    const check = valid(room);
    this.random.hidden = !host;
    this.start.hidden = !host;
    this.start.disabled = !check.ok;
    this.note.textContent = host ? `Host controls · Red ${check.red}/5 · Blue ${check.blue}/5` : 'Waiting for the host to assign teams and start.';
    if (host && !check.ok) this.error.textContent = message(check.code);
  }
}

export { Lobby };
