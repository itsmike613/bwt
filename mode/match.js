class Match {
  constructor() {
    this.node = document.querySelector('#match');
    this.code = document.querySelector('#matchcode');
    this.net = document.querySelector('#network');
  }

  open(code) {
    this.code.textContent = code;
    this.net.textContent = 'Establishing host connection…';
    this.node.hidden = false;
  }

  close() {
    this.node.hidden = true;
  }

  network(open, total, host) {
    const target = host ? total : Math.min(total, 1);
    this.net.textContent = `WebRTC data channels: ${open}/${target} connected`;
  }
}

export { Match };
