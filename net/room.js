import {
  get,
  onValue,
  ref,
  remove,
  runTransaction,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js';
import {
  claim as build,
  cycle as rotate,
  elect as promote,
  member,
  recover as rescue,
  reset as restart,
  random as mix,
  valid
} from '../data/room.js';
import { admit } from './admit.js';

async function claim(db, code, profile) {
  const target = ref(db, `rooms/${code}`);
  const item = member(profile.uid, profile.name, profile.skin, serverTimestamp());
  const result = await runTransaction(target, current => {
    const check = build(current, item, serverTimestamp());
    return check.ok ? check.room : undefined;
  }, { applyLocally: false });
  return result.committed ? { ok: true, room: result.snapshot.val() } : { ok: false, code: 'taken' };
}

function probe(target) {
  let stop = null;
  const first = new Promise((resolve, reject) => {
    let done = false;
    stop = onValue(target, snap => {
      if (done) return;
      done = true;
      resolve(snap.val());
    }, error => {
      if (done) return;
      done = true;
      reject(error);
    });
  });
  return { first, close: () => stop?.() };
}

function trace(code, kind, data = {}) {
  const tag = `[Join ${code}]`;
  if (kind === 'preflight') {
    console.info(`${tag} preflight existence=${data.exists}`);
  } else if (kind === 'attempt') {
    console.info(`${tag} transaction attempt=${data.attempt}`);
  } else if (kind === 'result') {
    console.info(`${tag} transaction attempt=${data.attempt} callback-null=${data.empty} committed=${data.committed}`);
  } else if (kind === 'reread') {
    console.info(`${tag} reread attempt=${data.attempt} existence=${data.exists}`);
  } else if (kind === 'error') {
    console.error(`${tag} Firebase error attempt=${data.attempt} code=${data.code ?? 'unknown'}`);
  }
}

async function join(db, code, profile) {
  const target = ref(db, `rooms/${code}`);
  const item = member(profile.uid, profile.name, profile.skin, serverTimestamp());
  return admit(
    () => probe(target),
    async () => (await get(target)).val(),
    async update => {
      const result = await runTransaction(target, update, { applyLocally: false });
      return { committed: result.committed, room: result.snapshot.val() };
    },
    item,
    (kind, data) => trace(code, kind, data)
  );
}

function watch(db, code, change, fail) {
  return onValue(ref(db, `rooms/${code}`), snap => change(snap.val()), error => fail?.(error));
}

async function cycle(db, code, uid, host) {
  const target = ref(db, `rooms/${code}`);
  let reason = 'forbidden';
  const result = await runTransaction(target, current => {
    if (!current || current.host !== host) return undefined;
    const check = rotate(current, uid);
    reason = check.code ?? reason;
    return check.ok ? check.room : undefined;
  }, { applyLocally: false });
  return result.committed ? { ok: true, room: result.snapshot.val() } : { ok: false, code: reason };
}

async function random(db, code, host) {
  const target = ref(db, `rooms/${code}`);
  const result = await runTransaction(target, current => {
    if (!current || current.host !== host || current.state !== 'lobby') return undefined;
    return mix(current);
  }, { applyLocally: false });
  return result.committed ? { ok: true, room: result.snapshot.val() } : { ok: false, code: 'forbidden' };
}

async function start(db, code, host) {
  const target = ref(db, `rooms/${code}`);
  let reason = 'forbidden';
  const stamp = serverTimestamp();
  const result = await runTransaction(target, current => {
    if (!current || current.host !== host || current.state !== 'lobby') return undefined;
    const check = valid(current);
    reason = check.code;
    if (!check.ok) return undefined;
    return { ...current, state: 'match', started: stamp };
  }, { applyLocally: false });
  return result.committed ? { ok: true, room: result.snapshot.val() } : { ok: false, code: reason };
}

async function elect(db, code) {
  const target = ref(db, `rooms/${code}`);
  const result = await runTransaction(target, current => {
    if (!current || current.state !== 'lobby') return undefined;
    const next = promote(current);
    if (next.host === current.host) return undefined;
    return next;
  }, { applyLocally: false });
  return { ok: result.committed, room: result.snapshot.val() };
}

async function recover(db, code) {
  const target = ref(db, `rooms/${code}`);
  const result = await runTransaction(target, current => {
    const check = rescue(current);
    return check.ok ? check.room : undefined;
  }, { applyLocally: false });
  return { ok: result.committed, room: result.snapshot.val() };
}

async function reset(db, code, host) {
  const target = ref(db, `rooms/${code}`);
  let reason = 'forbidden';
  const result = await runTransaction(target, current => {
    const check = restart(current, host);
    reason = check.code ?? reason;
    return check.ok ? check.room : undefined;
  }, { applyLocally: false });
  return result.committed ? { ok: true, room: result.snapshot.val() } : { ok: false, code: reason };
}

async function leave(db, code, uid) {
  await Promise.all([
    remove(ref(db, `rooms/${code}/players/${uid}`)),
    remove(ref(db, `signal/${code}/${uid}`))
  ]);
}

export { claim, cycle, elect, join, leave, random, recover, reset, start, watch };
