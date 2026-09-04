import { chat as tune } from '../data/balance.js';

class Chat {
  constructor(input, send) {
    this.input = input;
    this.send = send;
    this.node = document.querySelector('#chat');
    this.list = document.querySelector('#chatlist');
    this.form = document.querySelector('#chatform');
    this.field = document.querySelector('#chatinput');
    this.shown = false;
    this.items = [];
    this.timer = null;
    this.frame = null;
    this.life = Math.max(1, Number(tune.visible) || 7) * 1000;
    this.limit = Math.max(1, Number(tune.history) || 50);
    this.submit = event => {
      event.preventDefault();
      event.stopPropagation();
      const text = this.field.value.trim();
      if (text) this.send?.(text);
      this.close();
    };
    this.key = event => {
      event.stopPropagation();
      if (event.key !== 'Escape' || !this.shown) return;
      event.preventDefault();
      this.close();
    };
    this.fade = event => {
      const line = event.target;
      if (event.propertyName !== 'opacity' || this.shown || !line?.classList?.contains('fade')) return;
      line.hidden = true;
    };
    this.form.addEventListener('submit', this.submit);
    this.field.addEventListener('keydown', this.key);
    this.list.addEventListener('transitionend', this.fade);
  }

  open(command = false) {
    if (this.shown) return;
    this.shown = true;
    clearTimeout(this.timer);
    this.timer = null;
    this.form.hidden = false;
    this.field.value = command ? '/' : '';
    this.input.release();
    this.refresh();
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      if (!this.shown) return;
      this.field.focus();
      this.field.setSelectionRange(this.field.value.length, this.field.value.length);
    });
  }

  close(capture = true) {
    if (!this.shown) return;
    this.shown = false;
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    this.form.hidden = true;
    this.field.value = '';
    this.field.blur();
    this.refresh();
    if (capture) this.input.capture();
  }

  add(data) {
    const system = Boolean(data?.system);
    if (!data?.text || (!system && !data?.name)) return;
    const line = document.createElement('div');
    const kind = system ? 'system' : (data.shout ? 'shout' : data.team ?? '');
    line.className = `chatline ${kind}`.trim();
    line.textContent = system ? data.text : (data.shout ? `[SHOUT] ${data.name}: ${data.text}` : `${data.name}: ${data.text}`);
    const entry = { node: line, stamp: Date.now() };
    this.items.push(entry);
    this.list.append(line);
    while (this.items.length > this.limit) {
      const old = this.items.shift();
      old?.node.remove();
    }
    this.refresh();
  }

  refresh() {
    const now = Date.now();
    for (const item of this.items) {
      const old = now - item.stamp >= this.life;
      if (this.shown || !old) {
        item.node.hidden = false;
        item.node.classList.remove('fade');
      } else if (!item.node.hidden) {
        item.node.classList.add('fade');
      }
    }
    this.plan(now);
  }

  plan(now = Date.now()) {
    clearTimeout(this.timer);
    this.timer = null;
    if (this.shown) return;
    let wait = Infinity;
    for (const item of this.items) {
      const left = this.life - (now - item.stamp);
      if (left > 0) wait = Math.min(wait, left);
    }
    if (!Number.isFinite(wait)) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.refresh();
    }, Math.max(1, wait));
  }

  closeall() {
    this.close(false);
    clearTimeout(this.timer);
    this.timer = null;
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    this.form.removeEventListener('submit', this.submit);
    this.field.removeEventListener('keydown', this.key);
    this.list.removeEventListener('transitionend', this.fade);
    this.form.hidden = true;
    this.field.value = '';
    this.items.length = 0;
    this.list.replaceChildren();
  }
}

export { Chat };
