import * as THREE from 'three';
import { move, solid, box } from './collide.js';
import { move as tune } from '../data/tune.js';

class Player {
  constructor(world, input, camera) {
    this.world = world;
    this.input = input;
    this.camera = camera;
    this.pos = new THREE.Vector3(0.5, 2, 0.5);
    this.vel = new THREE.Vector3();
    this.width = tune.width;
    this.height = tune.stand;
    this.eye = tune.eye;
    this.yaw = 0;
    this.pitch = 0;
    this.ground = false;
    this.crouch = false;
  }

  spawn(x, y, z) {
    this.pos.set(x, y, z);
    this.vel.set(0, 0, 0);
  }

  look() {
    const mouse = this.input.mouse();
    this.yaw -= mouse.x * 0.0022;
    this.pitch -= mouse.y * 0.0022;
    this.pitch = Math.max(-1.54, Math.min(1.54, this.pitch));
  }

  tick(dt) {
    this.look();

    const want = this.input.held('ShiftLeft') || this.input.held('ShiftRight');
    if (want && !this.crouch) {
      this.crouch = true;
      this.height = tune.duck;
      this.eye = tune.low;
    } else if (!want && this.crouch) {
      const old = this.height;
      this.height = tune.stand;
      if (solid(this.world, box(this))) {
        this.height = old;
      } else {
        this.crouch = false;
        this.eye = tune.eye;
      }
    }

    const forward = Number(this.input.held('KeyW')) - Number(this.input.held('KeyS'));
    const side = Number(this.input.held('KeyD')) - Number(this.input.held('KeyA'));
    const length = Math.hypot(forward, side) || 1;
    const f = forward / length;
    const s = side / length;
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    const dx = s * cos - f * sin;
    const dz = s * sin + f * cos;
    let speed = this.input.held('ControlLeft') || this.input.held('ControlRight') ? tune.sprint : tune.walk;
    if (this.crouch) speed *= tune.crouch;

    const rate = this.ground ? tune.accel : tune.accel * tune.air;
    const tx = dx * speed;
    const tz = dz * speed;
    this.vel.x += (tx - this.vel.x) * Math.min(1, rate * dt);
    this.vel.z += (tz - this.vel.z) * Math.min(1, rate * dt);

    if (!forward && !side && this.ground) {
      this.vel.x *= Math.max(0, 1 - tune.drag * dt);
      this.vel.z *= Math.max(0, 1 - tune.drag * dt);
    }

    if (this.input.press('Space') && this.ground) {
      this.vel.y = tune.jump;
      this.ground = false;
      this.crouch = false;
      this.height = tune.stand;
      this.eye = tune.eye;
    }

    this.vel.y -= tune.gravity * dt;
    move(this.world, this, dt);

    this.camera.position.set(this.pos.x, this.pos.y + this.eye, this.pos.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }
}

export { Player };
