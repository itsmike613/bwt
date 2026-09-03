class Loop {
  constructor(step = 1 / 60) {
    this.step = step;
    this.last = 0;
    this.bank = 0;
    this.tick = null;
    this.draw = null;
    this.frame = this.frame.bind(this);
    this.running = false;
    this.request = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = 0;
    this.bank = 0;
    this.request = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    if (this.request) cancelAnimationFrame(this.request);
    this.request = 0;
  }

  frame(now) {
    if (!this.running) return;
    if (!this.last) this.last = now;
    let span = (now - this.last) / 1000;
    this.last = now;
    span = Math.min(span, 0.1);
    this.bank += span;
    while (this.bank >= this.step) {
      this.tick?.(this.step);
      this.bank -= this.step;
    }
    this.draw?.(this.bank / this.step);
    this.request = requestAnimationFrame(this.frame);
  }
}

export { Loop };
