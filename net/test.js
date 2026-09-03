import { claim, code, cycle, elect, form, join, member, players, random, valid } from '../data/room.js';
import { admit } from './admit.js';
import { readFileSync } from 'node:fs';

function assert(value, message) {
  if (!value) throw new Error(message);
}


const fire = readFileSync(new URL('./firebase.js', import.meta.url), 'utf8');
const login = readFileSync(new URL('./auth.js', import.meta.url), 'utf8');
assert(fire.includes('initializeAuth'), 'Firebase Auth uses explicit initializeAuth');
assert(fire.includes('browserSessionPersistence'), 'Firebase Auth selects session persistence during initialization');
assert(!fire.includes('getAuth'), 'Firebase Auth is not initialized through getAuth');
assert(!login.includes('setPersistence'), 'signin does not change persistence after Auth initialization');
console.log('Firebase Auth initialization audit passed (static source audit, not a cross-tab runtime test)');

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

const clone = value => structuredClone(value);

function feed(value, state) {
  return {
    first: Promise.resolve(clone(value)),
    close() {
      state.closed = true;
    }
  };
}

console.log('running mocked Firebase Join control-flow tests');

let remote = claim(null, member('host', 'Host', 'plain', 1), 1).room;
let state = { closed: false };
let calls = 0;
let reads = 0;
const traces = [];
const fresh = await admit(
  () => feed(remote, state),
  async () => {
    reads++;
    return clone(remote);
  },
  async update => {
    calls++;
    assert(!state.closed, 'temporary room listener stays active through the transaction');
    if (calls === 1) {
      const next = update(null);
      assert(next === undefined, 'unexpected null transaction input aborts that attempt without inventing a room');
      return { committed: false, room: null };
    }
    const next = update(clone(remote));
    assert(next !== undefined, 'retry receives the existing room and can produce the joined room');
    remote = clone(next);
    return { committed: true, room: clone(remote) };
  },
  member('fresh', 'Fresh', 'blue', 2),
  (kind, data) => traces.push({ kind, ...data })
);
assert(fresh.ok && fresh.room.players.fresh, 'mocked fresh-client flow retries after an unexpected null transaction callback');
assert(calls === 2 && reads === 1, 'mocked fresh-client flow rereads once and retries the transaction once');
assert(state.closed, 'temporary room listener unsubscribes after successful Join');
assert(traces.some(item => item.kind === 'result' && item.attempt === 1 && item.empty === true && item.committed === false), 'mocked diagnostics record null callback and aborted first attempt');
assert(traces.some(item => item.kind === 'reread' && item.exists === true), 'mocked diagnostics record authoritative reread existence');

state = { closed: false };
calls = 0;
reads = 0;
const missing = await admit(
  () => feed(null, state),
  async () => {
    reads++;
    return null;
  },
  async () => {
    calls++;
    return { committed: false, room: null };
  },
  member('none', 'None', 'plain', 2)
);
assert(!missing.ok && missing.code === 'missing', 'mocked preflight returns missing only when the active listener reports no room');
assert(calls === 0 && reads === 0 && state.closed, 'mocked missing preflight skips the transaction and still unsubscribes');

remote = claim(null, member('gone0', 'Gone0', 'plain', 1), 1).room;
state = { closed: false };
calls = 0;
const gone = await admit(
  () => feed(remote, state),
  async () => null,
  async update => {
    calls++;
    update(null);
    return { committed: false, room: null };
  },
  member('gone1', 'Gone1', 'red', 2)
);
assert(!gone.ok && gone.code === 'missing', 'mocked null callback becomes missing only after the authoritative reread also reports no room');
assert(calls === 1 && state.closed, 'mocked vanished room closes the temporary listener after reread');

remote = claim(null, member('cap0', 'Cap0', 'plain', 1), 1).room;
for (let i = 1; i < 9; i++) remote = join(remote, member(`cap${i}`, `Cap${i}`, 'plain', i + 1)).room;
state = { closed: false };
const raced = await admit(
  () => feed(remote, state),
  async () => clone(remote),
  async update => {
    remote = join(remote, member('cap9', 'Cap9', 'plain', 10)).room;
    const next = update(clone(remote));
    return { committed: next !== undefined, room: next === undefined ? clone(remote) : clone(next) };
  },
  member('late', 'Late', 'red', 11)
);
assert(!raced.ok && raced.code === 'full', 'mocked authoritative transaction still enforces the 10-player cap after preflight');
assert(state.closed, 'temporary listener closes after full-room rejection');

remote = claim(null, member('start0', 'Start0', 'plain', 1), 1).room;
state = { closed: false };
const started = await admit(
  () => feed(remote, state),
  async () => clone(remote),
  async update => {
    remote = { ...remote, state: 'match' };
    const next = update(clone(remote));
    return { committed: next !== undefined, room: next === undefined ? clone(remote) : clone(next) };
  },
  member('late2', 'Late2', 'blue', 2)
);
assert(!started.ok && started.code === 'started', 'mocked authoritative transaction still enforces room-started validation after preflight');
assert(state.closed, 'temporary listener closes after started-room rejection');

remote = claim(null, member('retry0', 'Retry0', 'plain', 1), 1).room;
state = { closed: false };
calls = 0;
reads = 0;
const retry = await admit(
  () => feed(remote, state),
  async () => {
    reads++;
    return clone(remote);
  },
  async update => {
    calls++;
    update(null);
    return { committed: false, room: null };
  },
  member('retry1', 'Retry1', 'blue', 2)
);
assert(!retry.ok && retry.code === 'retry', 'mocked repeated null callbacks stop after the bounded retry limit without falsely returning missing');
assert(calls === 3 && reads === 3 && state.closed, 'mocked retry loop is bounded to three attempts and always unsubscribes');

console.log('mocked Firebase Join control-flow tests passed (these mocks verify control flow, not Firebase runtime cache behavior)');

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
