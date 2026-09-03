import {
  onDisconnect,
  onValue,
  ref,
  serverTimestamp,
  update
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js';

class Presence {
  constructor(db, code, uid, renew, fail) {
    this.db = db;
    this.code = code;
    this.uid = uid;
    this.renew = renew;
    this.fail = fail;
    this.stop = null;
    this.gone = null;
    this.busy = false;
  }

  open() {
    const info = ref(this.db, '.info/connected');
    this.stop = onValue(info, snap => {
      if (snap.val() !== true || this.busy) return;
      this.connect();
    });
  }

  async connect() {
    this.busy = true;
    try {
      const player = ref(this.db, `rooms/${this.code}/players/${this.uid}`);
      this.gone = onDisconnect(player);
      await this.gone.remove();
      const result = await this.renew();
      if (!result.ok) throw Object.assign(new Error(result.code), { code: result.code });
      await update(player, { seen: serverTimestamp() });
    } catch (error) {
      this.fail?.(error);
    } finally {
      this.busy = false;
    }
  }

  close() {
    this.stop?.();
    this.stop = null;
    this.gone?.cancel();
    this.gone = null;
  }
}

export { Presence };
