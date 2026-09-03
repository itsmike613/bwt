import { ice } from '../data/net.js';

class Peer {
  constructor(signal, uid, host, handlers = {}) {
    this.signal = signal;
    this.uid = uid;
    this.host = host;
    this.handlers = handlers;
    this.links = new Map();
    this.queue = new Map();
  }

  open(list) {
    this.signal.open(item => this.read(item));
    this.sync(list);
  }

  sync(list) {
    const live = new Set(list.map(item => item.uid));
    for (const [uid, link] of this.links) {
      if (!live.has(uid)) {
        link.pc.close();
        this.links.delete(uid);
      }
    }
    if (this.uid === this.host) {
      for (const item of list) {
        if (item.uid !== this.uid && !this.links.has(item.uid)) this.offer(item.uid);
      }
    }
    this.change();
  }

  make(uid) {
    const pc = new RTCPeerConnection({ iceServers: ice });
    const link = { pc, channel: null };
    this.links.set(uid, link);
    pc.addEventListener('icecandidate', event => {
      if (event.candidate) this.signal.send(uid, 'ice', event.candidate.toJSON());
    });
    pc.addEventListener('connectionstatechange', () => this.change());
    pc.addEventListener('datachannel', event => this.wire(uid, event.channel));
    return link;
  }

  wire(uid, channel) {
    const link = this.links.get(uid);
    if (!link) return;
    link.channel = channel;
    channel.addEventListener('open', () => {
      channel.send(JSON.stringify({ kind: 'hello', uid: this.uid }));
      this.change();
    });
    channel.addEventListener('close', () => this.change());
    channel.addEventListener('message', event => {
      try {
        this.handlers.data?.(uid, JSON.parse(event.data));
      } catch {
        this.handlers.data?.(uid, event.data);
      }
    });
  }

  async offer(uid) {
    const link = this.make(uid);
    const channel = link.pc.createDataChannel('game', { ordered: true });
    this.wire(uid, channel);
    const offer = await link.pc.createOffer();
    await link.pc.setLocalDescription(offer);
    await this.signal.send(uid, 'offer', link.pc.localDescription.toJSON());
  }

  async read(item) {
    const uid = item.from;
    if (item.kind === 'offer') {
      let link = this.links.get(uid);
      if (!link) link = this.make(uid);
      await link.pc.setRemoteDescription(item.data);
      await this.flush(uid);
      const answer = await link.pc.createAnswer();
      await link.pc.setLocalDescription(answer);
      await this.signal.send(uid, 'answer', link.pc.localDescription.toJSON());
      return;
    }
    const link = this.links.get(uid);
    if (item.kind === 'answer' && link) {
      await link.pc.setRemoteDescription(item.data);
      await this.flush(uid);
      return;
    }
    if (item.kind === 'ice') {
      if (link?.pc.remoteDescription) await link.pc.addIceCandidate(item.data);
      else {
        const list = this.queue.get(uid) ?? [];
        list.push(item.data);
        this.queue.set(uid, list);
      }
    }
  }

  async flush(uid) {
    const link = this.links.get(uid);
    const list = this.queue.get(uid) ?? [];
    this.queue.delete(uid);
    for (const item of list) await link.pc.addIceCandidate(item);
  }

  send(uid, value) {
    const link = this.links.get(uid);
    if (link?.channel?.readyState === 'open') {
      link.channel.send(JSON.stringify(value));
      return true;
    }
    return false;
  }

  data(value) {
    const text = JSON.stringify(value);
    if (this.uid === this.host) {
      for (const link of this.links.values()) {
        if (link.channel?.readyState === 'open') link.channel.send(text);
      }
      return;
    }
    const link = this.links.get(this.host);
    if (link?.channel?.readyState === 'open') link.channel.send(text);
  }

  count() {
    let count = 0;
    for (const link of this.links.values()) {
      if (link.channel?.readyState === 'open') count++;
    }
    return count;
  }

  change() {
    this.handlers.change?.(this.count(), this.links.size);
  }

  close() {
    this.signal.close();
    for (const link of this.links.values()) link.pc.close();
    this.links.clear();
    this.queue.clear();
  }
}

export { Peer };
