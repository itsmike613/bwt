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

The client deliberately uses session persistence so separate browser tabs/profiles can represent separate anonymous players during testing while a refresh in the same tab keeps that tab's anonymous session.

## 3. Create Realtime Database

1. Open **Realtime Database**.
2. Click **Create Database**.
3. Pick a region appropriate for the expected players.
4. Start in locked mode if the Console asks. The project supplies its own rules in `rules.json`.
5. Open the **Rules** tab.
6. Replace the rules with the contents of `rules.json` and publish them.

The Milestone 1 rules require Firebase Authentication and validate the room shape/team values/10-player cap, but they intentionally do not yet attempt the final hostile-client security model. The full Firebase security hardening is explicitly Milestone 5 in `spec.md`.

## 4. Fill `data/firebase.js`

Copy the values from **Project settings → Your apps → SDK setup and configuration → Config** into `data/firebase.js`.

The file already contains the required shape:

```js
const config = {
  apiKey: '',
  authDomain: '',
  databaseURL: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: ''
};
```

Use the values Firebase gives you exactly. The Realtime Database `databaseURL` is required and may include your selected database region.

The Firebase web configuration is public client configuration. Do not treat these values as passwords. Access control comes from Authentication and Realtime Database Rules.

## 5. Run locally

Serve the project over HTTP:

```sh
python -m http.server 8000
```

Open `http://localhost:8000/index.html`.

For a two-player test, use two separate browser profiles/private windows if your browser copies session storage between newly opened tabs. Each player needs a different anonymous Firebase UID.

Suggested test:

1. Browser A: enter a name, skin, code such as `TEST1`, then Create.
2. Browser B: use a different name/skin, enter `TEST1`, then Join.
3. Confirm both player cards appear in both lobbies.
4. On the host browser, click each team button to cycle Unassigned → Red → Blue → Unassigned.
5. Test Randomize.
6. Confirm Start stays disabled until both teams are populated and every player is assigned.
7. Start the room. The Milestone 1 match placeholder should show WebRTC data-channel connection progress. It intentionally does not start Milestone 2 BedWars gameplay yet.
8. Close the host while still in a lobby and confirm another remaining player becomes host after Firebase processes the disconnect.

## 6. GitHub Pages later

The project uses relative local paths and browser ES modules. When the repository is published with GitHub Pages:

- add the GitHub Pages host to Authentication Authorized domains;
- keep the Firebase configuration in `data/firebase.js`;
- do not rewrite Firebase configuration as a secret;
- keep `rules.json` server-side rules deployed in the Firebase Console;
- HTTPS from GitHub Pages satisfies WebRTC secure-context requirements.

## Current networking boundary

The initial `Peer` architecture is host-centered. The host creates one ordered WebRTC DataChannel to each other player. Realtime Database carries only offer/answer/ICE signalling messages under a separate `signal/` path, so room listeners are not redrawn by ICE traffic. No animation frames or rendering-rate coordinates are sent through Firebase. Later gameplay networking can send input/action messages toward the host and authoritative snapshots/events back through these channels.
