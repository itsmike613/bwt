# BEDWARS — DEVELOPMENT STATUS

## Current milestone

Milestone 1 — Foundation

Current slice: shared voxel/core foundation and real editor integration.

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

## Completed in this slice

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
- Minecraft-inspired acceleration, friction, gravity, jumping, sprinting, crouching, crouched camera height, and block-edge crouch protection foundations.
- Shared voxel DDA raycasting.
- Shared placement validation that rejects placement inside the player body.
- Shared breaking foundation that protects original map blocks in game mode.
- Versioned JSON map format.
- Real `editor.html` using the shared core.
- Editor creative flight.
- Editor block palette driven from the shared block registry.
- Required editor marker metadata and editor-only marker visuals with labels.
- Repeating Diamond/Emerald generator markers are supported for maps with multiple generator islands.
- Selected marker metadata can be cleared from the editor without touching voxel geometry.
- Editor map import/export.
- New editor world starts with one block at 0,0,0.
- Simple `index.html` landing shell with username, skin, invite, Create, and Join controls.
- Skin registry foundation with local placeholder choices.
- Game-mode shared-core preview path (`index.html?preview=1`) using the same runtime, map loader, physics, raycast, placement, and protected-block rules as the editor.
- First-pass movement tuning centralized in `data/tune.js`.

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

- This slice has no Firebase configuration yet; Create/Join currently show a small inline setup message rather than pretending rooms work.
- Editor marker visuals are temporary wire boxes, deliberately separate from map block data.
- Editor block breaking is immediate. Timed break hardness and crack overlays belong to the later combat refinement milestone, while the provenance/protection foundation is already in place.
- Movement constants are first-pass values and are expected to be tuned during Milestone 6 without changing the collision architecture.
- Placeholder textures are intentionally simple and legally original.

## Important implementation decisions

- Chunk size is 16 blocks per axis.
- Each chunk stores block IDs and provenance in typed arrays.
- World geometry is rebuilt only for dirty chunks; neighboring chunks are dirtied when boundary voxels change.
- Each chunk is represented by a small set of meshes grouped by texture/material, not one mesh per block.
- Texture files are individual 32×32 PNGs so art can be replaced without an atlas build pipeline.
- Map export writes only block geometry and marker metadata; gameplay logic reads marker positions rather than hardcoding island geometry.
- Exported editor blocks load into game mode as original/protected map blocks.
- The editor and game modes import the same core modules; no duplicate voxel or physics implementation is planned.
- Balance/gameplay constants live in centralized data modules as systems are introduced; movement tuning begins in `data/tune.js`.
