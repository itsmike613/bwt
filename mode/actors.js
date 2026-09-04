import * as THREE from 'three';
import { Skin } from '../core/skin.js';
import { face, turn } from '../core/pose.js';
import { skin as find } from '../data/skins.js';
import { item } from '../data/item.js';

function held(id) {
  const def = item(id);
  if (!def) return '';
  if (def.kind === 'weapon') return 'sword';
  if (def.kind === 'tool') return def.tool;
  if (def.kind === 'block') return 'block';
  return def.kind === 'utility' ? def.id : '';
}

class Actors {
  constructor(scene, room, uid) {
    this.scene = scene;
    this.uid = uid;
    this.items = new Map();
    this.ray = new THREE.Raycaster();
    this.center = new THREE.Vector2();
    this.box = new THREE.Box3();
    this.point = new THREE.Vector3();
    this.sync(room);
  }

  sync(room) {
    const live = new Set();
    for (const player of Object.values(room?.players ?? {})) {
      if (player.uid === this.uid || player.online === false) continue;
      live.add(player.uid);
      if (this.items.has(player.uid)) continue;
      const model = new Skin(find(player.skin).file);
      const item = {
        model,
        pos: new THREE.Vector3(),
        goal: new THREE.Vector3(),
        yaw: 0,
        turn: 0,
        speed: 0,
        phase: 0,
        swing: 0,
        mining: false,
        dig: 0,
        ready: false,
        alive: true
      };
      model.group.visible = false;
      model.group.userData.uid = player.uid;
      this.scene.add(model.group);
      this.items.set(player.uid, item);
    }
    for (const [uid, item] of this.items) {
      if (live.has(uid)) continue;
      item.model.close();
      this.items.delete(uid);
    }
  }

  move(uid, data) {
    const actor = this.items.get(uid);
    if (!actor) return;
    actor.goal.set(data.x, data.y, data.z);
    if (!actor.ready) {
      actor.pos.copy(actor.goal);
      actor.turn = face(data.yaw ?? 0);
    }
    actor.ready = true;
    actor.model.group.visible = actor.alive;
    actor.yaw = face(data.yaw ?? 0);
    actor.speed = data.speed ?? 0;
    actor.model.crouch(Boolean(data.crouch));
    actor.model.hold(held(data.held));
  }

  state(state) {
    for (const [uid, actor] of this.items) {
      const data = state?.players?.[uid];
      actor.alive = Boolean(data && !data.dead && !data.out);
      actor.model.group.visible = Boolean(actor.ready && actor.alive);
    }
  }

  swing(uid) {
    const actor = this.items.get(uid);
    if (actor) actor.swing = 0.28;
  }

  mine(uid, on) {
    const actor = this.items.get(uid);
    if (!actor) return;
    actor.mining = on;
    if (!on) actor.dig = 0;
  }

  hit(camera, reach) {
    this.ray.setFromCamera(this.center, camera);
    let best = null;
    for (const [uid, actor] of this.items) {
      if (!actor.ready || !actor.alive) continue;
      const low = actor.pos.y + actor.model.offset;
      this.box.min.set(actor.pos.x - 0.3, low, actor.pos.z - 0.3);
      this.box.max.set(actor.pos.x + 0.3, low + 1.8, actor.pos.z + 0.3);
      const point = this.ray.ray.intersectBox(this.box, this.point);
      if (!point) continue;
      const dist = camera.position.distanceTo(point);
      if (dist > reach || (best && dist >= best.dist)) continue;
      best = { uid, dist };
    }
    return best;
  }

  frame(dt) {
    for (const actor of this.items.values()) {
      if (!actor.model.group.visible) continue;
      actor.pos.lerp(actor.goal, Math.min(1, dt * 12));
      actor.turn = turn(actor.turn, actor.yaw, Math.min(1, dt * 14));
      actor.phase += actor.speed * dt * 2.2;
      actor.model.walk(actor.speed > 0.1 ? actor.phase : 0);
      if (actor.mining) {
        actor.dig = (actor.dig + dt * 4) % 1;
        actor.model.swing(actor.dig);
      } else if (actor.swing > 0) {
        actor.swing = Math.max(0, actor.swing - dt);
        actor.model.swing(1 - actor.swing / 0.28);
      }
      actor.model.group.position.set(actor.pos.x, actor.pos.y + actor.model.offset, actor.pos.z);
      actor.model.group.rotation.y = actor.turn;
    }
  }

  close() {
    for (const actor of this.items.values()) actor.model.close();
    this.items.clear();
  }
}

export { Actors };
