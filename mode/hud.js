import { item } from '../data/item.js';
import { health as tune } from '../data/balance.js';

class Hud {
  constructor(input) {
    this.input = input;
    this.health = document.querySelector('#health');
    this.bar = document.querySelector('#bar');
    this.hotbar = document.querySelector('#hotbar');
    this.inventory = document.querySelector('#inventory');
    this.grid = document.querySelector('#grid');
    this.countdown = document.querySelector('#countdown');
    this.notice = document.querySelector('#notice');
    this.beds = document.querySelector('#beds');
    this.network = document.querySelector('#network');
    this.armor = document.querySelector('#armor');
    this.regen = document.querySelector('#regen');
    this.info = document.querySelector('#info');
    this.cross = document.querySelector('#cross');
    this.flash = null;
    this.slots = [];
    this.hold = null;
    this.shown = false;
    for (let i = 0; i < 36; i++) {
      const node = document.createElement('button');
      node.type = 'button';
      node.className = 'slot';
      node.dataset.index = String(i);
      node.addEventListener('click', () => this.click(i));
      this.grid.append(node);
      this.slots.push(node);
      if (i < 9) {
        const copy = document.createElement('div');
        copy.className = 'slot';
        copy.dataset.index = String(i);
        this.hotbar.append(copy);
      }
    }
  }

  bind(inv) {
    this.inv = inv;
    this.draw();
  }

  click(index) {
    if (!this.inv) return;
    if (this.hold === null) {
      this.hold = index;
    } else {
      this.inv.swap(this.hold, index);
      this.hold = null;
    }
    this.draw();
  }

  toggle() {
    this.shown = !this.shown;
    this.inventory.hidden = !this.shown;
    this.hold = null;
    if (this.shown) document.exitPointerLock?.();
    else this.input.node.requestPointerLock?.();
    this.draw();
    return this.shown;
  }

  select(index) {
    this.inv?.select(index);
    this.draw();
  }

  slot(node, data, index, hot = false) {
    const def = data ? item(data.id) : null;
    node.textContent = '';
    node.classList.toggle('selected', hot && this.inv?.pick === index);
    node.classList.toggle('picked', !hot && this.hold === index);
    if (!data || !def) return;
    const name = document.createElement('span');
    name.className = 'thing';
    name.textContent = def.name;
    const count = document.createElement('span');
    count.className = 'count';
    count.textContent = String(data.count);
    node.append(name, count);
  }

  draw(state = null, uid = '') {
    if (this.inv) {
      for (let i = 0; i < this.slots.length; i++) this.slot(this.slots[i], this.inv.slots[i], i);
      const list = this.hotbar.children;
      for (let i = 0; i < 9; i++) this.slot(list[i], this.inv.slots[i], i, true);
    }
    if (!state || !uid) return;
    const player = state.players?.[uid];
    const value = player?.health ?? 0;
    this.health.textContent = `${value} / ${tune.max}`;
    this.bar.style.width = `${Math.max(0, Math.min(100, value / tune.max * 100))}%`;
    const red = state.beds?.red ? 'Red bed ✓' : 'Red bed ✕';
    const blue = state.beds?.blue ? 'Blue bed ✓' : 'Blue bed ✕';
    this.beds.textContent = `${red} · ${blue}`;
    const tier = player?.armor ?? 'leather';
    this.armor.textContent = `${tier[0].toUpperCase()}${tier.slice(1)} Armor`;
    this.regen.hidden = !(player?.regen > 0);
  }

  count(value) {
    if (!value) {
      this.countdown.hidden = true;
      this.countdown.textContent = '';
      return;
    }
    this.countdown.hidden = false;
    this.countdown.textContent = String(value);
  }

  say(text = '') {
    this.notice.hidden = !text;
    this.notice.textContent = text;
  }

  hit() {
    clearTimeout(this.flash);
    this.cross?.classList.add('hit');
    this.flash = setTimeout(() => this.cross?.classList.remove('hit'), 120);
  }

  net(open, total) {
    this.network.textContent = `WebRTC ${open}/${total} connected`;
  }
}

export { Hud };
