# BEDWARS — DEVELOPMENT STATUS

## Current milestone

Milestone 1 — Foundation

Current slice: shared movement/controller foundation repair and editor Creative Mode behavior.

Firebase/rooms are intentionally paused until this foundation is accepted.

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
- Existing map protection, player-block breaking, map round-trip, and marker round-trip tests.

All project JavaScript files also pass `node --check` syntax validation.

A headless Chromium WebGL launch was attempted in the build container, but that environment cannot initialize EGL/WebGL, so interactive pointer-lock feel still needs to be verified in a normal browser by the project owner.

## Unfinished Milestone 1 work

- Firebase project configuration.
- Anonymous Authentication.
- Atomic invite-code room creation.
- Room joining and full/not-found validation.
- Firebase presence.
- Lobby player cards.
- Host controls and team cycling.
- Team randomization and Start validation.
- Cuboid player skin renderer using Minecraft-compatible 64×64 skins.
- Initial WebRTC signalling and realtime connection architecture.

## Known problems / intentional limits

- This slice has no Firebase configuration yet; Create/Join still show a small inline setup message rather than pretending rooms work.
- Editor marker visuals are temporary wire boxes, deliberately separate from map block data.
- Editor block breaking is immediate. Timed break hardness and crack overlays belong to the later combat refinement milestone, while the provenance/protection foundation is already in place.
- Movement values are centralized and can still be tuned during later polish, but the controller architecture and requested movement/flight behaviors are now implemented and covered by automated tests.
- Placeholder textures are intentionally simple and legally original.

## Important implementation decisions

- Chunk size is 16 blocks per axis.
- Each chunk stores block IDs and provenance in typed arrays.
- World geometry is rebuilt only for dirty chunks; neighboring chunks are dirtied when boundary voxels change.
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
