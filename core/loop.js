class Loop {
  constructor(step = 1 / 60) {
    this.step = step;
    this.last = 0;
    this.bank = 0;
    this.tick = null;
    this.draw = null;
    this.frame = this.frame.bind(this);
  }

  start() {
    requestAnimationFrame(this.frame);
  }

  frame(now) {
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
    requestAnimationFrame(this.frame);
  }
}

export { Loop };
