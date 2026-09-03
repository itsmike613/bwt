import { signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { boot } from './firebase.js';

function trace(user) {
  console.info(`[Auth] uid=${user.uid.slice(0, 8)}…`);
}

async function signin() {
  const { auth } = boot();
  await auth.authStateReady();
  if (auth.currentUser) {
    trace(auth.currentUser);
    return auth.currentUser;
  }
  const result = await signInAnonymously(auth);
  trace(result.user);
  return result.user;
}

export { signin };
