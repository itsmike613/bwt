import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { onValueWritten } from 'firebase-functions/v2/database';
import { onSchedule } from 'firebase-functions/v2/scheduler';

initializeApp();

function count(room) {
  return Object.values(room?.players ?? {}).filter(player => player?.online !== false).length;
}

export const presence = onValueWritten('/rooms/{code}/players/{uid}', async event => {
  const code = event.params.code;
  const roomref = getDatabase().ref(`rooms/${code}`);
  await roomref.transaction(room => {
    if (!room) return room;
    const total = count(room);
    if (total === 0) return null;
    if (total === 1 && !Number.isFinite(room.alone)) room.alone = Date.now();
    if (total !== 1 && room.alone !== undefined) delete room.alone;
    return room;
  });
});

export const cleanup = onSchedule('every 15 minutes', async () => {
  const root = getDatabase().ref('rooms');
  const snap = await root.get();
  const rooms = snap.val() ?? {};
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const stale = 5 * 60 * 1000;
  const update = {};

  for (const [code, room] of Object.entries(rooms)) {
    const live = count(room);
    if (live === 0) {
      update[code] = null;
      continue;
    }
    if (live === 1 && Number.isFinite(room.alone) && now - room.alone >= hour) {
      update[code] = null;
      continue;
    }
    if (room.state === 'lobby') {
      for (const [uid, player] of Object.entries(room.players ?? {})) {
        if (player?.online === false && Number.isFinite(player.seen) && now - player.seen >= stale) update[`${code}/players/${uid}`] = null;
      }
    }
    if (live === 1) {
      if (!Number.isFinite(room.alone)) update[`${code}/alone`] = now;
    } else if (room.alone !== undefined) {
      update[`${code}/alone`] = null;
    }
  }

  if (Object.keys(update).length) await root.update(update);
});
