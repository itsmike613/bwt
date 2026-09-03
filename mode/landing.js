import { form, message } from '../data/room.js';

class Landing {
  constructor(skins, handlers) {
    this.node = document.querySelector('#landing');
    this.user = document.querySelector('#username');
    this.skin = document.querySelector('#skin');
    this.invite = document.querySelector('#invite');
    this.create = document.querySelector('#create');
    this.join = document.querySelector('#join');
    this.handlers = handlers;
    this.skins = skins;
    for (const item of skins) {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.name;
      this.skin.append(option);
    }
    this.create.addEventListener('click', () => this.send('create'));
    this.join.addEventListener('click', () => this.send('join'));
  }

  clear() {
    for (const id of ['usererror', 'skinerror', 'inviteerror', 'actionerror']) {
      document.querySelector(`#${id}`).textContent = '';
    }
  }

  error(errors = {}) {
    this.clear();
    if (errors.user) document.querySelector('#usererror').textContent = errors.user;
    if (errors.skin) document.querySelector('#skinerror').textContent = errors.skin;
    if (errors.invite) document.querySelector('#inviteerror').textContent = errors.invite;
    if (errors.action) document.querySelector('#actionerror').textContent = errors.action;
  }

  fail(code) {
    if (code === 'taken' || code === 'missing' || code === 'full' || code === 'started') {
      this.error({ invite: message(code) });
      return;
    }
    if (code === 'config') {
      this.error({ action: 'Firebase is not configured yet. Follow firebase.md and fill data/firebase.js.' });
      return;
    }
    this.error({ action: 'Could not connect to Firebase. Check your setup and try again.' });
  }

  busy(on) {
    this.create.disabled = on;
    this.join.disabled = on;
  }

  async send(kind) {
    const known = this.skins.map(item => item.id);
    const check = form(this.user.value, this.skin.value, this.invite.value, known);
    if (!check.ok) {
      this.error(check.errors);
      return;
    }
    this.error();
    this.busy(true);
    try {
      await this.handlers[kind]?.(check);
    } finally {
      this.busy(false);
    }
  }

  show() {
    this.node.hidden = false;
  }

  hide() {
    this.node.hidden = true;
  }
}

export { Landing };
