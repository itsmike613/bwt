import {
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
  join as enter,
  member,
  random as mix,
  valid
} from '../data/room.js';

async function claim(db, code, profile) {
  const target = ref(db, `rooms/${code}`);
  const item = member(profile.uid, profile.name, profile.skin, serverTimestamp());
  const result = await runTransaction(target, current => {
    const check = build(current, item, serverTimestamp());
    return check.ok ? check.room : undefined;
  }, { applyLocally: false });
  return result.committed ? { ok: true, room: result.snapshot.val() } : { ok: false, code: 'taken' };
}

async function join(db, code, profile) {
  const target = ref(db, `rooms/${code}`);
  const item = member(profile.uid, profile.name, profile.skin, serverTimestamp());
  const result = await runTransaction(target, current => {
    const check = enter(current, item);
    return check.ok ? check.room : undefined;
  }, { applyLocally: false });
  if (result.committed) return { ok: true, room: result.snapshot.val() };
  const check = enter(result.snapshot.val(), item);
  return { ok: false, code: check.code };
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

async function leave(db, code, uid) {
  await Promise.all([
    remove(ref(db, `rooms/${code}/players/${uid}`)),
    remove(ref(db, `signal/${code}/${uid}`))
  ]);
}

export { claim, cycle, elect, join, leave, random, start, watch };
