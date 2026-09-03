import {
  onChildAdded,
  push,
  ref,
  remove
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js';

class Signal {
  constructor(db, code, uid) {
    this.db = db;
    this.code = code;
    this.uid = uid;
    this.stop = null;
  }

  open(read) {
    const box = ref(this.db, `signal/${this.code}/${this.uid}`);
    this.stop = onChildAdded(box, async snap => {
      const item = snap.val();
      try {
        if (item?.from && item?.kind) await read(item);
      } finally {
        remove(snap.ref).catch(() => {});
      }
    });
  }

  async send(uid, kind, data) {
    const box = ref(this.db, `signal/${this.code}/${uid}`);
    await push(box, { from: this.uid, kind, data });
  }

  close() {
    this.stop?.();
    this.stop = null;
  }
}

export { Signal };
