import { move, solid, box, support } from './collide.js';
import { near, wish } from './motion.js';
import { fly as flight, move as tune } from '../data/tune.js';

class Player {
  constructor(world, input, camera, creative = false) {
    this.world = world;
    this.input = input;
    this.camera = camera;
    this.pos = { x: 0.5, y: 2, z: 0.5 };
    this.prev = { x: 0.5, y: 2, z: 0.5 };
    this.vel = { x: 0, y: 0, z: 0 };
    this.wish = { x: 0, z: 0 };
    this.width = tune.width;
    this.height = tune.stand;
    this.eye = tune.eye;
    this.yaw = 0;
    this.pitch = 0;
    this.ground = false;
    this.crouch = false;
    this.creative = creative;
    this.flight = false;
    this.time = 0;
    this.tap = -Infinity;
  }

  spawn(x, y, z) {
    this.pos.x = x;
    this.pos.y = y;
    this.pos.z = z;
    this.prev.x = x;
    this.prev.y = y;
    this.prev.z = z;
    this.vel.x = 0;
    this.vel.y = 0;
    this.vel.z = 0;
    this.crouch = false;
    this.height = tune.stand;
    this.eye = tune.eye;
    this.flight = false;
    this.tap = -Infinity;
    this.ground = support(this.world, this);
  }

  look() {
    const mouse = this.input.mouse();
    this.yaw -= mouse.x * tune.mouse;
    this.pitch -= mouse.y * tune.mouse;
    this.pitch = Math.max(-1.54, Math.min(1.54, this.pitch));
  }

  frame(alpha = 1) {
    this.look();
    const x = this.prev.x + (this.pos.x - this.prev.x) * alpha;
    const y = this.prev.y + (this.pos.y - this.prev.y) * alpha;
    const z = this.prev.z + (this.pos.z - this.prev.z) * alpha;
    this.camera.position.set(x, y + this.eye, z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  stand() {
    if (!this.crouch) return true;
    const old = this.height;
    this.height = tune.stand;
    if (solid(this.world, box(this))) {
      this.height = old;
      return false;
    }
    this.crouch = false;
    this.eye = tune.eye;
    return true;
  }

  duck() {
    const want = this.input.held('ShiftLeft') || this.input.held('ShiftRight');
    if (want && !this.crouch) {
      this.crouch = true;
      this.height = tune.duck;
      this.eye = tune.low;
    } else if (!want) {
      this.stand();
    }
  }

  space() {
    if (!this.input.press('Space')) return false;
    if (this.creative && this.time - this.tap <= tune.tap) {
      this.flight = !this.flight;
      this.tap = -Infinity;
      this.vel.y = 0;
      if (this.flight) this.stand();
      return true;
    }

    this.tap = this.time;
    if (!this.flight && this.ground) {
      this.vel.y = tune.jump;
      this.ground = false;
      this.crouch = false;
      this.height = tune.stand;
      this.eye = tune.eye;
    }
    return false;
  }

  walk(dt) {
    const forward = Number(this.input.held('KeyW')) - Number(this.input.held('KeyS'));
    const side = Number(this.input.held('KeyD')) - Number(this.input.held('KeyA'));
    wish(this.yaw, forward, side, this.wish);
    let speed = this.input.held('ControlLeft') || this.input.held('ControlRight') ? tune.sprint : tune.walk;
    if (this.crouch) speed *= tune.crouch;

    if (forward || side) {
      const rate = this.ground ? tune.accel : tune.air;
      this.vel.x = near(this.vel.x, this.wish.x * speed, rate * dt);
      this.vel.z = near(this.vel.z, this.wish.z * speed, rate * dt);
    } else if (this.ground) {
      this.vel.x = near(this.vel.x, 0, tune.stop * dt);
      this.vel.z = near(this.vel.z, 0, tune.stop * dt);
    } else {
      const drag = Math.max(0, 1 - tune.drift * dt);
      this.vel.x *= drag;
      this.vel.z *= drag;
    }

    this.vel.y -= tune.gravity * dt;
    move(this.world, this, dt);
  }

  fly(dt) {
    if (this.crouch) this.stand();
    const forward = Number(this.input.held('KeyW')) - Number(this.input.held('KeyS'));
    const side = Number(this.input.held('KeyD')) - Number(this.input.held('KeyA'));
    const up = Number(this.input.held('Space')) - Number(this.input.held('ShiftLeft') || this.input.held('ShiftRight'));
    wish(this.yaw, forward, side, this.wish);
    const boost = this.input.held('ControlLeft') || this.input.held('ControlRight') ? flight.boost : 1;
    const speed = flight.speed * boost;
    const rate = forward || side ? flight.accel : flight.stop;
    const lift = up ? flight.lift : flight.stop;

    this.vel.x = near(this.vel.x, this.wish.x * speed, rate * dt);
    this.vel.z = near(this.vel.z, this.wish.z * speed, rate * dt);
    this.vel.y = near(this.vel.y, up * speed, lift * dt);
    move(this.world, this, dt);
  }

  tick(dt) {
    this.time += dt;
    this.prev.x = this.pos.x;
    this.prev.y = this.pos.y;
    this.prev.z = this.pos.z;

    const toggled = this.space();
    if (!this.flight) this.duck();
    if (this.flight) this.fly(dt);
    else this.walk(dt);

    if (toggled && !this.flight) this.ground = support(this.world, this);
  }
}

export { Player };
