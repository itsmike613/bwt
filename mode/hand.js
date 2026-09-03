import * as THREE from 'three';
import { item } from '../data/item.js';

function shape(def) {
  if (!def) return { color: 0xc89472, scale: [0.18, 0.55, 0.18] };
  if (def.kind === 'weapon') return { color: def.id === 'swordwood' ? 0x9b744c : def.id === 'swordiron' ? 0xc8c8c8 : 0x7dd7e8, scale: [0.1, 0.85, 0.1] };
  if (def.kind === 'tool') return { color: 0xb8b8b8, scale: [0.12, 0.72, 0.12] };
  if (def.kind === 'block') return { color: def.id === 'obsidian' ? 0x2f253b : def.id === 'wood' ? 0x8b6a45 : 0xd1c7a0, scale: [0.32, 0.32, 0.32] };
  if (def.id === 'tnt') return { color: 0xc94e4e, scale: [0.32, 0.32, 0.32] };
  if (def.id === 'fireball') return { color: 0xff7a2f, scale: [0.25, 0.25, 0.25] };
  if (def.id === 'apple') return { color: 0xf0c94b, scale: [0.24, 0.28, 0.24] };
  return { color: 0xc89472, scale: [0.18, 0.55, 0.18] };
}

class Hand {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.mat = new THREE.MeshLambertMaterial({ color: 0xc89472 });
    this.mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), this.mat);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
    this.id = '';
    this.time = 0;
    this.mining = false;
    this.phase = 0;
    this.pos = new THREE.Vector3();
    this.base = new THREE.Vector3(0.48, -0.43, -0.7);
    this.quat = new THREE.Quaternion();
    this.swingq = new THREE.Quaternion();
    this.euler = new THREE.Euler();
    this.hold('');
  }

  hold(id = '') {
    if (id === this.id) return;
    this.id = id;
    const def = item(id);
    const data = shape(def);
    this.mat.color.setHex(data.color);
    this.mesh.scale.set(...data.scale);
  }

  swing() {
    this.time = 0.28;
  }

  mine(on) {
    this.mining = on;
    if (!on) this.phase = 0;
  }

  frame(dt, shown = true) {
    this.mesh.visible = shown;
    if (!shown) return;
    this.time = Math.max(0, this.time - dt);
    if (this.mining) this.phase = (this.phase + dt * 4) % 1;
    const phase = this.time ? 1 - this.time / 0.28 : this.mining ? this.phase : 0;
    const arc = this.time || this.mining ? Math.sin(phase * Math.PI) : 0;
    this.pos.copy(this.base);
    this.pos.x -= arc * 0.22;
    this.pos.y -= arc * 0.18;
    this.pos.z += arc * 0.12;
    this.pos.applyQuaternion(this.camera.quaternion).add(this.camera.position);
    this.mesh.position.copy(this.pos);
    this.quat.copy(this.camera.quaternion);
    this.euler.set(-0.35 - arc * 0.9, 0.18, 0.18 + arc * 0.4, 'XYZ');
    this.swingq.setFromEuler(this.euler);
    this.quat.multiply(this.swingq);
    this.mesh.quaternion.copy(this.quat);
  }

  close() {
    this.mesh.geometry.dispose();
    this.mat.dispose();
    this.mesh.parent?.remove(this.mesh);
  }
}

export { Hand };
