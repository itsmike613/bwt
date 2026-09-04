import { skins } from '../data/skins.js';
import { players } from '../data/room.js';
import { boot } from '../net/firebase.js';
import { signin } from '../net/auth.js';
import { claim, cycle, elect, join, leave, random, recover, reset, start, watch } from '../net/room.js';
import { Presence } from '../net/presence.js';
import { Peer } from '../net/peer.js';
import { Signal } from '../net/signal.js';
import { Landing } from './landing.js';
import { Lobby } from './lobby.js';
import { Match } from './match.js';
import { play } from './preview.js';

const key = 'bedwars';
const state = {
  db: null,
  uid: '',
  code: '',
  profile: null,
  room: null,
  stop: null,
  presence: null,
  peer: null,
  rescue: false
};

const modal = document.querySelector('#modal');
const modaltitle = document.querySelector('#modaltitle');
const modaltext = document.querySelector('#modaltext');
const modalclose = document.querySelector('#modalclose');
modalclose.addEventListener('click', () => { modal.hidden = true; });

function notice(title, text) {
  modaltitle.textContent = title;
  modaltext.textContent = text;
  modal.hidden = false;
}

function remember() {
  if (!state.code || !state.profile) return;
  sessionStorage.setItem(key, JSON.stringify({ code: state.code, profile: state.profile }));
}

function forget() {
  sessionStorage.removeItem(key);
}

function clean() {
  state.stop?.();
  state.stop = null;
  state.presence?.close();
  state.presence = null;
  state.peer?.close();
  state.peer = null;
  state.room = null;
  state.rescue = false;
}

function fail(error) {
  const code = error?.code?.replace?.('auth/', '') ?? error?.code;
  if (code === 'config') landing.fail('config');
  else landing.fail(code);
}

const match = new Match({
  end: () => end(),
  restart: () => restart(),
  leave: () => exit()
});
const lobby = new Lobby({
  cycle: uid => assign(uid),
  random: () => mix(),
  start: () => begin()
});
const landing = new Landing(skins, {
  create: data => enter('create', data),
  join: data => enter('join', data)
});

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
    remember();
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
    forget();
    clean();
    lobby.hide();
    match.close();
    landing.show();
    landing.error({ action: 'The room is no longer available.' });
    return;
  }
  state.room = room;
  const host = room.players?.[room.host];
  const online = Boolean(host && host.online !== false);

  if (room.state === 'lobby' && !online) elect(state.db, state.code).catch(() => {});

  if (room.state === 'match' && !online) {
    if (!state.rescue) {
      state.rescue = true;
      state.peer?.close();
      state.peer = null;
      match.close();
      notice('Host Disconnected', 'The host left the match. Returning the remaining players to this room’s lobby.');
      recover(state.db, state.code).catch(() => {}).finally(() => { state.rescue = false; });
    }
    return;
  }

  if (room.state === 'lobby') {
    state.rescue = false;
    state.peer?.close();
    state.peer = null;
    match.close();
    lobby.draw(room, state.uid, state.code);
    return;
  }

  lobby.hide();
  const list = players(room);
  if (!state.peer) {
    const signal = new Signal(state.db, state.code, state.uid);
    state.peer = new Peer(signal, state.uid, room.host, {
      change: (open, total) => match.network(open, total, state.uid === room.host),
      data: (from, data) => match.data(from, data)
    });
    state.peer.open(list);
  } else {
    state.peer.sync(list);
  }
  match.open(state.code, room, state.uid, state.peer).catch(error => {
    console.error('[Match] load failed', error);
    match.close();
    landing.show();
    landing.error({ action: error instanceof Error ? error.message : 'Could not load the match.' });
  });
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

async function end() {
  if (!state.room || state.room.host !== state.uid || state.room.state !== 'match') return;
  await reset(state.db, state.code, state.uid).catch(() => {});
}

async function restart() {
  if (!state.room || state.room.host !== state.uid || state.room.state !== 'match') return;
  await reset(state.db, state.code, state.uid).catch(() => {});
}

async function exit() {
  const db = state.db;
  const code = state.code;
  const uid = state.uid;
  clean();
  if (db && code && uid) await leave(db, code, uid).catch(() => {});
  forget();
  lobby.hide();
  match.close();
  landing.show();
  landing.error();
}

async function resume() {
  let saved = null;
  try {
    saved = JSON.parse(sessionStorage.getItem(key) || 'null');
  } catch {
    forget();
  }
  if (!saved?.code || !saved?.profile?.name || !saved?.profile?.skin) return;
  landing.busy(true);
  try {
    const user = await signin();
    const { db } = boot();
    const profile = { uid: user.uid, name: saved.profile.name, skin: saved.profile.skin };
    const result = await join(db, saved.code, profile);
    if (!result.ok) {
      forget();
      landing.fail(result.code);
      return;
    }
    state.db = db;
    state.uid = user.uid;
    state.code = saved.code;
    state.profile = profile;
    remember();
    landing.hide();
    open();
  } catch (error) {
    forget();
    fail(error);
  } finally {
    landing.busy(false);
  }
}

const query = new URLSearchParams(location.search);
if (query.get('preview') === '1') {
  play().catch(() => landing.error({ action: 'Could not load the local preview map.' }));
} else {
  resume();
}

export { state };
