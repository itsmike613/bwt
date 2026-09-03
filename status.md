# BEDWARS — DEVELOPMENT STATUS

## Current milestone

Milestone 4 — Economy — IMPLEMENTED IN THIS BUILD, LIVE VERIFICATION PENDING

Milestone 1 is complete and accepted through the project owner's real two-browser Firebase/WebRTC test on September 3, 2026.

Milestone 2 is complete and accepted through the project owner's real two-browser match test on September 3, 2026. That live test verified both players entering the same shared world, synchronized BedWars state, both beds being destroyable, and the win foundation producing `Blue wins` correctly.

Milestone 3 is complete and accepted through the project owner's live browser test on September 3, 2026. That test verified both players joining the same world, consistent remote-player visibility, melee combat, damage, knockback, deaths/respawns, and working WebRTC.

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

## Milestone 4 — IMPLEMENTED IN THIS BUILD, LIVE VERIFICATION PENDING

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

## Milestone 4 intentionally does not begin Milestone 5

The following remain frozen for later milestones and were not pulled forward:

- final reconnect/interpolation/host-disconnect behavior, chat, End Game/New Game, room cleanup, and match statistics — Milestone 5;
- full victory screen/New Game/Leave Room — Milestone 5;
- final sounds, presentation, sword-model improvement, performance profiling, and Chromebook polish — Milestone 6.

## Tests and verification

Automated tests currently pass:

- `node core/test.js`
  - movement/collision/flight regressions from Milestone 1;
  - shared map/provenance/chunk behavior;
  - remote model yaw-axis correction and shortest-path yaw interpolation.
- `node net/test.js`
  - room/lobby validation and transactions;
  - mocked Firebase Join control-flow tests (explicitly mocked, not claimed as Firebase-runtime proof);
  - Auth initialization static audit;
  - host-star WebRTC offer/answer/ICE/DataChannel behavior.
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
  - static shop UI/blur and Arena request-path checks.

All project JavaScript passes `node --check`; `rules.json` and `data/map.json` parse as valid JSON; and `data/firebase.js` still contains the accepted permanent Firebase client configuration.

A headless Chromium smoke attempt in the build sandbox was not treated as proof because the app imports Three.js/Firebase modules from external CDNs and the sandbox load stalled on that external dependency path. Automated/static checks therefore do not claim to prove live pointer-lock, WebGL shop visuals, Firebase runtime, or two-browser DataChannel timing. The project owner's next live test should focus on Milestone 4 purchase/upgrade/use behavior while also confirming Milestones 1–3 remain intact.

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
- Full network interpolation profiling and Chromebook profiling remain Milestones 5/6 as specified.

## Important implementation decisions

- `spec.md` remains authoritative.
- `index.html` remains the single public app; `editor.html` remains separate.
- Game and editor continue to share the same runtime, voxel world, chunk meshing, collision, input, camera, raycasting, block interaction, map loader, and texture foundation.
- Map geometry remains data-driven and is never hardcoded into BedWars rules.
- Original-map blocks remain provenance kind `1`; player-placed blocks remain kind `2`.
- Eliminated spectator noclip continues to use `Fly`; normal/Creative collision-based movement continues to use `Player`.
- Host authority is layered over the existing WebRTC transport and does not move realtime gameplay into RTDB.
