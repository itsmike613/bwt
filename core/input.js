const blocked = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space',
  'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight',
  'KeyT', 'Slash'
]);

class Input {
  constructor(node) {
    this.node = node;
    this.keys = new Set();
    this.down = new Set();
    this.buttons = new Set();
    this.clicks = new Set();
    this.x = 0;
    this.y = 0;
    this.move = { x: 0, y: 0 };
    this.locked = false;
    this.closed = false;
    this.root = globalThis;
    this.doc = document;

    this.keydown = event => {
      if (this.locked && blocked.has(event.code)) event.preventDefault();
      if (!this.keys.has(event.code)) this.down.add(event.code);
      this.keys.add(event.code);
    };
    this.keyup = event => this.keys.delete(event.code);
    this.mousedown = event => {
      if (!this.buttons.has(event.button)) this.clicks.add(event.button);
      this.buttons.add(event.button);
    };
    this.mouseup = event => this.buttons.delete(event.button);
    this.mousemove = event => {
      if (!this.locked) return;
      this.x += event.movementX;
      this.y += event.movementY;
    };
    this.blur = () => this.reset();
    this.context = event => event.preventDefault();
    this.lock = () => {
      this.locked = this.doc.pointerLockElement === this.node;
      if (!this.locked) this.reset();
    };
    this.canvas = () => {
      if (!this.locked) this.capture();
    };

    this.root.addEventListener('keydown', this.keydown);
    this.root.addEventListener('keyup', this.keyup);
    this.root.addEventListener('mousedown', this.mousedown);
    this.root.addEventListener('mouseup', this.mouseup);
    this.root.addEventListener('mousemove', this.mousemove);
    this.root.addEventListener('blur', this.blur);
    this.root.addEventListener('contextmenu', this.context);
    this.doc.addEventListener('pointerlockchange', this.lock);
    this.node.addEventListener('click', this.canvas);
  }

  held(code) {
    return this.keys.has(code);
  }

  press(code) {
    return this.down.has(code);
  }

  click(button) {
    return this.clicks.has(button);
  }

  button(button) {
    return this.buttons.has(button);
  }

  mouse() {
    this.move.x = this.x;
    this.move.y = this.y;
    this.x = 0;
    this.y = 0;
    return this.move;
  }

  clear() {
    this.down.clear();
    this.clicks.clear();
  }

  reset() {
    this.keys.clear();
    this.down.clear();
    this.buttons.clear();
    this.clicks.clear();
    this.x = 0;
    this.y = 0;
  }

  capture() {
    if (this.closed || !this.node) return;
    this.reset();
    this.node.requestPointerLock?.();
  }

  release() {
    this.reset();
    this.doc.exitPointerLock?.();
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.root.removeEventListener('keydown', this.keydown);
    this.root.removeEventListener('keyup', this.keyup);
    this.root.removeEventListener('mousedown', this.mousedown);
    this.root.removeEventListener('mouseup', this.mouseup);
    this.root.removeEventListener('mousemove', this.mousemove);
    this.root.removeEventListener('blur', this.blur);
    this.root.removeEventListener('contextmenu', this.context);
    this.doc.removeEventListener('pointerlockchange', this.lock);
    this.node?.removeEventListener('click', this.canvas);
    if (this.doc.pointerLockElement === this.node) this.doc.exitPointerLock?.();
    this.locked = false;
    this.reset();
  }
}

export { Input };
