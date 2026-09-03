class Input {
  constructor(node) {
    this.node = node;
    this.keys = new Set();
    this.down = new Set();
    this.buttons = new Set();
    this.clicks = new Set();
    this.x = 0;
    this.y = 0;
    this.locked = false;

    addEventListener('keydown', event => {
      if (!this.keys.has(event.code)) this.down.add(event.code);
      this.keys.add(event.code);
    });
    addEventListener('keyup', event => this.keys.delete(event.code));
    addEventListener('mousedown', event => {
      if (!this.buttons.has(event.button)) this.clicks.add(event.button);
      this.buttons.add(event.button);
    });
    addEventListener('mouseup', event => this.buttons.delete(event.button));
    addEventListener('mousemove', event => {
      if (!this.locked) return;
      this.x += event.movementX;
      this.y += event.movementY;
    });
    addEventListener('contextmenu', event => event.preventDefault());
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.node;
      if (!this.locked) this.buttons.clear();
    });
    node.addEventListener('click', () => {
      if (!this.locked) node.requestPointerLock();
    });
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

  mouse() {
    const move = { x: this.x, y: this.y };
    this.x = 0;
    this.y = 0;
    return move;
  }

  clear() {
    this.down.clear();
    this.clicks.clear();
  }
}

export { Input };
