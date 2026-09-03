# Firebase setup

This milestone uses Firebase only for authentication, room/lobby state, presence, and WebRTC signalling. Realtime player movement is not written to Realtime Database.

## 1. Create the Firebase project

1. Go to the Firebase Console and create a project.
2. Google Analytics is optional for this game and is not required by the project.
3. In the project overview, add a **Web app**.
4. Give it any internal nickname you want. Firebase Hosting is not required because the public client will be hosted on GitHub Pages.
5. Firebase will show a web configuration object. Keep that page open for step 4 below.

## 2. Enable Anonymous Authentication

1. Open **Authentication** in the Firebase Console.
2. Open **Sign-in method**.
3. Enable **Anonymous**.
4. Open **Authentication → Settings → Authorized domains**.
5. Add `localhost` if you want to test with `http://localhost:8000`. New Firebase projects no longer add localhost automatically.
6. When the GitHub Pages site exists, add its host as an authorized domain, for example `YOURNAME.github.io`.

The client initializes Firebase Auth with `initializeAuth()` and `browserSessionPersistence` from the beginning, before Auth can restore any default LOCAL user. This keeps the anonymous identity for refreshes in the same tab/session while allowing different tabs to hold different Firebase users. `net/auth.js` does not change persistence after initialization.

## 3. Create Realtime Database

1. Open **Realtime Database**.
2. Click **Create Database**.
3. Pick a region appropriate for the expected players.
4. Start in locked mode if the Console asks. The project supplies its own rules in `rules.json`.
5. Open the **Rules** tab.
6. Replace the rules with the contents of `rules.json` and publish them.

The Milestone 1 rules require Firebase Authentication and validate the room/player shape and team values, but they intentionally do not yet attempt the final hostile-client security model. Realtime Database Rules do not expose a supported child-count function, so the 10-player room limit is enforced by the existing atomic join transaction in `net/room.js` using the pure room logic in `data/room.js`. Concurrent joins are retried by Firebase transactions against the latest room state, so the normal application flow cannot commit an eleventh player. Independent server-side enforcement of the cap against a deliberately modified client is deferred to the Milestone 5 security-hardening pass rather than redesigning the room model here.

Fresh-client Join detail: RTDB transaction callbacks can initially receive `null` even when the remote room exists. The Join path must not interpret that first transaction value as proof that the room is missing. `net/room.js` now opens an `onValue` listener on the exact room reference and waits for its first synchronized value while leaving that listener active through the Join transaction. If that listener reports no room, Join returns `missing`. If the room exists, the authoritative transaction still performs the room-state and 10-player checks.

If a transaction attempt unexpectedly receives `null`, that attempt aborts without writing. While the temporary listener remains active, Join re-reads the room with `get()`. A truly absent room returns `missing`; an existing room is retried in a bounded three-attempt loop. The `full` and `started` decisions are still made inside the transaction against its current room value. The temporary room listener is always unsubscribed after Join succeeds or fails. Presence reconnects reuse this same Join path rather than maintaining duplicate room logic.

Join currently also writes temporary diagnostics to the browser console. They contain only the invite code and control-flow state: preflight existence, transaction attempt number, whether that transaction callback received `null`, committed state, reread existence, and Firebase error code. They do not print Firebase configuration values, auth tokens, or other secrets. These diagnostics are intended to make the two-browser test easy to inspect and can be removed after the live Join path is accepted.

## 4. Firebase client configuration

The accepted project Firebase Web configuration is now permanently stored in `data/firebase.js` for this project and should remain in future project ZIPs unless the project owner explicitly requests a change. No manual config paste is required for normal testing.

The Firebase web configuration is public client configuration. It is not treated as a password; access control comes from Authentication and Realtime Database Rules.

## 5. Run locally

Serve the project over HTTP:

```sh
python -m http.server 8000
```

Open `http://localhost:8000/index.html`.

For the live two-player test, open two normal tabs to the app. Create the room in Tab A, then join it from Tab B. The console prints only a shortened Firebase UID as `[Auth] uid=xxxxxxxx…`; the two tabs should show different shortened UIDs. Refreshing one tab should keep that tab's anonymous identity for the current browser session.

Suggested live Auth/room test:

1. Tab A: enter username `itsmike613`, choose a skin, enter `HELLO`, then press Create. Record the shortened `[Auth] uid=xxxxxxxx…` diagnostic.
2. Open Tab B normally to the same app URL. Enter username `testbob`, choose a skin, enter `HELLO`, then press Join. Record Tab B's shortened Auth UID and the `[Join HELLO]` diagnostics.
3. The two shortened Auth UIDs must differ.
4. Both tabs must show exactly two player cards: `itsmike613` and `testbob`.
5. `itsmike613` must remain Host in both tabs. `testbob` must not overwrite the creator's player entry.
6. Refreshing a tab during the same browser session should keep that tab's Firebase anonymous identity because Auth was initialized with session persistence.
7. After the identity test passes, the existing lobby checks can continue: team cycling, Randomize, Start validation, initial WebRTC connection status, and lobby host-disconnect promotion.

## 6. GitHub Pages later

The project uses relative local paths and browser ES modules. When the repository is published with GitHub Pages:

- add the GitHub Pages host to Authentication Authorized domains;
- keep the Firebase configuration in `data/firebase.js`;
- do not rewrite Firebase configuration as a secret;
- keep `rules.json` server-side rules deployed in the Firebase Console;
- HTTPS from GitHub Pages satisfies WebRTC secure-context requirements.

## Current networking boundary

The `Peer` architecture is host-centered. The host creates one ordered WebRTC DataChannel to each other player. Realtime Database carries only offer/answer/ICE signalling messages under a separate `signal/` path, so room listeners are not redrawn by ICE traffic. No animation frames or rendering-rate coordinates are sent through Firebase. Milestone 2 now uses these existing DataChannels for a modest player-position foundation plus host-owned bed/death/generator/drop/block events; the full authority/interpolation/reconnect pass remains Milestone 5.
