class Chat {
  constructor(input, send) {
    this.input = input;
    this.send = send;
    this.node = document.querySelector('#chat');
    this.list = document.querySelector('#chatlist');
    this.form = document.querySelector('#chatform');
    this.field = document.querySelector('#chatinput');
    this.shown = false;
    this.submit = event => {
      event.preventDefault();
      const text = this.field.value.trim();
      if (text) this.send?.(text);
      this.close();
    };
    this.escape = event => {
      if (event.key === 'Escape' && this.shown) {
        event.preventDefault();
        this.close();
      }
    };
    this.form.addEventListener('submit', this.submit);
    this.field.addEventListener('keydown', this.escape);
  }

  open(command = false) {
    if (this.shown) return;
    this.shown = true;
    this.form.hidden = false;
    this.field.value = command ? '/' : '';
    document.exitPointerLock?.();
    requestAnimationFrame(() => {
      this.field.focus();
      this.field.setSelectionRange(this.field.value.length, this.field.value.length);
    });
  }

  close(capture = true) {
    if (!this.shown) return;
    this.shown = false;
    this.form.hidden = true;
    this.field.blur();
    if (capture) this.input.node.requestPointerLock?.();
  }

  add(data) {
    if (!data?.text || !data?.name) return;
    const line = document.createElement('div');
    line.className = `chatline ${data.shout ? 'shout' : data.team ?? ''}`;
    line.textContent = data.shout ? `[SHOUT] ${data.name}: ${data.text}` : `${data.name}: ${data.text}`;
    this.list.append(line);
    while (this.list.children.length > 8) this.list.firstElementChild?.remove();
  }

  closeall() {
    this.close(false);
    this.form.removeEventListener('submit', this.submit);
    this.field.removeEventListener('keydown', this.escape);
    this.list.replaceChildren();
  }
}

export { Chat };
