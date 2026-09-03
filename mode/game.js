import { skins } from '../data/skins.js';
import { players } from '../data/room.js';
import { boot } from '../net/firebase.js';
import { signin } from '../net/auth.js';
import { claim, cycle, elect, join, random, start, watch } from '../net/room.js';
import { Presence } from '../net/presence.js';
import { Peer } from '../net/peer.js';
import { Signal } from '../net/signal.js';
import { Landing } from './landing.js';
import { Lobby } from './lobby.js';
import { Match } from './match.js';
import { play } from './preview.js';

const state = {
  db: null,
  uid: '',
  code: '',
  profile: null,
  room: null,
  stop: null,
  presence: null,
  peer: null
};

const match = new Match();
const lobby = new Lobby({
  cycle: uid => assign(uid),
  random: () => mix(),
  start: () => begin()
});
const landing = new Landing(skins, {
  create: data => enter('create', data),
  join: data => enter('join', data)
});

function clean() {
  state.stop?.();
  state.stop = null;
  state.presence?.close();
  state.presence = null;
  state.peer?.close();
  state.peer = null;
  state.room = null;
}

function fail(error) {
  const code = error?.code?.replace?.('auth/', '') ?? error?.code;
  if (code === 'config') landing.fail('config');
  else landing.fail(code);
}

async function enter(kind, data) {
  try {
    const user = await signin();
    const { db } = boot();
    const profile = { uid: user.uid, name: data.name, skin: data.skin };
    const result = kind === 'create' ? await claim(db, data.code, profile) : await join(db, data.code, profile);
    if (!result.ok) {
      landing.fail(result.code);
      return;
    }
    clean();
    state.db = db;
    state.uid = user.uid;
    state.code = data.code;
    state.profile = profile;
    landing.hide();
    open();
  } catch (error) {
    fail(error);
  }
}

function open() {
  state.stop = watch(state.db, state.code, room => update(room), error => fail(error));
  state.presence = new Presence(
    state.db,
    state.code,
    state.uid,
    () => join(state.db, state.code, state.profile),
    error => fail(error)
  );
  state.presence.open();
}

function update(room) {
  if (!room) {
    clean();
    lobby.hide();
    match.close();
    landing.show();
    landing.error({ action: 'The room is no longer available.' });
    return;
  }
  state.room = room;
  if (room.state === 'lobby' && !room.players?.[room.host]) elect(state.db, state.code).catch(() => {});

  if (room.state === 'lobby') {
    state.peer?.close();
    state.peer = null;
    match.close();
    lobby.draw(room, state.uid, state.code);
    return;
  }

  lobby.hide();
  match.open(state.code);
  if (!state.peer) {
    const signal = new Signal(state.db, state.code, state.uid);
    state.peer = new Peer(signal, state.uid, room.host, {
      change: (open, total) => match.network(open, total, state.uid === room.host)
    });
    state.peer.open(players(room));
  } else {
    state.peer.sync(players(room));
  }
}

async function assign(uid) {
  if (!state.room || state.room.host !== state.uid) return;
  const result = await cycle(state.db, state.code, uid, state.uid);
  if (!result.ok) lobby.fail(result.code);
}

async function mix() {
  if (!state.room || state.room.host !== state.uid) return;
  const result = await random(state.db, state.code, state.uid);
  if (!result.ok) lobby.fail(result.code);
}

async function begin() {
  if (!state.room || state.room.host !== state.uid) return;
  const result = await start(state.db, state.code, state.uid);
  if (!result.ok) lobby.fail(result.code);
}

const query = new URLSearchParams(location.search);
if (query.get('preview') === '1') {
  play().catch(() => landing.error({ action: 'Could not load the local preview map.' }));
}

export { state };
