import { join as enter } from '../data/room.js';

async function admit(read, transact, item) {
  const first = await read();
  if (!first) return { ok: false, code: 'missing' };

  const result = await transact(current => {
    const check = enter(current, item);
    return check.ok ? check.room : undefined;
  });

  if (result.committed) return { ok: true, room: result.room };
  const check = enter(result.room, item);
  return { ok: false, code: check.code };
}

export { admit };
