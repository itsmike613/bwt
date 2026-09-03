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

The accepted Firebase Web configuration is already stored in `data/firebase.js`. Follow `firebase.md` for Console services/rules and authorized-domain setup.

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


## Milestone 2 live test

`index.html` now loads `data/map.json` as the actual match map after Start. The bundled map is deliberately a tiny development platform with editor-format marker metadata; replace it later with an export from `editor.html` without changing the match engine.

Useful checks in two browsers: verify each team spawn, walk through forge drops to collect Iron/Gold, press E to inspect the 36-slot inventory, fall into the void to verify 3 → 2 → 1 respawn while the bed exists, break the enemy bed from close range, then make that player die again to verify permanent noclip spectator mode and the win foundation.

## Tests

Run the automated suites:

```sh
node core/test.js
node net/test.js
node mode/test.js
```

`core/test.js` covers the shared voxel/movement foundation. `net/test.js` covers room/lobby validation and the initial host-star WebRTC layer. `mode/test.js` covers Milestone 2 inventory, health/death/bed/win state, and generic generator behavior.
