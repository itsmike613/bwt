# BEDWARS — DEVELOPMENT STATUS

## Current milestone

Milestone 2 — BedWars

Milestone 1 is complete and accepted through the project owner's real two-browser Firebase/WebRTC test on September 3, 2026.

Milestone 2 current slice: exported-map match loading, team/bed/death/respawn state, inventory/HUD, generators/resources, player-block foundations, and win-condition foundations.

## Milestone 1 — COMPLETE

Live verification accepted by the project owner:

- two separate anonymous Firebase users can join the same room from separate browser tabs;
- both players remain distinct room entries;
- the original creator remains host;
- team cycling, Randomize, and Start validation work;
- Start moves both clients into match state;
- both browsers report WebRTC DataChannels `1/1 connected`.

Completed Milestone 1 systems retained unchanged unless Milestone 2 integration required a narrow extension:

- shared fixed-step runtime, input, pointer lock, voxel world, chunk meshing, collision, player movement, camera, raycasting, placement/breaking, map loading/saving, and editor;
- 16×16×16 sparse chunks with grouped visible-face meshes and dirty-chunk rebuilding;
- original-map versus player-placed block provenance;
- editor Creative flight using collision-based `Player`; separate noclip `Fly` controller for spectators;
- editor markers and versioned JSON import/export;
- landing UI and synchronized 64×64 local placeholder skins;
- Firebase browser initialization, Anonymous Authentication with session persistence, atomic room claim/join, presence, lobby host ownership, team controls, Randomize, and Start validation;
- host-centered WebRTC DataChannel topology with RTDB only for signalling.

The accepted Firebase Web client configuration is permanently stored in `data/firebase.js` and must remain in future project ZIPs unless the project owner explicitly requests otherwise.

## Milestone 2 — implemented in this build

- Actual match mode loads `data/map.json` through the same `core/map.js` loader used for editor exports.
- Match startup validates required Red/Blue spawn, bed, forge, spectator, Diamond, and Emerald markers rather than hardcoding island geometry.
- The existing small placeholder map now contains marker metadata only so Milestone 2 can be browser-tested immediately. It is not intended as the real BedWars map.
- Red and Blue players spawn at their editor-defined team spawn markers.
- Beds are simple replaceable cuboid visuals positioned from editor markers.
- Own-team bed destruction is rejected; enemy bed state is host-authoritative over the existing DataChannel foundation.
- 20 HP player state and a numeric health progress bar above the hotbar.
- Nine-slot hotbar with 1–9 selection.
- 27 storage slots plus 9 hotbar slots = 36 general inventory slots.
- Stackable resource/block inventory foundations with 64-item stack caps.
- E opens/closes the simple 36-slot inventory; pointer lock is released while open.
- Death state distinguishes respawn waiting versus permanent elimination based on current team-bed state.
- Respawning players are hidden to remote living players, frozen at the editor-defined spectator waiting marker, retain camera look, and see a local 3 → 2 → 1 countdown.
- Host triggers respawn after the centralized three-second delay and restores health to 20 at the team spawn.
- Players dying after their bed is gone become permanently eliminated.
- Eliminated local players use the existing separate `Fly` controller for free-flight noclip spectator movement.
- Generic generator class supports arbitrary outputs/intervals.
- Each team forge is one generator at one marker producing both Iron and Gold.
- Diamond and Emerald generator markers create their corresponding generic generators.
- Generator timing constants are centralized in `data/balance.js`; current V1 foundation values are Iron 2s, Gold 8s, Diamond 30s, Emerald 45s.
- Host owns generator spawning and sends drop/countdown events over DataChannels; no per-second generator countdown writes are made to Firebase.
- Resource entities use four pooled `THREE.InstancedMesh` groups (Iron/Gold/Diamond/Emerald) instead of one scene object per dropped resource.
- Drop count is capped in centralized configuration to avoid uncontrolled entities.
- Living players automatically pick up nearby resource drops; the host owns drop removal and sends the resulting inventory pickup event.
- Diamond/Emerald holograms are local canvas sprites and update visible text only when the displayed whole-second value changes.
- Remote player movement uses the existing WebRTC channel at a modest 10 Hz foundation rate and local visual smoothing; Firebase is not used for gameplay-rate positions. This is an initial Milestone 2 use of the established transport, not the final Milestone 5 networking/interpolation pass.
- Player block event foundations support Wool, Wood, End Stone, and Obsidian IDs from the existing block registry.
- Placement continues to reject the local player's collision body using the shared `Build` helper.
- Original loaded map blocks remain provenance kind 1 and cannot be broken during matches.
- Player-placed blocks remain provenance kind 2 and are the only normal voxel blocks accepted by match breaking.
- `Build.spot()` was added as a narrow shared-core extension so networked placement can validate a target without dirtying/remeshing a chunk merely to test legality.
- BedWars state tracks bed existence, bed breaker identity, living/dead/eliminated state, and winner foundations.
- A team wins when its enemy bed is gone and every enemy player has become permanently eliminated. The current Milestone 2 UI shows a simple centered winner message; the full victory/statistics screen remains Milestone 5.
- Fall damage foundation is connected to the 20 HP system using centralized safe-fall configuration; void death uses the centralized void height.

## Milestone 2 intentionally unfinished / later milestones

These are not missing from the requested Milestone 2 slice; they belong to later frozen milestones:

- melee combat, swords, damage authority against other players, knockback, recent-attacker attribution, crack overlays, timed tool breaking, TNT, Fireballs, and attack/break swing refinement — Milestone 3;
- Item Shop, Island Shop, purchases, armor upgrades, sword upgrades, tool purchases, Golden Apples, Forge I/II purchase flow, and final balance — Milestone 4;
- final authoritative networking/refinement, reconnect behavior, active-match host disconnect recovery, End Game/New Game, chat, room cleanup, final Rules hardening, victory statistics — Milestone 5;
- sound/presentation/performance polish and Chromebook profiling — Milestone 6.

Because shops are Milestone 4, this build does not grant free Wool/Wood/End Stone/Obsidian merely to make manual block placement easy. The block inventory/placement/breaking foundation is implemented and testable in code; normal acquisition will come from the specified shop economy rather than adding a temporary gameplay rule.

## Tests and verification

Automated tests currently pass:

- `node core/test.js`
  - movement directions at multiple yaws;
  - grounded collision, jumping, held/buffered jumping, sprint-jumping over flat/raised terrain, crouch edge protection;
  - Creative flight toggle and collision;
  - falling/landing;
  - map/provenance/chunk dirtying foundations.
- `node net/test.js`
  - room/lobby validation and transactions;
  - mocked Join retry/control flow (explicitly mocked, not claimed as Firebase-runtime proof);
  - host election/team logic;
  - initial host-star WebRTC offer/answer/ICE/DataChannel behavior;
  - static Auth initialization audit confirming no project `getAuth()` or late `setPersistence()` path.
- `node mode/test.js`
  - 36-slot inventory and stack behavior;
  - 20 HP damage/death/respawn state;
  - bed destruction and permanent elimination;
  - win condition with one- and multi-player teams;
  - generic multi-output forge timing;
  - marker-driven team/diamond/emerald generator construction.

All project JavaScript also passes `node --check`, `rules.json` parses as valid JSON, and the Firebase configuration is present in `data/firebase.js`.

Browser/live verification still required for this Milestone 2 build:

- actual exported-map rendering in match mode on both browsers;
- correct team spawn positions from map markers;
- remote player visibility/movement foundation;
- bed targeting/destruction synchronization;
- fall/void death, waiting countdown, respawn, and eliminated noclip spectator behavior;
- host-generated resource spawning/pickup synchronization and hologram countdowns;
- winner foundation in a real two-browser match.

Automated tests do not claim to prove browser WebGL, pointer-lock, Firebase runtime, or real WebRTC timing behavior.

## Performance / engineering notes

- Existing chunk architecture and dirty-remesh behavior remain unchanged.
- Fixed-step 60 Hz player physics and render interpolation remain unchanged.
- Resource drops are instanced by resource type and globally capped rather than creating an uncontrolled mesh per item.
- Generator hologram DOM/canvas work is throttled to visible second changes; countdown values are calculated locally from synchronized generator state/events.
- Realtime gameplay positions use DataChannels at 10 Hz in this foundation, not Firebase and not animation-frame frequency.
- No dynamic shadows, general physics engine, React/framework layer, or renderer rewrite was introduced.
- Full remote interpolation/network authority tuning remains Milestone 5; real Chromebook profiling remains Milestone 6.
- Runtime teardown is still intentionally minimal. Match stop now halts its loop, but full removal of page-lifetime input/resize listeners is deferred until the specified Match → Lobby → Match lifecycle is implemented in Milestone 5.

## Important implementation decisions

- Map geometry is never hardcoded into the BedWars rules. Gameplay consumes exported block data plus editor marker metadata.
- Exported blocks load as protected original map geometry (kind 1); gameplay placements use kind 2.
- `Player` remains the collision-based living/editor controller. `Fly` remains the noclip spectator controller.
- `State` in `mode/state.js` is the small pure BedWars life/bed/win model; rendering and Firebase do not own these rules.
- `Inventory` in `core/inventory.js` is a reusable 36-slot storage foundation independent of shop UI.
- `Generator` in `mode/generator.js` is generic; forges are configured as one location with two outputs rather than separate Iron and Gold engines.
- The WebRTC host owns current Milestone 2 generator/drop, bed, death/respawn, and block-event decisions. This is deliberately small and builds on Milestone 1 rather than introducing a second networking system.
- RTDB remains room/lobby/presence/signalling infrastructure and is not used for rendering-rate gameplay state.
- Balance constants introduced by Milestone 2 live in `data/balance.js` for later tuning.
