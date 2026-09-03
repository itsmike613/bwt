import * as THREE from 'three';
import { fly as tune } from '../data/tune.js';

class Fly {
  constructor(input, camera) {
    this.input = input;
    this.camera = camera;
    this.pos = new THREE.Vector3(0.5, 3, 4.5);
    this.yaw = 0;
    this.pitch = -0.25;
  }

  look() {
    const mouse = this.input.mouse();
    this.yaw -= mouse.x * 0.0022;
    this.pitch -= mouse.y * 0.0022;
    this.pitch = Math.max(-1.54, Math.min(1.54, this.pitch));
  }

  tick(dt) {
    this.look();
    const forward = Number(this.input.held('KeyW')) - Number(this.input.held('KeyS'));
    const side = Number(this.input.held('KeyD')) - Number(this.input.held('KeyA'));
    const up = Number(this.input.held('Space')) - Number(this.input.held('ShiftLeft') || this.input.held('ShiftRight'));
    const boost = this.input.held('ControlLeft') || this.input.held('ControlRight') ? tune.boost : 1;
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    this.pos.x += (side * cos - forward * sin) * tune.speed * boost * dt;
    this.pos.z += (side * sin + forward * cos) * tune.speed * boost * dt;
    this.pos.y += up * tune.speed * boost * dt;
    this.camera.position.copy(this.pos);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }
}

export { Fly };
