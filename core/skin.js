import * as THREE from 'three';

const cache = new Map();
const size = 64;

function rect(x, y, w, h) {
  const u0 = x / size;
  const u1 = (x + w) / size;
  const v0 = 1 - (y + h) / size;
  const v1 = 1 - y / size;
  return [u0, v0, u1, v1];
}

function quad(pos, uv, a, b, c, d, box) {
  const start = pos.length / 3;
  for (const point of [a, b, c, d]) pos.push(...point);
  const [u0, v0, u1, v1] = box;
  uv.push(u0, v0, u1, v0, u1, v1, u0, v1);
  return [start, start + 1, start + 2, start, start + 2, start + 3];
}

function cube(w, h, d, map) {
  const x = w / 2;
  const y = h / 2;
  const z = d / 2;
  const pos = [];
  const uv = [];
  const index = [];
  index.push(...quad(pos, uv, [x,-y,z], [x,-y,-z], [x,y,-z], [x,y,z], map.right));
  index.push(...quad(pos, uv, [-x,-y,-z], [-x,-y,z], [-x,y,z], [-x,y,-z], map.left));
  index.push(...quad(pos, uv, [-x,y,z], [x,y,z], [x,y,-z], [-x,y,-z], map.top));
  index.push(...quad(pos, uv, [-x,-y,-z], [x,-y,-z], [x,-y,z], [-x,-y,z], map.bottom));
  index.push(...quad(pos, uv, [-x,-y,z], [x,-y,z], [x,y,z], [-x,y,z], map.front));
  index.push(...quad(pos, uv, [x,-y,-z], [-x,-y,-z], [-x,y,-z], [x,y,-z], map.back));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(index);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

function maps(kind) {
  const data = {
    head: [8,0,8,8, 16,0,8,8, 0,8,8,8, 8,8,8,8, 16,8,8,8, 24,8,8,8],
    body: [20,16,8,4, 28,16,8,4, 16,20,4,12, 20,20,8,12, 28,20,4,12, 32,20,8,12],
    arm: [44,16,4,4, 48,16,4,4, 40,20,4,12, 44,20,4,12, 48,20,4,12, 52,20,4,12],
    leg: [4,16,4,4, 8,16,4,4, 0,20,4,12, 4,20,4,12, 8,20,4,12, 12,20,4,12],
    larm: [36,48,4,4, 40,48,4,4, 32,52,4,12, 36,52,4,12, 40,52,4,12, 44,52,4,12],
    lleg: [20,48,4,4, 24,48,4,4, 16,52,4,12, 20,52,4,12, 24,52,4,12, 28,52,4,12],
    hat: [40,0,8,8, 48,0,8,8, 32,8,8,8, 40,8,8,8, 48,8,8,8, 56,8,8,8],
    coat: [20,32,8,4, 28,32,8,4, 16,36,4,12, 20,36,8,12, 28,36,4,12, 32,36,8,12],
    rarm: [44,32,4,4, 48,32,4,4, 40,36,4,12, 44,36,4,12, 48,36,4,12, 52,36,4,12],
    rleg: [4,32,4,4, 8,32,4,4, 0,36,4,12, 4,36,4,12, 8,36,4,12, 12,36,4,12],
    lcoat: [52,48,4,4, 56,48,4,4, 48,52,4,12, 52,52,4,12, 56,52,4,12, 60,52,4,12],
    lpants: [4,48,4,4, 8,48,4,4, 0,52,4,12, 4,52,4,12, 8,52,4,12, 12,52,4,12]
  }[kind];
  return {
    top: rect(...data.slice(0, 4)),
    bottom: rect(...data.slice(4, 8)),
    right: rect(...data.slice(8, 12)),
    front: rect(...data.slice(12, 16)),
    left: rect(...data.slice(16, 20)),
    back: rect(...data.slice(20, 24))
  };
}

function texture(file) {
  const old = cache.get(file);
  if (old) return old;
  const tex = new THREE.TextureLoader().load(file);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(file, tex);
  return tex;
}

function mesh(kind, scale, mat, grow = 0) {
  const arms = ['arm', 'larm', 'rarm', 'lcoat'];
  const legs = ['leg', 'lleg', 'rleg', 'lpants'];
  const bodies = ['body', 'coat'];
  const dims = arms.includes(kind) ? [4, 12, 4] : legs.includes(kind) ? [4, 12, 4] : bodies.includes(kind) ? [8, 12, 4] : [8, 8, 8];
  return new THREE.Mesh(cube(dims[0] * scale + grow, dims[1] * scale + grow, dims[2] * scale + grow, maps(kind)), mat);
}

class Skin {
  constructor(file) {
    const tex = texture(file);
    // Minecraft skins are cutout textures. Alpha testing keeps opaque pixels in the
    // normal depth pass and avoids transparent-object sorting artifacts between limbs.
    const base = new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5 });
    const layer = new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5 });
    const scale = 1.8 / 32;
    this.group = new THREE.Group();
    this.offset = 0;
    this.head = mesh('head', scale, base);
    this.body = mesh('body', scale, base);
    this.arm = mesh('arm', scale, base);
    this.larm = mesh('larm', scale, base);
    this.leg = mesh('leg', scale, base);
    this.lleg = mesh('lleg', scale, base);
    const grow = scale * 0.5;
    this.hat = mesh('hat', scale, layer, grow);
    this.coat = mesh('coat', scale, layer, grow);
    this.rarm = mesh('rarm', scale, layer, grow);
    this.lcoat = mesh('lcoat', scale, layer, grow);
    this.rleg = mesh('rleg', scale, layer, grow);
    this.lpants = mesh('lpants', scale, layer, grow);
    for (const item of [this.head, this.hat]) item.position.y = 28 * scale;
    for (const item of [this.body, this.coat]) item.position.y = 18 * scale;
    for (const item of [this.arm, this.rarm]) item.position.set(-6 * scale, 18 * scale, 0);
    for (const item of [this.larm, this.lcoat]) item.position.set(6 * scale, 18 * scale, 0);
    for (const item of [this.leg, this.rleg]) item.position.set(-2 * scale, 6 * scale, 0);
    for (const item of [this.lleg, this.lpants]) item.position.set(2 * scale, 6 * scale, 0);
    this.toolmat = new THREE.MeshLambertMaterial({ color: 0xb8b8b8 });
    this.tool = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.7, 0.11), this.toolmat);
    this.tool.position.set(0, -0.48, -0.12);
    this.tool.rotation.x = -0.35;
    this.tool.visible = false;
    this.arm.add(this.tool);
    this.group.add(this.head, this.hat, this.body, this.coat, this.arm, this.rarm, this.larm, this.lcoat, this.leg, this.rleg, this.lleg, this.lpants);
  }

  walk(value) {
    const swing = Math.sin(value) * 0.65;
    for (const item of [this.arm, this.rarm]) item.rotation.x = swing;
    for (const item of [this.larm, this.lcoat]) item.rotation.x = -swing;
    for (const item of [this.leg, this.rleg]) item.rotation.x = -swing;
    for (const item of [this.lleg, this.lpants]) item.rotation.x = swing;
  }

  crouch(on) {
    this.offset = on ? -0.18 : 0;
  }

  hold(kind = '') {
    this.tool.visible = Boolean(kind);
    if (!kind) return;
    const color = kind === 'sword' ? 0xd8d8d8 : kind === 'pickaxe' ? 0xa9a9a9 : kind === 'axe' ? 0x9b744c : kind === 'shears' ? 0xc7c7c7 : kind === 'block' ? 0xd85b5b : 0xb8b8b8;
    this.toolmat.color.setHex(color);
    if (kind === 'block') this.tool.scale.set(2.6, 0.42, 2.6);
    else if (kind === 'shears') this.tool.scale.set(0.7, 0.65, 0.7);
    else this.tool.scale.set(1, 1, 1);
  }

  swing(value = 0) {
    if (!value) return;
    const angle = Math.sin(Math.min(1, value) * Math.PI) * 1.25;
    this.arm.rotation.x -= angle;
    this.rarm.rotation.x -= angle;
  }

  close() {
    const mats = new Set();
    this.group.traverse(node => {
      node.geometry?.dispose();
      if (node.material) mats.add(node.material);
    });
    for (const mat of mats) mat.dispose();
    this.group.parent?.remove(this.group);
  }
}

function avatar(canvas, file) {
  const draw = image => {
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 8, 8, 8, 8, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 40, 8, 8, 8, 0, 0, canvas.width, canvas.height);
  };
  let image = cache.get(`image:${file}`);
  if (!image) {
    image = new Image();
    image.src = file;
    cache.set(`image:${file}`, image);
  }
  if (image.complete) draw(image);
  else image.addEventListener('load', () => draw(image), { once: true });
}

export { Skin, avatar };
