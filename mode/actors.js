import * as THREE from 'three';
import { Skin } from '../core/skin.js';
import { skin as find } from '../data/skins.js';

class Actors {
  constructor(scene, room, uid) {
    this.scene = scene;
    this.uid = uid;
    this.items = new Map();
    this.sync(room);
  }

  sync(room) {
    const live = new Set();
    for (const player of Object.values(room?.players ?? {})) {
      if (player.uid === this.uid) continue;
      live.add(player.uid);
      if (this.items.has(player.uid)) continue;
      const model = new Skin(find(player.skin).file);
      const item = {
        model,
        pos: new THREE.Vector3(),
        goal: new THREE.Vector3(),
        yaw: 0,
        speed: 0,
        phase: 0,
        ready: false,
        alive: true
      };
      model.group.visible = false;
      this.scene.add(model.group);
      this.items.set(player.uid, item);
    }
    for (const [uid, item] of this.items) {
      if (live.has(uid)) continue;
      item.model.group.parent?.remove(item.model.group);
      this.items.delete(uid);
    }
  }

  move(uid, data) {
    const item = this.items.get(uid);
    if (!item) return;
    item.goal.set(data.x, data.y, data.z);
    if (!item.ready) item.pos.copy(item.goal);
    item.ready = true;
    item.model.group.visible = item.alive;
    item.yaw = data.yaw ?? item.yaw;
    item.speed = data.speed ?? 0;
    item.model.crouch(Boolean(data.crouch));
  }

  state(state) {
    for (const [uid, item] of this.items) {
      const data = state?.players?.[uid];
      item.alive = Boolean(data && !data.dead && !data.out);
      item.model.group.visible = Boolean(item.ready && item.alive);
    }
  }

  frame(dt) {
    for (const item of this.items.values()) {
      if (!item.model.group.visible) continue;
      item.pos.lerp(item.goal, Math.min(1, dt * 12));
      item.phase += item.speed * dt * 2.2;
      item.model.walk(item.speed > 0.1 ? item.phase : 0);
      item.model.group.position.copy(item.pos);
      item.model.group.rotation.y = item.yaw;
    }
  }
}

export { Actors };
