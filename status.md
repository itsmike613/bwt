# BEDWARS — DEVELOPMENT STATUS

## Current milestone

Milestone 1 — Foundation

Current slice: Firebase/auth/rooms/lobby/skins and initial WebRTC signalling architecture.

Milestone 1 implementation is now complete in code. Live Firebase Console configuration and multi-browser verification still require the project owner's Firebase project before Milestone 2 begins.

## Milestone 1 internal implementation order

1. Voxel world storage and chunk ownership.
2. Chunk face culling and grouped Three.js rendering.
3. Shared fixed-step loop and input capture.
4. Voxel AABB collision and Minecraft-inspired player movement.
5. Camera and pointer-lock mouse look.
6. Voxel DDA raycasting.
7. Shared placement/breaking rules with map-vs-player provenance.
8. Versioned shared map read/write format.
9. Real editor using the same world/render/input/interaction core.
10. Landing shell and skin registry.
11. Firebase anonymous auth and room claim/join.
12. Presence and lobby state.
13. Team assignment, randomize, and start validation.
14. Initial WebRTC signalling and authoritative-host connection structure.

## Completed

- Permanent `spec.md` copied from the authoritative V1 specification.
- `status.md` established as the running implementation record.
- Static GitHub Pages-friendly project structure with native ES modules.
- Three.js pinned to 0.185.1 through an import map.
- Shared fixed-step runtime/loop.
- Shared keyboard and pointer-lock mouse input.
- Sparse 16×16×16 chunked voxel storage.
- Separate block provenance: map blocks vs player-placed blocks.
- Visible-face chunk meshing; no mesh-per-voxel architecture.
- 32×32 nearest-filter texture support with replaceable placeholder PNG files.
- Shared first-person camera.
- Shared voxel AABB collision.
- Shared voxel DDA raycasting.
- Shared placement validation that rejects placement inside the player body.
- Shared breaking foundation that protects original map blocks in game mode.
- Versioned JSON map format.
- Real `editor.html` using the shared core.
- Editor block palette driven from the shared block registry.
- Required editor marker metadata and editor-only marker visuals with labels.
- Repeating Diamond/Emerald generator markers are supported for maps with multiple generator islands.
- Selected marker metadata can be cleared from the editor without touching voxel geometry.
- Editor map import/export.
- New editor world starts with one block at 0,0,0.
- Simple `index.html` landing shell with username, skin, invite, Create, and Join controls.
- Skin registry foundation with local placeholder choices.
- Game-mode shared-core preview path (`index.html?preview=1`) using the same runtime, map loader, physics, raycast, placement, and protected-block rules as the editor.
- Firebase browser-module configuration isolated in `data/firebase.js` and initialized only through `net/firebase.js`.
- Firebase setup guide in `firebase.md` and Milestone 1 RTDB rules in `rules.json`.
- Firebase modular browser SDK pinned to 12.18.0 for Authentication and Realtime Database without adding a bundler/framework.
- Anonymous Authentication through `net/auth.js`, using session persistence so separate testing windows can hold separate anonymous users while a tab refresh can retain its session.
- Atomic invite-code room claiming with an RTDB transaction at the room path; the creator becomes the initial host.
- Atomic room joining with transaction-based 10-player capacity checks and explicit not-found/full/already-started results. Fresh clients now perform a one-time `get()` on the room reference before the join transaction so an uncached initial transaction value cannot be mistaken for a missing room.
- Landing validation now uses small field/action inline red errors only; normal validation does not use an error page or modal.
- Firebase presence through `.info/connected` and `onDisconnect`, with disconnect removal queued before the player is refreshed online.
- Lobby room listener with simple synchronized username/player cards.
- Lobby host ownership and deterministic promotion of a remaining player if the host disappears while the room is still in lobby state.
- Host team cycling in the required order: Unassigned → Red → Blue → Unassigned, with the 5-player team cap enforced.
- Host Randomize uses a shuffled player order and assigns Red/Blue as evenly as possible.
- Start validation enforces at least 2 players, every player assigned, both teams populated, and no team over 5 players. The same validation is repeated inside the host Start transaction.
- Three legally original local 64×64 placeholder skins are stored under `asset/skin/` and synchronized by skin ID in each Firebase player record.
- `core/skin.js` provides a Minecraft-compatible 64×64 cuboid player renderer for head/torso/arms/legs, including the standard outer hat/jacket/sleeve/pants layers, plus pixelated lobby face previews.
- Initial WebRTC architecture is split between `net/peer.js` and `net/signal.js`: the match host owns one ordered DataChannel to each other player, while a separate top-level RTDB signalling path carries only offer/answer/ICE messages.
- Signalling messages are removed after handling; no rendering-rate coordinates or animation frames are written to Firebase.
- After a valid Start, the UI stays inside a Milestone 1 connection placeholder and reports DataChannel progress rather than starting unsynchronized Milestone 2 gameplay.

## Movement/controller repair completed

- Corrected camera-relative movement basis so W follows the camera's forward direction, S moves backward, A left, and D right.
- Direction math is centralized in `core/motion.js` and reused rather than duplicated between controllers.
- Ground movement now uses firmer target acceleration/deceleration instead of the previous floaty interpolation.
- Air control and airborne drift are separate from grounded acceleration.
- Mouse-look processing now occurs on render frames instead of being limited to fixed 60 Hz physics ticks.
- Physics position is interpolated for rendering between fixed simulation steps.
- Grounded walking, jumping, gravity, landing, sprinting, crouching, standing clearance, and crouch edge protection remain in the shared `Player` controller.
- Editor now starts grounded using the shared `Player` controller rather than starting in a separate free-flight controller.
- Double-tap Space toggles editor Creative Mode flight.
- Double-tap Space again disables flight; gravity resumes and the player falls/lands normally.
- While editor flight is enabled, Space rises and Shift descends.
- Creative flight uses the same voxel AABB collision mover and therefore collides with floors, walls, and ceilings; it is not noclip.
- Editor block placement now checks the editor player's collision body as well.
- The existing `Fly` path is no longer used by the editor and remains separate for future noclip spectator behavior; it shares the corrected directional basis.
- Input state is cleared on blur/pointer-lock loss to reduce stuck-key behavior.
- Movement, flight, mouse sensitivity, and double-tap timing remain centralized in `data/tune.js`.
- Holding Space while grounded now continuously requests jumping, so the player jumps again as soon as landing/support is regained without requiring a key release.
- A centralized 0.12-second jump buffer preserves jump input pressed shortly before landing.
- Jump consumption runs both before movement and immediately after collision/support resolution, so a buffered or held jump can continue cleanly from a landing without an avoidable dead tick.
- Creative flight still toggles only from distinct Space presses; holding Space by itself does not accidentally trigger the double-tap flight toggle.
- Ground support detection now checks a thin support slab strictly below the player's feet rather than relying on an AABB that could include the player's current vertical cell. This keeps support reliable on one-block-high landings without adding auto-step.

## Movement tests

`node core/test.js` currently passes tests covering:

- W/S/A/D at yaw 0°, +90°, 180°, and -90°.
- Grounded spawn and floor collision.
- Ground walking without sinking/falling through blocks.
- Jumping and landing.
- Crouch body height and standing restoration.
- Crouch edge protection on a single block.
- Double-tap Space enabling Creative Mode flight.
- Flight hover with gravity disabled.
- Space rise while flying.
- Shift descent while flying.
- Horizontal flight collision against a wall.
- Vertical flight collision against a ceiling.
- Second double-tap Space disabling flight.
- Normal falling and landing after flight is disabled.
- Mouse yaw/pitch application on render frames.
- Holding Space through repeated landings produces repeated jumps.
- A released Space press shortly before landing is consumed by the jump buffer after landing.
- Continuous sprint-jumping across flat terrain.
- Falling onto a one-block-high platform restores grounded/support state and permits an immediate next jump.
- Continuous sprint-jumping onto a one-block-high section, jumping again from that raised support, then continuing off the raised section.
- Walking into one-block-high terrain without jumping remains blocked; no auto-step behavior was introduced.
- Holding Space in grounded Creative mode does not accidentally toggle flight; the existing double-tap flight tests still pass.
- Dirty-chunk regression coverage: no-op deletes do not create chunks, identical/provenance-only writes do not schedule visual rebuilds, and an occupancy change at a chunk boundary dirties the two affected chunks.
- Existing map protection, player-block breaking, map round-trip, and marker round-trip tests.

All project JavaScript files also pass `node --check` syntax validation.

A headless Chromium WebGL launch was attempted in the build container, but that environment cannot initialize EGL/WebGL, so interactive pointer-lock feel still needs to be verified in a normal browser by the project owner.

## Core engineering/performance audit

Inspected the existing shared runtime, world, mesher, collision, input, raycast, editor marker, and render paths with Chromebook performance as an explicit constraint. No architectural rewrite was justified.

Changes made:

- Kept the existing sparse 16×16×16 chunk architecture and grouped visible-face meshing.
- Added a dirty-chunk set. `Runtime.sync()` now processes only chunks that are actually dirty instead of iterating every loaded chunk on every rendered frame.
- `World.set()` now ignores identical writes and no-op deletes do not allocate empty chunks. Provenance-only changes update metadata without forcing a visual remesh.
- Neighbor chunks are dirtied at boundaries only when voxel occupancy changes, because texture/provenance changes inside one occupied voxel do not change the neighboring chunk's hidden-face geometry.
- Added a one-entry chunk lookup cache in `World` so repeated collision/world queries inside the same chunk avoid rebuilding string keys and repeating map lookups.
- Reworked the collision hot path to use scalar bounds internally instead of allocating temporary position/AABB objects for every movement probe. The public `box()` helper remains for infrequent placement/standing checks.
- Removed the unused per-tick collision result-object allocation.
- Editor/game interaction code now performs voxel DDA raycasting only when the current foundation actually has a left/right interaction click, avoiding an otherwise unnecessary raycast and Three.js vector allocation every physics tick.
- Verified chunk remeshing already removes old scene groups and disposes replaced geometries. `World.clear()` also removes chunk groups and disposes their geometries. Editor marker redraw already disposes marker geometry, material, and generated label textures.
- Kept antialiasing disabled and the existing pixel-ratio cap; no dynamic shadows or other expensive rendering features were introduced.
- Preserved fixed-step 60 Hz physics and render interpolation exactly.
- Preserved the same shared `Player`, collision, world, renderer, and map systems for editor and game.

Intentionally deferred after inspection:

- Greedy meshing, a texture atlas, occlusion systems, workers, and other large renderer optimizations are not justified without real map/Chromebook profiling. The current renderer is still one chunk group with at most one mesh/draw call per material present in that chunk.
- Empty chunks are retained after their last voxel is removed. This can waste memory in an extremely long editor session that touches and erases many distant chunks, but removing them cleanly is not currently worth complicating the chunk/scene lifecycle. Revisit only if editor profiling demonstrates it matters.
- Shared block materials/textures and global input/resize listeners do not yet have a full runtime teardown path. Current pages create one runtime for their lifetime, so this is not a current-session leak; a proper teardown must be added before repeated Match → Lobby → Match runtime creation is introduced.
- `cast()` still creates short-lived Three.js/vector/result objects when it is called. It is now interaction-driven in the current foundation. If continuous target highlighting/breaking later requires per-frame casting, reuse scratch vectors/results then rather than prematurely complicating it now.
- Real draw-call, GPU, and memory profiling on modest Chromebooks remains a Milestone 6 requirement and cannot be replaced by Node-only regression tests.

## Firebase/lobby/network tests

`node net/test.js` currently passes tests covering:

- missing/invalid landing fields and invite-code normalization;
- atomic room-claim logic and duplicate invite-code rejection;
- room-not-found and 10-player capacity behavior;
- same-UID refresh without consuming another player slot;
- fresh-client existing-room Join with an initially empty local room cache, verifying `get()` occurs before the transaction;
- races after the warm read: a concurrently filled room still returns `full`, and a concurrently started room still returns `started`;
- required team-cycle order and 5-player team cap;
- even and odd Randomize results;
- Start validation for assignment/team population;
- deterministic lobby host promotion after host loss;
- host-star WebRTC topology creation;
- one offer per non-host peer;
- early ICE queuing until a remote description exists;
- client answer signalling;
- DataChannel connection counting and host broadcast;
- departed-peer cleanup and signalling teardown.

Additional build checks verify every local placeholder skin is exactly 64×64, `rules.json` is valid JSON, all JavaScript passes `node --check`, and the required landing/lobby DOM IDs exist. The RTDB Rules API audit was repeated after Firebase rejected the unsupported `numChildren()` call: the corrected file now uses only documented authentication variables, wildcard strings/`matches()`, `exists()`, `hasChildren()`, `child()`, `isString()`, `val()`, and string `length`. Live publish/runtime semantics and real browser DataChannel negotiation still require the project owner's Firebase project and browsers.

## Milestone 1 verification remaining

- Fill `data/firebase.js` with the project's real Firebase Web configuration.
- Enable Anonymous Authentication and Realtime Database in the Firebase Console, then publish `rules.json` as described in `firebase.md`.
- Perform live two-browser/device validation against the owner's Firebase project for create/join/presence/host promotion and the initial WebRTC handshake.
- Do not begin Milestone 2 until that live integration test is accepted.

## Known problems / intentional limits

- `data/firebase.js` intentionally ships with blank configuration values because the real Firebase project belongs to the project owner. Until those values are filled, Create/Join show a small inline configuration error.
- Milestone 1 `rules.json` validates authenticated room shape, invite format, player shape, and team values using supported RTDB Rules APIs. RTDB Rules do not provide a child-count function, so the 10-player cap remains enforced by the existing atomic join transaction rather than by `rules.json`. Full hostile-client Rules/security hardening remains explicitly scheduled for Milestone 5.
- Presence reconnect during an already-started match and host-disconnect match recovery remain Milestone 5 behavior; this milestone only establishes lobby presence and the initial signalling topology.
- The post-Start screen is intentionally a connection-status placeholder. Milestone 2 gameplay systems are not implemented or faked.
- Editor marker visuals are temporary wire boxes, deliberately separate from map block data.
- Editor block breaking is immediate. Timed break hardness and crack overlays belong to the later combat refinement milestone, while the provenance/protection foundation is already in place.
- Movement values are centralized and can still be tuned during later polish, but the controller architecture, held/buffered jumping, raised-block support, and requested movement/flight behaviors are now implemented and covered by automated tests.
- Placeholder textures are intentionally simple and legally original.

## Important implementation decisions

- Chunk size is 16 blocks per axis.
- Each chunk stores block IDs and provenance in typed arrays.
- World geometry is rebuilt only for dirty chunks through a dirty set; the render loop does not scan all loaded chunks for dirtiness.
- Identical voxel writes and provenance-only changes do not trigger mesh rebuilds; boundary neighbors are dirtied only when occupancy changes.
- Each chunk is represented by a small set of meshes grouped by texture/material, not one mesh per block.
- Texture files are individual 32×32 PNGs so art can be replaced without an atlas build pipeline.
- Map export writes only block geometry and marker metadata; gameplay logic reads marker positions rather than hardcoding island geometry.
- Exported editor blocks load into game mode as original/protected map blocks.
- The editor and game modes import the same core modules; voxel, collision, and normal player movement are not duplicated.
- Editor Creative Mode is a mode of the shared collision-based `Player` controller.
- Eliminated spectator noclip remains conceptually separate and must not replace or bypass editor/player collision physics.
- Camera-relative horizontal direction is centralized in `core/motion.js`.
- Fixed-step physics remains at 60 Hz while mouse look and camera presentation update on render frames.
- Balance/gameplay constants live in centralized data modules as systems are introduced; movement tuning lives in `data/tune.js`.
- Firebase initialization/auth/room presence, lobby DOM, skin rendering, WebRTC peer state, and RTDB signalling transport are separate modules rather than one room/game file.
- Room/team/start decisions are implemented as pure functions in `data/room.js`; Firebase transactions in `net/room.js` reuse them so logic can be regression-tested without a live project.
- Existing-room Join uses `net/admit.js` as the single Firebase-independent transaction workflow: read/warm once, then reuse the pure `data/room.js` join decision inside the authoritative RTDB transaction. This avoids duplicating room validation between the preflight read, transaction, and presence reconnect path.
- Invite codes normalize to uppercase and accept 2–20 letters, numbers, or hyphens.
- Realtime room creation/join capacity uses RTDB transactions because concurrent clients must not claim the same code or exceed the 10-player cap.
- Lobby host promotion is intentionally limited to lobby state in Milestone 1; active-match host disconnect behavior remains the specified Milestone 5 flow.
- WebRTC uses a host-centered star topology. Clients send later gameplay inputs/actions to the host; authoritative snapshots/events can return over the same DataChannels without pushing gameplay-rate state through RTDB.
