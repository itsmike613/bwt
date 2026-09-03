import { browserSessionPersistence, setPersistence, signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { boot } from './firebase.js';

async function signin() {
  const { auth } = boot();
  await auth.authStateReady();
  await setPersistence(auth, browserSessionPersistence);
  if (auth.currentUser) return auth.currentUser;
  const result = await signInAnonymously(auth);
  return result.user;
}

export { signin };
