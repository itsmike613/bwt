# BEDWARS — DEVELOPMENT STATUS

## Current milestone

Milestone 5 — Multiplayer — LIVE BUGFIX BUILD, LIFECYCLE/CHAT VERIFICATION PENDING

Milestone 1 is complete and accepted through the project owner's real two-browser Firebase/WebRTC test on September 3, 2026.

Milestone 2 is complete and accepted through the project owner's real two-browser match test on September 3, 2026. That live test verified both players entering the same shared world, synchronized BedWars state, both beds being destroyable, and the win foundation producing `Blue wins` correctly.

Milestone 3 is complete and accepted through the project owner's live browser test on September 3, 2026. That test verified both players joining the same world, consistent remote-player visibility, melee combat, damage, knockback, deaths/respawns, and working WebRTC.

Milestone 4 is complete after the project owner's live browser test on September 3, 2026. The live economy/shop systems worked well; the remaining proximity-only shop interaction bug was then fixed so a shop opens only when the crosshair ray hits its compact NPC interaction box within range and no nearer voxel blocks the ray.

Known non-blocking polish issues intentionally deferred:

- the current sword model is crude and belongs to Milestone 6 polish;
- remote player head pitch does not yet follow looking up/down and remains deferred unless an earlier dependency appears.

## Milestone 1 — COMPLETE

Live verification accepted by the project owner:

- separate anonymous Firebase users join the same room correctly;
- the original creator remains host;
- team assignment, Randomize, and Start validation work;
- Start moves both clients into match state;
- both browsers establish the expected host-centered WebRTC DataChannel.

The accepted Firebase Web client configuration remains permanently stored in `data/firebase.js` and must remain in future ZIPs unless the project owner explicitly requests otherwise.

## Milestone 2 — COMPLETE

Accepted live systems:

- exported editor-format map loading through the shared `core/map.js` loader;
- marker-driven Red/Blue spawns, beds, forges, spectator location, Diamond generators, and Emerald generators;
- 20 HP state and HUD;
- 9-slot hotbar plus 27 storage slots;
- stack/inventory foundations;
- death, 3 → 2 → 1 respawn waiting, permanent elimination, and noclip spectator flight;
- generic generators, combined Iron/Gold team forges, Diamond/Emerald generators, resource drops/pickup, and local hologram countdowns;
- original map blocks protected and player-placed block provenance retained;
- bed destruction and BedWars win-condition foundations;
- realtime match state over the existing WebRTC DataChannels rather than Firebase gameplay-rate writes.

### Milestone 2 remote-player rendering fix

The live symptom was intermittent remote visibility and incorrect apparent facing. Inspection covered `mode/actors.js`, `core/skin.js`, position/yaw snapshots, visibility state, materials/depth behavior, face winding, frustum culling, and feet-origin positioning.

Findings and changes:

- Remote movement snapshots were still being sent every 0.1 seconds even at zero speed, so standing-player disappearance was not caused by snapshots stopping.
- The host/client relay path was already keeping remote position state current; WebRTC was not rewritten.
- Minecraft skin cuboids use correct outward face winding. Normal Three.js front-face culling is retained.
- Each cuboid has a valid geometry bound and remains normally frustum culled; disabling frustum culling globally was not necessary.
- Player positions use a feet origin, and the skin geometry spans upward from that origin.
- The model's authored front points toward local `+Z`, while the shared camera/player yaw convention looks toward `-Z` at yaw zero. `core/pose.js` now applies the required half-turn and performs shortest-path yaw interpolation.
- Remote yaw now interpolates smoothly instead of snapping and correctly corresponds to the player's camera yaw.
- Base and outer skin layers no longer use one `transparent: true` material. They use alpha-tested cutout materials that participate normally in the depth pass, avoiding transparent-object sorting artifacts between layered cuboids.
- Skin crouch offset is stored separately and applied after actor position interpolation; actor position copying no longer overwrites the crouched visual offset.
- Skin geometries compute their bounds explicitly.
- Removed actors now dispose their model geometry/materials.
- Remote actors remain visible while standing still as long as their BedWars state is living and at least one position snapshot has been received.

The later Milestone 3 live browser test confirmed that remote players are visible consistently after this fix.

## Milestone 3 — COMPLETE

### Melee combat

- Wooden Sword is now the actual starting carried weapon for every player.
- Iron Sword and Diamond Sword use the same combat registry and are now acquired through the Milestone 4 Item Shop.
- Host owns attack timing, team checks, range checks, basic aim validation, damage, death outcome, and knockback values.
- Friendly players cannot be damaged by melee attacks.
- Clients request attacks; clients do not authoritatively assign damage.
- Melee reach, cooldown, fist damage, knockback, lift, and recent-attacker credit window are centralized in `data/balance.js`.
- Wooden/Iron/Diamond sword damage is centralized in `data/item.js`.
- Hit feedback briefly changes the local crosshair when the local player lands a validated hit.
- Knockback is applied to the victim's shared `Player` velocity rather than introducing another physics controller.
- A recent-attacker window is maintained by the host so a later fall or void death can still credit the player who caused the knock-off.

### Inventory/death authority

- Host now maintains an authoritative inventory mirror for every match player through `mode/bags.js`.
- This extends the existing inventory foundation without changing the room/Firebase schema.
- Client inventory rearrangement is preserved: ordinary host-authoritative changes are sent as add/remove deltas rather than repeatedly replacing the entire client slot layout.
- Full inventory reset is used only when appropriate, such as death or initial match synchronization.
- On death, Pickaxe, Axe, and Shears persist.
- Normal carried resources, blocks, utilities, and upgraded swords are removed.
- Wooden Sword is restored after death.
- Only the victim's carried Diamonds and Emeralds are transferred to a credited killer.
- Iron, Gold, blocks, TNT, Fireballs, and other normal consumables disappear on death.
- Armor persistence is now implemented in Milestone 4 match state and remains independent of carried inventory slots.

### Tools and timed breaking

- Pickaxe, Axe, and Shears are registered as the only V1 tools; no tool tiers were added.
- Timed player-block breaking replaces the earlier instant Milestone 2 break foundation.
- Correct-tool speed is data-driven:
  - Shears → Wool;
  - Axe → Wood;
  - Pickaxe → End Stone and Obsidian.
- Fists/wrong tools remain slower.
- Obsidian remains substantially slower than End Stone even with the Pickaxe.
- The host owns mining start/stop/completion and validates that the target is still a player-placed block and in reach.
- Changing the held tool during a break cancels the current timed break so the correct duration can be recalculated.
- Original map blocks never begin a mining action and therefore never display a crack overlay.
- `mode/crack.js` renders progressive transparent crack stages over active player-block targets without modifying the block texture itself.

### Animation

- Remote player yaw is smoothly interpolated.
- Walking animation remains procedural.
- Crouch visuals now retain their lowered pose correctly.
- Attack swings are sent as events and animated locally; limb rotations are not transmitted per frame.
- Active block breaking produces repeated local arm/tool swing animation from one start/stop action rather than per-frame network animation traffic.
- A simple held-item/tool cuboid is attached to the remote player's arm.
- `mode/hand.js` adds a simple first-person hand/held-item view with attack and repeated breaking swing motion.

### TNT

- TNT remains the Milestone 3 explosion system and is now acquired through the Milestone 4 Item Shop.
- Host-authoritative TNT placement validates selected ownership, placement coordinates, empty target space, and reach.
- TNT has a visible flashing/pulsing fuse.
- Fuse time, radius, player damage, knockback, and block power are centralized.
- Explosion effects are synchronized over the existing DataChannels.
- Explosions can remove appropriate nearby player-placed Wool/Wood/End Stone based on centralized resistance.
- Obsidian is intentionally resistant to the normal V1 TNT/Fireball blast values.
- Original loaded map geometry is never returned by the explosion block query and is never destroyed.
- Explosion damage respects team-friendly-fire rules while still allowing self-explosion consequences.

### Fireballs

- Fireball remains the Milestone 3 projectile system and is now acquired through the Milestone 4 Item Shop.
- Host creates the projectile from the authoritative player's latest yaw/pitch and position.
- Projectile speed, life, radius, damage, knockback, and block power are centralized.
- Fireballs collide with world voxels and living player positions on the host.
- Clients animate the same projectile locally from synchronized spawn state; the host sends the authoritative removal/explosion event.
- Fireball explosions use the same shared explosion/block-resistance path as TNT rather than duplicating explosion rules.
- Original map geometry remains protected.

### Host authority/networking

- Existing Firebase room/presence/signalling systems are unchanged.
- Existing host-star WebRTC topology is unchanged.
- Match additions use compact DataChannel state/action events: move, swing, hit, mine, inventory delta/reset, TNT, Fireball, blast, shop purchase, Forge upgrade, and Golden Apple use events.
- Firebase is still not used for rendering-rate gameplay state.
- No limb rotations, crack progress frames, projectile render frames, or generator countdown seconds are sent through Firebase.

## Milestone 4 — COMPLETE

### Item Shop

- Added a marker-driven Item Shop using the existing Red/Blue `item` markers from the shared editor/map format.
- Right-clicking while within configured reach of the player's own Item Shop opens the menu and releases pointer lock.
- The menu is a simple card-based UI with a slight background blur/dim and no extra commercial-style animation.
- Categories are exactly: Blocks, Weapons, Tools, Armor, Utility.
- Cards show a placeholder item icon, item name, centralized price/resource, short description, and Buy button.
- Wooden Sword and Leather Armor are shown as default equipment rather than paid purchases.
- Host-authoritative purchases now cover:
  - Wool;
  - Wood;
  - End Stone;
  - Obsidian;
  - Iron Sword;
  - Diamond Sword;
  - Pickaxe;
  - Axe;
  - Shears;
  - Iron Armor;
  - Diamond Armor;
  - Golden Apple;
  - TNT;
  - Fireball.
- Shop purchase requests travel over the existing DataChannels. The host validates player state, shop range, ownership/progression, inventory capacity, currency, and price before changing authoritative state.
- Purchases continue to use inventory add/remove deltas so client-side slot rearrangement is not overwritten by routine shop changes.

### Pricing and balance

- `data/balance.js` now centralizes all Milestone 4 shop prices, purchase quantities, Forge prices, armor reduction values, Golden Apple regeneration values, and Forge level timing.
- Iron, Gold, Emerald, and Diamond all retain their intended V1 economy roles. Diamonds are intentionally reserved for the Island Shop Forge upgrade path.
- Current V1 prices are tuneable data rather than scattered gameplay literals.

### Armor and swords

- Every player begins with Leather Armor in synchronized match state.
- Armor progression is exactly Leather → Iron → Diamond.
- Iron/Diamond armor purchases upgrade the player's persistent match armor tier and cannot downgrade it.
- Armor remains through death/respawn.
- Armor mitigation is centralized; fall damage bypasses normal armor reduction so the existing fall behavior is preserved.
- Sword progression is Wooden → Iron → Diamond.
- Buying an upgraded sword removes the current sword and adds the new sword through authoritative inventory deltas.
- Upgraded swords are still lost on death and Wooden Sword is restored on respawn.

### Tools and death persistence

- Pickaxe, Axe, and Shears are purchasable once and remain the only V1 tool versions.
- Purchased tools persist through death through the existing inventory `persist` path.
- Blocks, utilities, normal carried resources, and upgraded swords are still cleared on death according to `spec.md`.
- Killer loot remains limited to the victim's carried Diamonds and Emeralds.

### Golden Apples

- Golden Apples are now registered as a purchasable Utility item.
- Right-clicking while holding one requests host-authoritative consumption.
- One Golden Apple starts approximately 30 seconds of faster regeneration using centralized timing/heal values.
- A second Golden Apple cannot be eaten while regeneration remains active; effects do not stack.
- The regeneration state is synchronized and is cleared by death.

### Island Shop and Forge upgrades

- Added a marker-driven Island Shop using the existing Red/Blue `island` markers.
- The V1 Island Shop contains ONLY Forge I and Forge II.
- Both upgrades cost Diamonds and must be purchased sequentially.
- Forge upgrades are team-wide synchronized state and persist for the rest of the match.
- Forge I changes the team forge to approximately 1 Iron every 1.5 seconds and improves Gold timing.
- Forge II changes the team forge to approximately 1 Iron every 1 second and improves Gold timing again.
- Both Iron and Gold continue to come from the same generic team Forge generator rather than separate generator engines.
- Generator timing is updated locally from synchronized Forge level/state; countdown seconds are still not written to Firebase.

### Shop presentation/performance

- Added lightweight blocky Item Shop/Island Shop marker figures at the existing map markers so the interaction locations are visible in normal play.
- The shop display adds only a few simple meshes/sprites and does not alter voxel collision, chunk meshing, the editor, or map geometry.
- The public game remains `index.html`; no second game page or framework was introduced.

## Milestone 5 — LIVE BUGFIX BUILD, LIFECYCLE/CHAT VERIFICATION PENDING

### Milestone 4 interaction fix

- Removed proximity-only shop opening from the right-click path.
- Each Item Shop/Island Shop NPC now has a compact invisible body-sized interaction box; floating hologram sprites are not raycast targets.
- Shop targeting requires both crosshair-ray intersection and the existing configured shop reach.
- The voxel ray distance is compared with the shop hit distance, so a normal block in front of a shop wins and shops cannot be used through walls.
- Normal right-click block placement, TNT, Fireballs, Golden Apples, and existing shop/economy behavior remain unchanged when the shop is not the valid nearest interaction.
- Regression tests cover direct aim, aiming away while near, block occlusion, and out-of-range shops.

### Live M5 lifecycle bugfix pass

- The project owner's first live Milestone 5 test found New Game lifecycle accumulation and chat-behavior problems, so Milestone 5 is reopened and is not considered live-verified yet.
- `Hud` construction is now idempotent: it clears stale hotbar/inventory slot DOM before rebuilding, owns its 36 slot click handlers, and removes those handlers/nodes in `closeall()`. Every Arena therefore owns exactly 36 inventory slots and 9 hotbar slots.
- `Input` now owns named keyboard, mouse, blur, context-menu, pointer-lock, and canvas-click handlers and removes all of them in `close()`. Pointer capture/release also resets pending keys/buttons/clicks so closing chat or another match UI cannot leak an old click into gameplay.
- `View` now owns and removes its resize handler, disposes the Three.js renderer/render lists, forces WebGL context release when available, removes its canvas, and clears its scene on close.
- `Runtime.close()` now stops the loop, closes Input, clears world chunk geometry, disposes runtime-owned block textures/materials, clears callbacks, and closes View. `Runtime.stop()` remains the lightweight loop stop used where full disposal is not intended.
- `Arena.close()` is idempotent and now clears respawn/reconnect timers, tears down HUD/shop/chat/victory DOM listeners, closes all per-match scene systems, clears transient maps/sets, and finally closes the Runtime.
- `Shop` now owns/removes its persistent Close-button handler and clears generated tab/card DOM during teardown.
- `Match.close()` removes any stale stage children after Arena disposal, so repeated New Game cycles cannot accumulate game canvases. The match-load promise cleanup now checks task identity so completion of an older cancelled load cannot clear a newer load task.
- No engine rewrite, networking-topology change, Firebase-config change, or Milestone 6 work was introduced.

### Multiplayer/networking

- Preserved the existing host-star WebRTC architecture and host-authoritative action model.
- Existing 10 Hz movement snapshots and remote interpolation remain the realtime movement path; gameplay outcomes continue to use authoritative state/action events rather than Firebase rendering-rate writes.
- Failed/disconnected host↔client peer links now schedule a lightweight host-side re-offer without changing topology.
- Existing players can restore their room presence during an active match; new players are still rejected once the match has started.
- Same-tab/session reload recovery stores only the room code and public player profile in `sessionStorage`, then reuses Firebase Anonymous Auth session identity and the existing Join transaction to reconnect where possible.
- Non-host disconnects receive a centralized 10-second reconnect grace window. If they return, the host seeds authoritative state/inventory/world entities again; if they do not, they are permanently removed from active match state so a vanished player cannot block the win condition.

### Presence, host behavior, and room lifecycle

- Presence now marks players `online: false` on disconnect rather than immediately deleting their match membership; reconnect restores `online: true`.
- Lobby host election skips missing/offline hosts and promotes the oldest remaining online player.
- If the host disconnects during a match, clients do not attempt live simulation-host migration. The match closes safely, a centered `Host Disconnected` message is shown, another online player is elected, and the room returns to the same lobby.
- Added the host-only in-match `End Game` control; it returns everyone to the same room lobby.
- Added host `New Game` on the victory screen; it resets the in-memory match by returning the room to lobby so the next Start creates a clean Arena/map state without requiring rejoin/recreate.
- Non-host victory screens provide `Leave Room`.
- Added Firebase Functions source under `cloud/`: an RTDB presence trigger maintains the lone-player timestamp and promptly deletes zero-player rooms; a scheduled cleanup deletes rooms left with one player for at least one hour and prunes stale offline lobby entries.

### Chat

- `T` opens normal team chat and `/` opens command-ready chat while releasing gameplay input/pointer lock.
- Escape cancels chat without sending, clears the typed text, closes the input, resets pending gameplay input, and recaptures pointer lock.
- Enter sends once through the existing host-authoritative chat path, clears the typed text, closes chat, resets pending gameplay input, and recaptures pointer lock.
- Default messages are routed only to the sender's team by the authoritative host; `/shout message` is still routed to all online match players and remains visually distinguished with `[SHOUT]`.
- Chat display lifetime is centralized in `data/balance.js` (`chat.visible`, currently 7 seconds) and local retained history is capped by `chat.history` (currently 50 messages).
- While playing, new chat lines appear and then fade/hide after the visible-duration window. Opening chat reveals retained local history; closing chat hides/fades history older than that window again.
- Expiry uses one scheduled timeout for the next visible-message boundary rather than frame polling or network spam.
- Host-authoritative system death messages now share the same local history/fade presentation and are broadcast to everyone using existing validated death attribution: killer-attributed deaths use `Name was killed by Name`, unattributed void deaths use `Name fell into the void`, and other unattributed deaths use `Name died`.
- No chat cooldown, unrelated commands, Firebase chat polling, or separate death-state system was added.

### Victory and match statistics

- Authoritative synchronized match state now tracks per-player kills, deaths, and bed breaks.
- Death/kill statistics use the same validated combat/void/fall attribution path already used for gameplay outcomes.
- Bed-break statistics update only when the authoritative bed break succeeds.
- Added the required simple victory screen with winning team, all room players, team, kills, deaths, bed breaks, Red/Blue bed breakers, most kills, and most deaths.
- Winner/statistics remain part of the same synchronized state used by reconnect seed snapshots.

### Firebase rules/security

- Tightened `rules.json` so room writes require authenticated membership or a valid lobby join/create path.
- Player-record validation restricts ordinary players to their own record while retaining host team-control operations.
- Host/state transitions are validated so normal match start/reset requires the host, with the specific offline-host recovery transition allowed for remaining players.
- Signalling reads are scoped to the destination authenticated UID; signalling writes require the authenticated sender to be a room participant and target another room participant.
- Server cleanup uses Firebase Admin privileges rather than weakening client rules for `alone` timestamp maintenance.

### Deferred Milestone 6 polish

- The crude current sword model remains deferred.
- Remote head pitch remains deferred.
- Inventory/shop icons should support assets separate from world block textures during Milestone 6 polish; no premature icon-system redesign was added in Milestone 5.

No Milestone 6 polish work is intentionally included in this build.

## Tests and verification

Automated tests currently pass:

- `node core/test.js`
  - movement/collision/flight regressions from Milestone 1;
  - shared map/provenance/chunk behavior;
  - remote model yaw-axis correction and shortest-path yaw interpolation.
- `node net/test.js`
  - room/lobby validation and transactions, including active-match reconnect, lobby host promotion, host-disconnect recovery, and host reset rules;
  - mocked Firebase Join control-flow tests (explicitly mocked, not claimed as Firebase-runtime proof);
  - Auth initialization static audit;
  - host-star WebRTC offer/answer/ICE/DataChannel behavior and retry-path static audit;
  - presence, tightened rules, and server cleanup static audits.
- `node mode/test.js`
  - all earlier inventory/state/generator/combat/mining/explosion regressions;
  - Leather/Iron/Diamond armor state, mitigation, no-downgrade behavior, and persistence through death;
  - Golden Apple non-stacking regeneration and re-use after expiry;
  - Item Shop purchases for all required blocks, tools, swords, armor, Golden Apple, TNT, and Fireball;
  - centralized shop entries and correct currency roles;
  - tool one-time ownership and death persistence;
  - upgraded sword replacement/loss and Wooden Sword restoration;
  - Forge I/Forge II sequential Diamond purchases and team-only level state;
  - Forge I/II Iron and Gold interval changes;
  - shop ray-target regression tests for direct aim, aim-away, voxel occlusion, and range;
  - match statistics/disconnect-win regressions;
  - five consecutive HUD/Input create→dispose lifecycle cycles verifying exactly 9 hotbar slots, exactly 36 inventory slots, detached slot listeners, and no accumulating keyboard/pointer-lock/canvas-click handlers;
  - static ownership checks for resize-listener removal, renderer/WebGL disposal, canvas removal, world/material cleanup, Arena/Match teardown, and stale match-load task protection;
  - transient chat history/fade configuration, 50-message retention, history reveal, typed-text clearing, pointer release/recapture, system death-message formatting, `/shout`, End Game, and victory UI/action-path checks.

All project JavaScript passes `node --check`; `rules.json` and `data/map.json` parse as valid JSON; and `data/firebase.js` still contains the accepted permanent Firebase client configuration.

A headless Chromium smoke attempt in the build sandbox is still not treated as proof because the app imports Three.js/Firebase modules from external CDNs and this environment cannot resolve that CDN path. Automated/static checks therefore do not claim live pointer-lock/WebGL/Firebase/DataChannel verification. Milestone 5 remains live verification pending. The next live test should specifically run at least five Match → New Game → Lobby → Match cycles and confirm one game canvas, 9 hotbar slots, 36 inventory slots, no duplicated controls/handlers, normal T/`/`/Escape/Enter chat behavior, roughly 7-second transient chat with retained history on reopen, team chat and `/shout`, and authoritative death messages, while also rechecking the earlier M5 reconnect/presence/host-disconnect/victory paths and preserving Milestones 1–4.

## Performance / engineering notes

- Shared 16×16×16 chunk architecture and event-driven dirty remeshing remain unchanged.
- Fixed-step player physics and render interpolation remain unchanged.
- Remote player model rendering is still one shared `Skin` implementation; no duplicate player renderer was added.
- Skin cutouts now use the opaque/depth alpha-test path rather than transparent sorting.
- Frustum culling remains enabled rather than being disabled as a blanket rendering workaround.
- Remote movement remains at the existing modest 10 Hz network snapshot rate with local interpolation.
- Timed breaking sends start/stop events, not crack-frame updates.
- Active crack overlays are limited to active breakers rather than map-wide overlays.
- Resource drops remain instanced.
- TNT/Fireball visuals are lightweight cuboid/sphere entities; no general-purpose physics or particle engine was introduced.
- Explosion voxel scanning is bounded to each configured explosion radius and inspects only nearby voxel coordinates when an explosion actually occurs.
- Shop purchases/upgrades are infrequent action events over the existing DataChannels; no shop polling or Firebase gameplay-rate writes were added.
- Item/Island Shop world markers use only lightweight simple meshes/sprites.
- Golden Apple regeneration and Forge progression reuse the existing match tick/state path rather than adding background timers per client.
- Final network-efficiency profiling and Chromebook profiling remain Milestone 6 polish as specified.

## Important implementation decisions

- `spec.md` remains authoritative.
- `index.html` remains the single public app; `editor.html` remains separate.
- Game and editor continue to share the same runtime, voxel world, chunk meshing, collision, input, camera, raycasting, block interaction, map loader, and texture foundation.
- Map geometry remains data-driven and is never hardcoded into BedWars rules.
- Original-map blocks remain provenance kind `1`; player-placed blocks remain kind `2`.
- Eliminated spectator noclip continues to use `Fly`; normal/Creative collision-based movement continues to use `Player`.
- Host authority is layered over the existing WebRTC transport and does not move realtime gameplay into RTDB.
