import * as THREE from 'three';
import { item, list } from '../data/item.js';
import { armor, shop } from '../data/balance.js';
import { distance, target } from './interact.js';

const tabs = ['Blocks', 'Weapons', 'Tools', 'Armor', 'Utility'];
const money = ['iron', 'gold', 'diamond', 'emerald'];

function label(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.font = 'bold 25px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#111';
  ctx.strokeText(text, 160, 32);
  ctx.fillStyle = color;
  ctx.fillText(text, 160, 32);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(3.1, 0.62, 1);
  sprite.userData.map = map;
  return sprite;
}

function stand(kind, team, pos) {
  const group = new THREE.Group();
  const color = team === 'red' ? 0xa94444 : 0x466eb6;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.64, 1.5, 0.64), new THREE.MeshLambertMaterial({ color }));
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.56, 0.72), new THREE.MeshLambertMaterial({ color: 0xc69a77 }));
  body.position.y = 0.75;
  head.position.y = 1.72;
  const title = kind === 'item' ? 'Item Shop' : 'Island Shop';
  const text = label(title, team === 'red' ? '#ff8989' : '#89b1ff');
  text.position.y = 2.35;
  const hit = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 2.12, 0.9),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
  );
  hit.position.y = 1.06;
  hit.userData.shop = { kind, team };
  group.add(body, head, text, hit);
  group.position.set(pos.x + 0.5, pos.y, pos.z + 0.5);
  return group;
}

class Shop {
  constructor(scene, input, markers, handlers = {}) {
    this.scene = scene;
    this.input = input;
    this.markers = markers;
    this.handlers = handlers;
    this.node = document.querySelector('#shop');
    this.title = document.querySelector('#shoptitle');
    this.tabs = document.querySelector('#shoptabs');
    this.cards = document.querySelector('#shopcards');
    this.money = document.querySelector('#shopmoney');
    this.note = document.querySelector('#shopnote');
    this.closebtn = document.querySelector('#shopclose');
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.kind = 'item';
    this.tab = 'Blocks';
    this.team = '';
    this.uid = '';
    this.state = null;
    this.inv = null;
    this.shown = false;
    this.build();
    this.closebtn?.addEventListener('click', () => this.close());
  }

  build() {
    for (const team of ['red', 'blue']) {
      for (const kind of ['item', 'island']) {
        const pos = this.markers?.[team]?.[kind];
        if (!pos) continue;
        this.group.add(stand(kind, team, pos));
      }
    }
  }

  near(pos, team) {
    if (!pos || !team) return '';
    for (const kind of ['item', 'island']) {
      if (distance(pos, this.markers?.[team]?.[kind]) <= shop.reach) return kind;
    }
    return '';
  }

  hit(camera, pos, team, block = Infinity) {
    if (!camera) return null;
    const origin = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
    const vec = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
    return target(origin, vec, pos, team, this.markers, shop.reach, block);
  }

  open(kind, state, uid, inv) {
    if (!['item', 'island'].includes(kind)) return false;
    this.kind = kind;
    this.state = state;
    this.uid = uid;
    this.team = state?.teams?.[uid] ?? '';
    this.inv = inv;
    this.shown = true;
    this.node.hidden = false;
    this.note.textContent = '';
    document.exitPointerLock?.();
    this.draw(state, uid, inv);
    return true;
  }

  close(capture = true) {
    if (!this.shown) return;
    this.shown = false;
    this.node.hidden = true;
    this.note.textContent = '';
    if (capture) this.input.node.requestPointerLock?.();
  }

  result(data) {
    if (!data || data.uid !== this.uid) return;
    const text = {
      funds: 'Not enough resources.',
      owned: 'You already own this tier or item.',
      order: 'Buy Forge I before Forge II.',
      space: 'Not enough inventory space.',
      range: 'Move closer to your shop.',
      effect: 'Golden Apple regeneration is already active.',
      default: 'That is your default equipment.',
      item: 'That purchase is not available.'
    };
    this.note.textContent = data.ok ? 'Purchased.' : (text[data.code] ?? 'Purchase failed.');
  }

  draw(state = this.state, uid = this.uid, inv = this.inv) {
    this.state = state;
    this.uid = uid;
    this.inv = inv;
    if (!this.shown || !state || !uid || !inv) return;
    this.team = state.teams?.[uid] ?? this.team;
    this.title.textContent = this.kind === 'item' ? 'Item Shop' : 'Island Shop';
    this.money.textContent = money.map(id => `${item(id).name}: ${inv.count(id)}`).join(' · ');
    this.tabs.hidden = this.kind !== 'item';
    this.tabs.textContent = '';
    this.cards.textContent = '';
    if (this.kind === 'item') this.items();
    else this.forges();
  }

  items() {
    for (const name of tabs) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = name;
      button.className = name === this.tab ? 'active' : '';
      button.addEventListener('click', () => {
        this.tab = name;
        this.draw();
      });
      this.tabs.append(button);
    }
    for (const def of list.filter(def => def.category === this.tab && shop.item[def.id])) {
      const tune = shop.item[def.id];
      const price = tune.cost ? `${tune.price} ${item(tune.cost).name}` : 'Default';
      const extra = tune.count > 1 ? ` ×${tune.count}` : '';
      const card = this.card(def.icon, `${def.name}${extra}`, price, def.text);
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Buy';
      let disabled = false;
      if (!tune.cost) {
        disabled = true;
        button.textContent = 'Default';
      } else if (def.kind === 'tool' && this.inv.count(def.id)) {
        disabled = true;
        button.textContent = 'Owned';
      } else if (def.kind === 'armor') {
        const current = armor[this.state.players?.[this.uid]?.armor]?.rank ?? 0;
        if (def.rank <= current) {
          disabled = true;
          button.textContent = 'Owned';
        }
      } else if (def.kind === 'weapon') {
        const current = list.filter(item => item.kind === 'weapon' && this.inv.count(item.id)).reduce((rank, item) => Math.max(rank, item.rank ?? 0), -1);
        if ((def.rank ?? 0) <= current) {
          disabled = true;
          button.textContent = 'Owned';
        }
      }
      button.disabled = disabled;
      button.addEventListener('click', () => this.handlers.buy?.(def.id));
      card.append(button);
      this.cards.append(card);
    }
  }

  forges() {
    const level = this.state.forge?.[this.team] ?? 0;
    for (const [id, tune] of Object.entries(shop.forge)) {
      const price = `${tune.price} ${item(tune.cost).name}`;
      const card = this.card('F', tune.name, price, tune.text);
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Buy';
      if (level >= tune.level) {
        button.disabled = true;
        button.textContent = 'Owned';
      } else if (tune.level !== level + 1) {
        button.disabled = true;
        button.textContent = 'Locked';
      }
      button.addEventListener('click', () => this.handlers.forge?.(id));
      card.append(button);
      this.cards.append(card);
    }
  }

  card(icon, name, price, text) {
    const card = document.createElement('article');
    card.className = 'shopitem';
    const mark = document.createElement('div');
    mark.className = 'shopicon';
    mark.textContent = icon || '?';
    const body = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = name;
    const cost = document.createElement('span');
    cost.className = 'shopprice';
    cost.textContent = price;
    const desc = document.createElement('p');
    desc.textContent = text || '';
    body.append(title, cost, desc);
    card.append(mark, body);
    return card;
  }

  closeall() {
    this.close(false);
    this.group.traverse(node => {
      node.geometry?.dispose();
      if (node.userData?.map) node.userData.map.dispose();
      node.material?.dispose?.();
    });
    this.group.parent?.remove(this.group);
  }
}

export { Shop };
