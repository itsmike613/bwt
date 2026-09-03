import { join as enter } from '../data/room.js';

function absent(value) {
  return value === null || value === undefined;
}

async function admit(open, read, transact, item, trace = () => {}, tries = 3) {
  const feed = open();

  try {
    let first;
    try {
      first = await feed.first;
    } catch (error) {
      trace('error', { attempt: 0, code: error?.code ?? 'unknown' });
      throw error;
    }

    trace('preflight', { exists: !absent(first) });
    if (absent(first)) return { ok: false, code: 'missing' };

    for (let attempt = 1; attempt <= tries; attempt++) {
      let empty = false;
      let reason = 'retry';
      let result;

      trace('attempt', { attempt });

      try {
        result = await transact(current => {
          if (absent(current)) {
            empty = true;
            return undefined;
          }

          const check = enter(current, item);
          reason = check.code ?? reason;
          return check.ok ? check.room : undefined;
        });
      } catch (error) {
        trace('error', { attempt, code: error?.code ?? 'unknown' });
        throw error;
      }

      trace('result', { attempt, empty, committed: result.committed });

      if (result.committed) return { ok: true, room: result.room };

      if (!empty) {
        const check = enter(result.room, item);
        return { ok: false, code: check.ok ? reason : check.code };
      }

      let latest;
      try {
        latest = await read();
      } catch (error) {
        trace('error', { attempt, code: error?.code ?? 'unknown' });
        throw error;
      }

      trace('reread', { attempt, exists: !absent(latest) });
      if (absent(latest)) return { ok: false, code: 'missing' };
      if (attempt < tries) await new Promise(resolve => setTimeout(resolve, attempt * 20));
    }

    return { ok: false, code: 'retry' };
  } finally {
    feed.close();
  }
}

export { admit };
