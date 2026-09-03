# BedWars

The authoritative project rules are in `spec.md`. Current implementation state is in `status.md`.

## Run locally

Serve this folder over HTTP (ES modules, Firebase, WebRTC, and pointer lock should not be tested from `file://`). One simple option is:

```sh
python -m http.server 8000
```

Then open:

- `http://localhost:8000/index.html` for the public application.
- `http://localhost:8000/editor.html` for the shared-core map editor.
- `http://localhost:8000/index.html?preview=1` for the shared-core movement/build preview without entering Firebase rooms.

## Firebase

The accepted Firebase Web configuration is permanently stored in `data/firebase.js`. Follow `firebase.md` for Console services/rules and authorized-domain setup.

Firebase is used for Anonymous Authentication, room/lobby state, presence, team assignment, and WebRTC signalling. WebRTC DataChannels are the realtime match transport; RTDB is not used for rendering-rate gameplay state.

## Hosting

The public client stays static and uses relative project paths so it can be hosted from a GitHub Pages repository subpath. Three.js is pinned through the page import map. Firebase uses the official modular browser-module CDN build and backend services.

## Editor movement

The editor starts in normal collision-based movement. Hold Space to keep jumping whenever you land. Double-tap Space to toggle Creative flight. While flying, Space rises and Shift descends; Creative flight still collides with blocks.

## Milestone 3 live test

Milestone 2 has been accepted through a real two-browser test. This build first fixes the remote skin rendering/facing path, then adds the Milestone 3 combat foundation.

The normal starting loadout now includes the required Wooden Sword, so a two-browser match can immediately verify:

- both remote players remain visible while standing and moving;
- skins remain visible from all viewing directions;
- remote facing follows camera yaw smoothly;
- enemy melee hits apply host-authoritative damage and knockback;
- friendly melee does not damage teammates;
- direct kills and recent-attacker fall/void deaths use the host attribution window;
- death resets the carried sword back to Wooden Sword.

Pickaxe, Axe, Shears, Iron/Diamond swords, TNT, Fireballs, and defense blocks are implemented for Milestone 3 but are not given away for free. Their normal acquisition remains the Milestone 4 Item Shop economy specified in `spec.md`.

## Tests

Run:

```sh
node core/test.js
node net/test.js
node mode/test.js
```

`core/test.js` covers the shared voxel/movement foundation and remote facing math. `net/test.js` covers room/lobby/Auth control flow and the host-star WebRTC layer. `mode/test.js` covers BedWars state/inventory/generators plus Milestone 3 combat values, death loss/persistence, tool breaking speeds, and explosion block filtering.
