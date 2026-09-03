import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js';
import { config, ready } from '../data/firebase.js';

let app = null;
let auth = null;
let db = null;

function boot() {
  if (!ready()) {
    const error = new Error('Firebase is not configured.');
    error.code = 'config';
    throw error;
  }
  if (!app) {
    app = initializeApp(config);
    auth = getAuth(app);
    db = getDatabase(app);
  }
  return { app, auth, db };
}

export { boot };
