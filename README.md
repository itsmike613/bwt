# BedWars

The authoritative project rules are in `spec.md`. Current implementation state is in `status.md`.

## Run locally

Serve this folder over HTTP (ES modules, Firebase, and pointer lock should not be tested from `file://`). One simple option is:

```sh
python -m http.server 8000
```

Then open:

- `http://localhost:8000/index.html` for the public application.
- `http://localhost:8000/editor.html` for the shared-core map editor.
- `http://localhost:8000/index.html?preview=1` for the shared-core movement/build preview without entering Firebase rooms.

## Firebase

Before Create/Join can work, follow `firebase.md` and fill the real Firebase Web configuration into `data/firebase.js`.

Firebase is used for:

- Anonymous Authentication
- room/lobby state
- presence
- team assignment
- WebRTC signalling

WebRTC DataChannels are the initial realtime gameplay transport. RTDB is not used for rendering-rate player coordinates.

## Hosting

The public client stays static and uses relative project paths so it can be hosted from a GitHub Pages repository subpath. Three.js is pinned through the page import map. Firebase uses the official modular browser-module CDN build and backend services.

## Editor movement

The editor starts in normal collision-based movement. Hold Space to keep jumping whenever you land. Double-tap Space to toggle creative flight. While flying, Space rises and Shift descends; flight still collides with blocks.

## Tests

Run both automated suites:

```sh
node core/test.js
node net/test.js
```

`core/test.js` covers the shared voxel/movement foundation. `net/test.js` covers room/lobby validation, capacity, team, Randomize, Start, host election, and the host-star WebRTC signalling/topology state machine with test doubles.
