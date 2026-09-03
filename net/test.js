import { claim, code, cycle, elect, form, join, member, players, random, valid } from '../data/room.js';

function assert(value, message) {
  if (!value) throw new Error(message);
}

const known = ['plain', 'red', 'blue'];
let check = form('', 'plain', '', known);
assert(!check.ok && check.errors.user && check.errors.invite, 'missing form fields are rejected');
check = form('Mike', 'plain', 'ab-c', known);
assert(check.ok && check.code === 'AB-C', 'invite codes normalize safely');
assert(!form('Mike', 'missing', 'ROOM', known).ok, 'unknown skins are rejected');
assert(!form('Mike', 'plain', 'bad code', known).ok, 'invite codes reject spaces');

const one = member('a', 'A', 'plain', 1);
const two = member('b', 'B', 'red', 2);
let result = claim(null, one, 1);
assert(result.ok && result.room.host === 'a', 'creator atomically becomes host');
assert(!claim(result.room, two, 2).ok, 'existing invite code cannot be claimed twice');
let room = result.room;
result = join(room, two);
assert(result.ok && players(result.room).length === 2, 'second player joins existing room');
room = result.room;
assert(!join(null, two).ok, 'missing room is rejected');

for (let i = 2; i < 10; i++) {
  const item = member(`u${i}`, `P${i}`, 'blue', i + 1);
  const added = join(room, item);
  assert(added.ok, `player ${i + 1} joins before capacity`);
  room = added.room;
}
assert(players(room).length === 10, 'room reaches ten players');
assert(join(room, member('overflow', 'Over', 'plain', 20)).code === 'full', 'eleventh player is rejected');
const same = join(room, member('b', 'B2', 'blue', 99));
assert(same.ok && players(same.room).length === 10 && same.room.players.b.joined === 2, 'existing uid can refresh without consuming a slot');

let teams = claim(null, one, 1).room;
teams = join(teams, two).room;
assert(valid(teams).code === 'unassigned', 'unassigned players block start');
let moved = cycle(teams, 'a');
assert(moved.ok && moved.room.players.a.team === 'red', 'team cycles none to red');
teams = moved.room;
moved = cycle(teams, 'a');
assert(moved.ok && moved.room.players.a.team === 'blue', 'team cycles red to blue');
teams = moved.room;
moved = cycle(teams, 'a');
assert(moved.ok && moved.room.players.a.team === 'none', 'team cycles blue to unassigned');

const rolls = [0.8, 0.2, 0.6, 0.1, 0.9, 0.3, 0.7, 0.4, 0.5];
let index = 0;
room = random(room, () => rolls[index++ % rolls.length]);
const red = players(room).filter(item => item.team === 'red').length;
const blue = players(room).filter(item => item.team === 'blue').length;
assert(Math.abs(red - blue) <= 1, 'randomize keeps teams even');
assert(valid(room).ok, 'balanced assigned ten-player room passes start validation');

let odd = claim(null, one, 1).room;
odd = join(odd, two).room;
odd = join(odd, member('c', 'C', 'blue', 3)).room;
index = 0;
odd = random(odd, () => rolls[index++ % rolls.length]);
const oddred = players(odd).filter(item => item.team === 'red').length;
const oddblue = players(odd).filter(item => item.team === 'blue').length;
assert(Math.abs(oddred - oddblue) === 1, 'odd randomize differs by exactly one player');
assert(valid(odd).ok, 'odd balanced room passes start validation');

let fullteam = claim(null, member('r0', 'R0', 'plain', 0), 0).room;
for (let i = 1; i < 6; i++) fullteam = join(fullteam, member(`r${i}`, `R${i}`, 'plain', i)).room;
for (let i = 0; i < 5; i++) fullteam = cycle(fullteam, `r${i}`).room;
const blocked = cycle(fullteam, 'r5');
assert(!blocked.ok && blocked.code === 'teamfull', 'team cycling enforces five-player maximum');

let host = claim(null, one, 1).room;
host = join(host, two).room;
delete host.players.a;
host = elect(host);
assert(host.host === 'b', 'remaining player is promoted when lobby host is absent');

console.log('room and lobby logic tests passed');

class Wire {
  constructor() {
    this.read = null;
    this.sent = [];
    this.closed = false;
  }

  open(read) {
    this.read = read;
  }

  async send(uid, kind, data) {
    this.sent.push({ uid, kind, data });
  }

  close() {
    this.closed = true;
  }
}

class Channel {
  constructor() {
    this.readyState = 'connecting';
    this.events = new Map();
    this.sent = [];
  }

  addEventListener(kind, fn) {
    const list = this.events.get(kind) ?? [];
    list.push(fn);
    this.events.set(kind, list);
  }

  fire(kind, event = {}) {
    if (kind === 'open') this.readyState = 'open';
    if (kind === 'close') this.readyState = 'closed';
    for (const fn of this.events.get(kind) ?? []) fn(event);
  }

  send(data) {
    this.sent.push(data);
  }
}

class Desc {
  constructor(data) {
    this.type = data.type;
    this.sdp = data.sdp;
  }

  toJSON() {
    return { type: this.type, sdp: this.sdp };
  }
}

class Conn {
  constructor(config) {
    this.config = config;
    this.events = new Map();
    this.localDescription = null;
    this.remoteDescription = null;
    this.ice = [];
    this.closed = false;
    this.channel = null;
  }

  addEventListener(kind, fn) {
    const list = this.events.get(kind) ?? [];
    list.push(fn);
    this.events.set(kind, list);
  }

  createDataChannel() {
    this.channel = new Channel();
    return this.channel;
  }

  async createOffer() {
    return { type: 'offer', sdp: 'offer' };
  }

  async createAnswer() {
    return { type: 'answer', sdp: 'answer' };
  }

  async setLocalDescription(data) {
    this.localDescription = new Desc(data);
  }

  async setRemoteDescription(data) {
    this.remoteDescription = data;
  }

  async addIceCandidate(data) {
    this.ice.push(data);
  }

  close() {
    this.closed = true;
  }
}

globalThis.RTCPeerConnection = Conn;
const { Peer } = await import('./peer.js');
const pause = () => new Promise(resolve => setTimeout(resolve, 0));

const wire = new Wire();
const peer = new Peer(wire, 'host', 'host');
peer.open([{ uid: 'host' }, { uid: 'b' }, { uid: 'c' }]);
await pause();
assert(peer.links.size === 2, 'host creates one peer link for each non-host player');
assert(wire.sent.filter(item => item.kind === 'offer').length === 2, 'host sends one WebRTC offer to each client');
peer.links.get('b').channel.fire('open');
assert(peer.count() === 1, 'open DataChannel contributes to connected peer count');
peer.data({ kind: 'test' });
assert(peer.links.get('b').channel.sent.some(item => item.includes('test')), 'host broadcast uses open DataChannels');

const clientwire = new Wire();
const client = new Peer(clientwire, 'b', 'host');
client.open([{ uid: 'host' }, { uid: 'b' }]);
await clientwire.read({ from: 'host', kind: 'ice', data: { candidate: 'early' } });
assert(client.queue.get('host').length === 1, 'ICE arriving before the offer is queued');
await clientwire.read({ from: 'host', kind: 'offer', data: { type: 'offer', sdp: 'offer' } });
assert(client.links.has('host'), 'client creates a host peer after receiving an offer');
assert(client.links.get('host').pc.ice.length === 1, 'queued ICE is applied after remote description');
assert(clientwire.sent.some(item => item.kind === 'answer' && item.uid === 'host'), 'client answers the host through signalling');

peer.sync([{ uid: 'host' }, { uid: 'b' }]);
assert(!peer.links.has('c'), 'departed players close and remove their peer link');
peer.close();
client.close();
assert(wire.closed && clientwire.closed, 'closing peer architecture closes signalling listeners');

console.log('WebRTC topology tests passed');
