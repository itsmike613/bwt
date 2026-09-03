import * as THREE from 'three';

const defs = [
  { path: ['red', 'spawn'], name: 'Red spawn' },
  { path: ['blue', 'spawn'], name: 'Blue spawn' },
  { path: ['red', 'bed'], name: 'Red bed' },
  { path: ['blue', 'bed'], name: 'Blue bed' },
  { path: ['red', 'forge'], name: 'Red team forge' },
  { path: ['blue', 'forge'], name: 'Blue team forge' },
  { path: ['diamond'], name: 'Diamond generator', many: true },
  { path: ['emerald'], name: 'Emerald generator', many: true },
  { path: ['spectator'], name: 'Spectator waiting' },
  { path: ['red', 'item'], name: 'Red Item Shop' },
  { path: ['blue', 'item'], name: 'Blue Item Shop' },
  { path: ['red', 'island'], name: 'Red Island Shop' },
  { path: ['blue', 'island'], name: 'Blue Island Shop' }
];

function put(data, path, value, many) {
  let node = data;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!node[key] || typeof node[key] !== 'object' || Array.isArray(node[key])) node[key] = {};
    node = node[key];
  }
  const key = path[path.length - 1];
  if (many) {
    if (!Array.isArray(node[key])) node[key] = [];
    node[key].push(value);
  } else {
    node[key] = value;
  }
}

function drop(data, path) {
  let node = data;
  for (let i = 0; i < path.length - 1; i++) {
    node = node?.[path[i]];
    if (!node) return;
  }
  delete node[path[path.length - 1]];
}

function walk(data, path = [], out = []) {
  if (!data || typeof data !== 'object') return out;
  if (Number.isFinite(data.x) && Number.isFinite(data.y) && Number.isFinite(data.z)) {
    out.push({ path, pos: data });
    return out;
  }
  if (Array.isArray(data)) {
    for (const item of data) walk(item, path, out);
    return out;
  }
  for (const [key, value] of Object.entries(data)) walk(value, [...path, key], out);
  return out;
}

function label(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 48;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 256, 48);
  ctx.font = 'bold 22px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#111';
  ctx.strokeText(text, 128, 24);
  ctx.fillStyle = color;
  ctx.fillText(text, 128, 24);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(3.2, 0.6, 1);
  sprite.userData.texture = texture;
  return sprite;
}

function title(path) {
  const def = defs.find(item => item.path.join('.') === path.join('.'));
  return def?.name ?? path.join(' ');
}

class Mark {
  constructor(scene) {
    this.scene = scene;
    this.data = {};
    this.group = new THREE.Group();
    scene.add(this.group);
  }

  set(def, pos) {
    put(this.data, def.path, { x: pos.x, y: pos.y, z: pos.z }, Boolean(def.many));
    this.draw();
  }

  clear(def) {
    drop(this.data, def.path);
    this.draw();
  }

  load(data) {
    this.data = data && typeof data === 'object' ? structuredClone(data) : {};
    this.draw();
  }

  draw() {
    this.group.traverse(node => {
      if (node.geometry) node.geometry.dispose();
      if (node.material?.map) node.material.map.dispose();
      if (node.material) node.material.dispose();
    });
    this.group.clear();

    for (const item of walk(this.data)) {
      const name = title(item.path);
      const red = item.path[0] === 'red';
      const blue = item.path[0] === 'blue';
      const color = red ? 0xff5555 : blue ? 0x5599ff : 0xffdd55;
      const css = red ? '#ff7777' : blue ? '#77aaff' : '#ffe277';
      const geo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
      const mat = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.9 });
      const cube = new THREE.Mesh(geo, mat);
      cube.position.set(item.pos.x + 0.5, item.pos.y + 0.5, item.pos.z + 0.5);
      const text = label(name, css);
      text.position.set(item.pos.x + 0.5, item.pos.y + 1.25, item.pos.z + 0.5);
      this.group.add(cube, text);
    }
  }
}

export { Mark, defs };
