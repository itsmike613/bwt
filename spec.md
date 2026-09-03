# BEDWARS — MASTER PROJECT SPECIFICATION

You are helping me build a complete browser-based Minecraft-inspired BedWars game.

This specification is authoritative.

Do not casually redesign, simplify, expand, replace, or reinterpret these requirements. If an implementation detail has not been specified, make the smallest sensible decision that preserves this specification.

Do not add unsolicited gameplay systems.

Do not turn this into a generic Minecraft clone.

Do not overdesign the UI.

The gameplay itself, however, must NOT feel cheap or overly simplified. Movement, collisions, block interaction, combat, animations, world rendering, and multiplayer should receive serious attention so the actual game feels as close to Minecraft-style gameplay as reasonably possible in a browser.

I will make most of the creative assets myself.

---

# 1. GOAL

Create a simple browser BedWars game inspired by Minecraft/Hypixel BedWars.

It is not intended to become a huge commercial game.

It should be playable by people who do not own Minecraft or who want to play something simple in a browser, including reasonably modest school Chromebooks.

Maximum players:

10 players total.

Maximum team size:

5 players.

Teams:

Red vs Blue.

Minimum players required to start:

2.

There is no match timer.

There is no shrinking border.

The game continues until one team wins.

---

# 2. TECHNOLOGY

Use:

- HTML
- CSS
- JavaScript
- Three.js
- Google Firebase
- Firebase Realtime Database
- Firebase Anonymous Authentication
- WebRTC DataChannels where appropriate for realtime gameplay networking
- GitHub Pages for hosting the public static client

Do not introduce React, Vue, Angular, TypeScript, a large game engine, or another unnecessary framework.

Prefer native ES modules.

Keep deployment to GitHub Pages simple.

Firebase may provide backend functionality that GitHub Pages itself cannot provide.

---

# 3. NAMING RULE — VERY IMPORTANT

I hate camelCase and snake\_case.

Do not use either in project-authored naming.

Custom filenames should be one word.

Custom folders should be one word.

Custom classes should be one word.

Custom functions, variables, modules, CSS classes, IDs, and similar identifiers should use simple one-word names wherever reasonably possible.

Examples of acceptable names:

`world.js`

`player.js`

`physics.js`

`room.js`

`shop.js`

`editor.js`

`World`

`Player`

`Physics`

`spawn()`

`join()`

`leave()`

`break()`

`place()`

`room.host`

`team.red`

Prefer nesting objects over creating long compound identifier names.

Do not create filenames such as:

`PlayerController.js`

`game_state.js`

`roomManager.js`

`map-loader.js`

Use one-word equivalents or restructure the code.

Library/API names that I do not control obviously do not need to follow this rule.

---

# 4. PROJECT MEMORY

Create and maintain:

`spec.md`

This contains the permanent project rules and architecture.

Also create:

`status.md`

This tracks:

- current milestone
- completed features
- unfinished features
- known problems
- important implementation decisions

Treat `spec.md` as authoritative.

Do not depend on the conversation context alone.

Before major work, use the project files as the source of truth.

Update `status.md` as development progresses.

---

# 5. APPLICATION STRUCTURE

Do NOT create separate public landing and game HTML pages.

Use:

`index.html`

for the entire public game application.

It changes application state internally:

Landing → Lobby → Match → Lobby

Use a separate:

`editor.html`

for the map editor.

The editor and game MUST share the same underlying rendering, voxel world, physics, interaction, map-loading, texture, and related engine code.

Do not duplicate physics or voxel systems between the game and editor.

---

# 6. ARCHITECTURE

The project needs a reusable shared core.

Conceptually:

Shared Core

- runtime
- loop
- input
- renderer
- voxel world
- chunk meshing
- block registry
- collision
- player physics
- camera
- raycasting
- block placement
- block breaking
- map loading
- map saving
- inventory foundations

Then:

BedWars mode

and:

Editor mode

both use that exact shared core.

Three.js should primarily be the rendering layer.

Do not let rendering, Firebase, physics, combat, UI, BedWars rules, and editor code become one enormous file.

Use clean modules.

---

# 7. VOXEL WORLD

The world should behave like a Minecraft-style block world.

Do NOT create one independent Three.js mesh for every block.

Use efficient voxel rendering.

Use chunks or another sensible grouped system.

Generate/render only visible block faces where practical.

The project must remain performant on relatively weak Chromebooks.

My block textures will be 32×32 pixels.

Do not use Minecraft's copyrighted textures.

Use simple temporary placeholder textures until I replace them.

The engine should make replacing textures easy.

---

# 8. MODELS AND VISUAL ASSETS

Do not require Blender models or a models pipeline.

Minecraft-style players should be built from simple cuboid geometry:

- head
- torso
- arms
- legs

Beds and other blocky objects can also use simple geometry.

Assets should mainly consist of:

- textures
- skins
- item icons
- sounds
- UI assets if needed

I will make my own textures/assets later.

I will choose sounds later, such as suitable reusable sounds from Pixabay or similar sources.

Build clean sound hooks but do not make creative asset decisions for me.

---

# 9. PLAYER CONTROLS

Use familiar Minecraft-like controls.

At minimum:

WASD = movement

Mouse = look

Space = jump

Shift = crouch

Ctrl = sprint

1–9 = select hotbar slot

E = inventory

T = open chat

/ = open chat ready for a command

Left mouse = attack or break

Right mouse = place or interact where appropriate

Use pointer lock during gameplay.

Opening inventory, chat, or shops should release/capture input appropriately.

---

# 10. MOVEMENT AND PHYSICS

This part is IMPORTANT.

Do not make movement feel like a generic Three.js walking demo.

Implement Minecraft-inspired:

- gravity
- acceleration/deceleration
- jumping
- sprinting
- crouching
- solid voxel collision
- player bounding box collision
- grounded detection
- fall behavior
- appropriate fall damage
- knockback
- void death
- responsive mouse look
- sensible block reach
- block-edge crouching behavior

When crouching:

- movement is slower
- player height/camera lowers appropriately
- other players see a crouched pose
- the player should not simply walk off a block edge while crouching
- jumping can cancel crouching appropriately

Tune the values for a convincing Minecraft-like feeling.

Do not use a huge general-purpose physics engine unless genuinely necessary.

A proper voxel/AABB collision system is preferred.

---

# 11. LANDING SCREEN

Keep the UI simple.

The landing screen contains:

- Username input
- Skin dropdown
- Invite code input
- Create button
- Join button

CREATING:

The creator enters:

- username
- skin
- desired invite code

Then presses Create.

The room code must be atomically claimed so two users cannot create the same code simultaneously.

Use a Firebase RTDB transaction or similarly correct mechanism.

If the invite code is already taken, show a small red inline error near the relevant input/button.

JOINING:

A player enters:

- username
- skin
- invite code

Then presses Join.

If the room exists and is not full, continue to the lobby.

If it does not exist, show a small red inline error.

If the room is full, show a small red inline error.

Other normal form errors should also use small inline red messages.

DO NOT create an error page for ordinary form errors.

---

# 12. SKINS

Players choose a skin before creating or joining a room.

Use a dropdown containing the available skins.

Use the normal Minecraft-compatible 64×64 skin layout as the basis for the skin renderer.

Use a few legally reusable/simple placeholder skins initially.

Do not depend on random hotlinked skin websites.

I will make and add my own skins later.

Adding another skin should be easy.

Each player's chosen skin must synchronize so everyone sees it.

---

# 13. ROOMS

Use Firebase for room/lobby state.

Maximum room size:

10.

Each room should track the players currently inside.

Use Firebase presence mechanisms appropriately.

Use Anonymous Authentication so users do not need accounts.

The creator initially becomes the room host.

---

# 14. LOBBY

The lobby should feel simple, somewhat like Kahoot.

Show every player as a simple username card.

The host can assign teams.

Each player's card on the host screen has a team control that cycles:

Unassigned → Red → Blue → Unassigned

Players should clearly see which team they are assigned to.

The Start button stays disabled until:

- there are at least 2 players
- everyone has been assigned
- Red contains at least 1 player
- Blue contains at least 1 player

Maximum teams are 5 vs 5.

The lobby host also has a:

Randomize

button.

Randomize puts everyone into Red or Blue as evenly as possible.

If the player count is odd, one team may contain one additional player.

---

# 15. HOST BEHAVIOR

If the host disconnects while still in the lobby:

Automatically promote another remaining player to host.

Do not destroy the room unnecessarily.

If the host disconnects DURING an active match:

Do not attempt complicated live authoritative-host migration.

End the current match safely.

Show a centered message/modal such as:

Host Disconnected

The host left the match.

Then elect another available player as host and return the remaining players to that same room's lobby.

The room itself should survive if players remain.

The host must also have an End Game control during a match.

Pressing End Game returns everyone in that room to the lobby.

---

# 16. ROOM CLEANUP

Rooms should not live forever.

When a room contains exactly one player:

Store a Firebase server timestamp such as an alone timestamp.

If another player joins:

Clear that timestamp.

If the room later returns to exactly one player:

Start a new timestamp.

If the room remains at one player for one hour:

Automatically delete the room.

If the remaining player still has the tab open when this happens:

Return them to the landing screen.

Use robust Firebase/server-side cleanup where necessary rather than trusting one browser timer.

A scheduled Firebase function is acceptable for this specific cleanup task.

Rooms containing zero players may be cleaned up promptly.

---

# 17. NETWORKING

Firebase is appropriate for:

- room creation
- lobby state
- team assignment
- chat
- presence
- matchmaking metadata
- WebRTC signalling
- persistent match metadata where appropriate

Do NOT blindly synchronize realtime player coordinates through RTDB at excessive frequency.

For realtime match networking, use a sensible WebRTC DataChannel architecture.

For this small private game, the host browser may act as the authoritative match simulation host.

Maximum connections are small because the game is capped at 10 players.

Clients should generally send inputs/actions.

The authoritative host determines important game outcomes and distributes snapshots/events.

Do not transmit animation frames continuously.

Transmit events/state and let clients animate locally.

Examples:

- attack event
- swing event
- block event
- item event
- player snapshot

The implementation should tolerate normal latency reasonably well.

Do not attempt enterprise anti-cheat.

This is a small friends/browser game.

Be aware that some restrictive school networks may interfere with direct WebRTC connections. Design the networking cleanly enough that a relay/server approach could be introduced later if needed.

---

# 18. MAP DESIGN

The intended BedWars style is approximately:

- Red team island
- Blue team island
- central emerald island
- two diamond islands

Approximately 5 islands total.

However, the exact geometry is designed through the editor and must NOT be hardcoded into the game engine.

---

# 19. MAP EDITOR

`editor.html` is a real map-building application.

It uses the exact shared world engine used by the game.

Do not build a separate fake editor physics system.

Initially, an empty/new editor world contains one starting block at:

0, 0, 0

The editor should provide Minecraft-like creative building.

It needs:

- shared voxel rendering
- block placement
- block destruction
- camera
- mouse controls
- creative flight
- large editor inventory/palette
- easy selection of every build block
- special map markers
- import
- export

The editor inventory is not restricted to the normal game's nine-slot hotbar.

It can contain many map-design items.

Friends should be able to visit `editor.html` and build maps too.

---

# 20. EDITOR MARKERS

The editor requires special metadata objects/tools for defining gameplay locations.

At minimum provide markers for:

- Red spawn
- Blue spawn
- Red bed
- Blue bed
- Red team forge
- Blue team forge
- Diamond generator
- Emerald generator
- spectator/respawn waiting location
- Red Item Shop
- Blue Item Shop
- Red Island Shop
- Blue Island Shop

These markers are editor tools/metadata.

They should not become normal visible gameplay blocks.

They may have obvious temporary editor-only visuals so the map designer can locate them.

The game reads their positions from the exported map.

---

# 21. MAP FORMAT

Maps should export into a clean JSON-based format.

The editor must support:

- downloading/exporting the map file
- importing/loading a map file
- optionally copying the map JSON if convenient

The same world loader used by the game consumes that exported map.

Keep the format versioned so it can evolve later without immediately breaking old maps.

---

# 22. BREAKABLE BLOCK RULE

This rule is intentionally extremely simple.

EVERY block that is part of the original loaded map is indestructible during a match.

EVERY normal block placed by players during the active match is breakable.

No complicated map-block permission metadata is needed.

No arbitrary per-map-block breakable rules.

Original map blocks:

- cannot be broken
- should not display a cracking/breaking overlay
- should not pretend they are being damaged

Player-placed blocks:

- can be broken

The editor itself can obviously edit map blocks while designing.

---

# 23. BLOCKS

Player-purchasable building blocks:

- Wool
- Wood
- End Stone
- Obsidian

Players can use their fist or any tool against any breakable player block.

However, the correct tool is much faster.

Shears:

best for Wool.

Axe:

best for Wood.

Pickaxe:

best for End Stone and Obsidian.

Obsidian must take noticeably longer to break than End Stone even with the pickaxe.

Wrong tools or fists are much slower.

Do not create tool tiers.

There is only:

- Pickaxe
- Axe
- Shears

No wooden/stone/iron/diamond pickaxe progression.

---

# 24. BLOCK BREAKING ANIMATION

Breakable blocks need a Minecraft-inspired cracking animation.

Do not permanently alter their underlying texture.

Render a transparent crack overlay over the targeted block.

Use progressive stages based on:

current breaking progress / required breaking time

For example:

normal → crack1 → crack2 → crack3 → ... → broken

The speed depends on:

- block material
- selected tool
- whether it is the correct tool

Original map blocks never show the crack overlay because they cannot be broken.

---

# 25. BLOCK PLACEMENT

Placement should feel Minecraft-like.

Use voxel-aligned placement based on the face being targeted.

Do not allow blocks to be placed illegally inside the player's collision body.

Player-placed blocks need to be tracked separately from original map geometry so the game knows they are breakable and can remove them during match reset.

---

# 26. TEAMS

There are exactly two teams:

Red

Blue

Maximum:

5 players per team.

Friendly players should not damage each other.

Players cannot destroy their own team's bed.

Team colors should appear consistently in:

- names where appropriate
- lobby cards
- player indications
- beds/base identity
- victory screen

Keep the visuals simple.

---

# 27. BEDS

Each team has one bed.

As long as a player's team bed exists:

death results in respawning.

When a bed is destroyed:

that team's future deaths become permanent eliminations.

Track who destroyed each bed.

When a team's bed is destroyed AND every member of that team has become eliminated:

the other team wins immediately.

---

# 28. DEATH AND RESPAWNING

When a player dies while their bed is alive:

- make them invisible to living players
- disable normal collision/interactions
- move them to the editor-defined spectator waiting location
- freeze positional movement
- allow 360-degree camera look
- show a large countdown:

3

2

1

- respawn them at their team's spawn

When a player dies after their bed is gone:

They are permanently eliminated for that match.

Eliminated players become:

- invisible
- non-colliding
- unable to affect gameplay
- free-flying spectators
- able to look/move freely around the map

Reuse the editor-style flight controller where practical.

---

# 29. INVENTORY LOSS ON DEATH

Players lose normal carried items when they die.

Persistent through death:

- current armor upgrade
- Pickaxe if purchased
- Axe if purchased
- Shears if purchased

Lost on death:

- blocks
- TNT
- Fireballs
- Golden Apples
- Iron
- Gold
- Diamonds
- Emeralds
- upgraded sword
- other consumables

A respawning player receives a Wooden Sword again.

If another player was responsible for the death:

The killer receives ONLY the victim's carried:

- Diamonds
- Emeralds

The victim's Iron and Gold disappear.

Other consumables disappear.

For void/fall deaths after combat, maintain a configurable recent-attacker window so knocking somebody into the void still correctly awards:

- the kill
- their Diamonds
- their Emeralds

Do not make kill attribution unnecessarily complicated.

---

# 30. HEALTH

Use Minecraft-style:

20 maximum health points.

Do not display Minecraft hearts.

Instead display a clean health progress bar.

The health bar should be approximately the full width of the hotbar.

Show the numeric health above/on the bar, such as:

17 / 20

Damage, regeneration, combat, fall damage, explosions, etc. modify this health system.

---

# 31. HOTBAR AND INVENTORY

The normal game hotbar contains:

9 slots.

Use keys:

1 through 9.

Add a proper inventory.

Press:

E

to open it.

Inventory storage:

3 rows of 9 slots = 27 slots

plus:

9-slot hotbar

Total general carrying capacity:

36 slots.

Do NOT add:

- crafting
- crafting grid
- recipes
- offhand
- complicated Minecraft inventory tabs

Armor should be handled as equipment rather than requiring a complicated manually managed armor inventory interface.

Inventory interaction should still feel natural and Minecraft-like.

---

# 32. STARTING EQUIPMENT

Every player begins with:

Leather Armor

Wooden Sword

Leather Armor is the default armor.

Wooden Sword is the default sword.

---

# 33. ARMOR

Armor progression:

Leather → Iron → Diamond

Iron Armor:

purchased with Gold.

Diamond Armor:

purchased with Emeralds.

Buying better armor replaces the current armor tier.

Armor upgrades persist after death for the rest of that match.

Do not create additional armor tiers.

---

# 34. SWORDS

Sword progression:

Wooden → Iron → Diamond

Wooden Sword:

default/free.

Iron Sword:

purchased with Gold.

Diamond Sword:

purchased with Emeralds.

Buying a sword replaces the currently equipped sword.

Upgraded swords do NOT persist through death.

After respawning:

return to Wooden Sword.

---

# 35. COMBAT

Combat should feel Minecraft-inspired rather than like generic raycast damage.

Include:

- melee range
- attack timing
- sword swing
- knockback
- hit feedback
- damage
- death
- recent-attacker kill attribution
- fall/void kills
- multiplayer synchronization

Do not overcomplicate V1 with enchantments or advanced combat abilities.

---

# 36. PLAYER ANIMATION

Because characters are simple cuboids, animations should be procedural.

No skeletal animation pipeline is required.

Other players should visibly animate.

At minimum:

Walking:

arms/legs swing appropriately.

Crouching:

body/pose lowers.

Attacking:

arm swings.

Breaking:

arm/tool swings appropriately.

For the local first-person view:

animate the held item/hand during swings.

Use short position/rotation animations.

Do NOT continuously transmit limb rotation values over the network.

Transmit actions/events and animate locally.

---

# 37. RESOURCES

The game contains exactly these currencies/resources:

Iron

Gold

Diamond

Emerald

---

# 38. GENERATOR SYSTEM

Implement one reusable generic generator system.

Do NOT create completely separate generator engines for each material.

A generator can contain:

- location
- outputs
- intervals
- level/configuration
- next spawn timing

A team forge produces BOTH:

Iron

and:

Gold

from the same physical spawn location.

Diamond generators produce:

Diamonds.

Emerald generators produce:

Emeralds.

Generated resources should appear/pick up naturally like BedWars resources.

Keep generator timing data configurable rather than hiding balance numbers throughout the code.

---

# 39. FORGE UPGRADES

Keep forge upgrades.

Do NOT remove Diamonds.

Diamonds intentionally have a small strategic use in V1.

The Island Shop/team upgrade shop contains only:

Forge I

Forge II

That is the entire upgrade tree for V1.

Do NOT add:

- Sharpness
- Protection
- Haste
- Traps
- Heal Pool
- Dragons
- complicated Hypixel upgrades

The forge starts relatively slow.

Starting target for Iron:

approximately 1 Iron every 2 seconds.

Forge I target:

approximately 1 Iron every 1.5 seconds.

Forge II target:

approximately 1 Iron every 1 second.

The team forge produces Iron and Gold.

Forge upgrades should improve the team's forge economy appropriately.

Keep exact Gold timing and other balance numbers centralized in configuration so they can easily be tuned later.

---

# 40. GENERATOR HOLOGRAMS

Diamond and Emerald generator locations should have floating Minecraft/Hypixel-style hologram text.

Example:

Diamond

Spawns in 7s

or:

Emerald

Spawns in 3s

Do not write the countdown into Firebase every second.

Synchronize the generator's authoritative next spawn time/event and calculate/render the visible countdown locally.

---

# 41. ITEM SHOP

Each team's Item Shop opens a simple menu.

Keep the UI intentionally plain for V1.

The environment behind it may be slightly blurred/dimmed.

Use one main shop panel containing item cards.

Each item card should show:

- item icon
- item name
- price
- resource used for price
- short description
- Buy button

Suggested categories:

- Blocks
- Weapons
- Tools
- Armor
- Utility

Do not build a fancy animated commercial UI.

The UI can be improved later.

Prioritize responsiveness and clarity.

---

# 42. ISLAND SHOP

Each team's Island Shop is the team upgrade shop.

For V1 it contains ONLY:

Forge I

Forge II

These are purchased with Diamonds.

Nothing else.

---

# 43. ITEMS

Required V1 gameplay items/systems:

Resources:

- Iron
- Gold
- Diamond
- Emerald

Armor:

- Leather
- Iron
- Diamond

Weapons:

- Wooden Sword
- Iron Sword
- Diamond Sword

Tools:

- Pickaxe
- Axe
- Shears

Blocks:

- Wool
- Wood
- End Stone
- Obsidian

Utility:

- Fireball
- TNT
- Golden Apple

Do not add unrelated Minecraft items.

---

# 44. TNT

TNT is purchasable from the Item Shop.

It should:

- be placeable
- have a visible fuse
- explode after its fuse
- damage nearby players
- apply knockback
- affect appropriate nearby player-placed blocks
- NEVER destroy original map geometry

Explosion/block interaction values should be configurable.

Preserve the usefulness of stronger defense materials such as Obsidian.

Do not build an unnecessarily complicated explosion simulation.

---

# 45. FIREBALLS

Fireballs are purchasable utility items.

They should behave like a BedWars-style projectile.

Include:

- visible projectile
- collision
- explosion
- player damage
- strong knockback
- appropriate interaction with player-placed blocks
- no destruction of original map geometry

Keep damage, knockback, speed, radius, and block interaction configurable.

---

# 46. GOLDEN APPLES

Golden Apples are purchasable utility items.

Eating one gives faster health regeneration for approximately:

30 seconds.

A player cannot eat another Golden Apple while that regeneration effect remains active.

Do not allow regeneration effects to stack.

Keep exact regeneration values configurable.

---

# 47. SHOP BALANCE

Do not scatter prices throughout the code.

Create centralized game/balance configuration data containing:

- shop prices
- damage values
- tool speeds
- block hardness
- generator speeds
- forge levels
- item behavior
- explosion values
- health values
- respawn delay
- kill credit window
- other balance constants

This should make later balancing easy without rewriting systems.

---

# 48. CHAT

Add ingame text chat.

Press:

T

to open normal chat.

Press:

/

to open chat in a way that makes command entry natural.

Default messages are TEAM CHAT.

If a Red player sends:

hello

only Red players receive it.

If a Blue player sends:

hello

only Blue players receive it.

Add:

/shout message

This sends the message to EVERYONE.

There is NO cooldown on team chat.

There is NO cooldown on `/shout`.

Clearly distinguish shouted messages visually.

Example:

[SHOUT] Mike: hello

Keep the chat system simple.

---

# 49. WIN CONDITION

A team wins when:

The enemy bed has been destroyed

AND

every player on that enemy team has died after the bed was destroyed.

End the match immediately when this condition becomes true.

---

# 50. VICTORY SCREEN

At the end of the match show a simple victory screen.

Show:

- winning team
- all players
- team
- kills
- deaths
- bed breaks

Also show clearly:

- who broke the Red bed, if destroyed
- who broke the Blue bed, if destroyed
- player with most kills
- player with most deaths
- relevant match leaderboard information

Do not turn this into an elaborate statistics system.

Normal non-host players get:

Leave Room

The host gets:

New Game

New Game resets the match state and brings EVERY player in the room back into that room's lobby.

It must not require everyone to recreate/join the room.

---

# 51. UI PHILOSOPHY

KEEP THE UI SIMPLE.

This is deliberate.

Examples:

Landing:

clean inputs/buttons.

Lobby:

simple username cards.

Shop:

one large card/panel with smaller item cards.

Inventory:

clean slot grid.

Victory:

clean scoreboard/card.

Errors:

small inline red text for normal validation.

Modal:

only for disruptive events where a normal inline message does not make sense.

Use subtle background blur/dimming behind inventory/shop/modal surfaces if useful.

Do NOT spend enormous development effort making flashy UI right now.

The visual UI will be expanded later.

---

# 52. GAMEPLAY PHILOSOPHY

Unlike the UI, DO NOT cheap out on gameplay feel.

Spend development effort on:

- movement
- physics
- collision
- mouse controls
- voxel rendering
- block targeting
- block placement
- breaking
- swing animation
- crack animation
- combat feedback
- knockback
- inventory responsiveness
- multiplayer smoothness
- generator timing
- player rendering

The goal is:

simple website UI

but:

convincing Minecraft-like game feel.

---

# 53. OUT OF SCOPE

Do NOT add these to V1:

- Potions
- Bows
- Hunger
- Crafting
- Enchantments
- Mobs
- Chests unless absolutely needed later
- Ranked matchmaking
- Public matchmaking
- Account system
- Cosmetics system
- Battle pass
- Complex party system
- Map voting
- Multiple game modes
- Shrinking border
- Match timer
- Complicated upgrade trees
- Protection upgrade
- Sharpness upgrade
- Haste upgrade
- Traps
- Heal Pool
- Dragons
- Minecraft's full item catalog

Do not expand scope because something "would be cool."

---

# 54. DEVELOPMENT PROCESS

Do NOT attempt to generate the entire finished project as one enormous uncontrolled response.

Also do NOT create isolated toy systems that will later be thrown away.

Develop this as six integrated milestones.

Every milestone must build directly on the real project.

Every milestone should leave the project runnable.

Avoid temporary architecture that needs to be rewritten immediately afterward.

---

# 55. MILESTONE 1 — FOUNDATION

Build the real shared engine foundation.

This milestone includes:

- project structure
- `spec.md`
- `status.md`
- Three.js setup
- shared game loop
- shared input system
- voxel world
- efficient chunk/mesh rendering
- 32×32 texture support
- player collision
- Minecraft-like movement
- jumping
- sprinting
- crouching
- camera
- raycasting
- block placement
- block breaking foundations
- protected original map blocks
- player-placed block tracking
- editor mode
- editor creative flight
- editor palette
- map markers
- map import/export
- landing UI
- Firebase initialization
- Anonymous Authentication
- room creation
- room joining
- invite-code transactions
- presence foundations
- lobby
- team assignment
- Randomize
- Start validation
- skin selection
- basic player skin rendering
- initial multiplayer connection architecture

IMPORTANT:

The editor is not a throwaway project.

It uses the same shared core as the game.

Once the editor can create/export maps, I should be able to begin designing the real BedWars map while later milestones continue.

---

# 56. MILESTONE 2 — BEDWARS

Add:

- beds
- team spawns
- team bases
- map markers in gameplay
- player deaths
- respawning
- countdown spectator state
- permanent eliminated spectator state
- free spectator flight
- 20 HP system
- health bar
- hotbar
- inventory
- 36-slot carrying layout
- resource pickup
- generic generators
- Iron/Gold team forge
- Diamond generators
- Emerald generators
- hologram countdowns
- basic player-placed defense blocks
- win-condition foundations

---

# 57. MILESTONE 3 — COMBAT

Add and refine:

- melee combat
- swords
- damage
- knockback
- hit feedback
- fall/void kill attribution
- tools
- tool-specific breaking speeds
- Obsidian slower than End Stone
- crack overlays
- arm/tool swings
- first-person swing
- other-player animations
- TNT
- Fireballs
- explosion behavior
- death inventory handling
- Diamond/Emerald transfer to killer
- multiplayer combat authority

---

# 58. MILESTONE 4 — ECONOMY

Add and refine:

- complete Iron/Gold/Diamond/Emerald economy
- Item Shop
- shop card UI
- prices
- blocks
- tools
- swords
- armor
- Golden Apples
- utility purchases
- Island Shop
- Forge I
- Forge II
- armor persistence
- tool persistence
- sword reset on death
- centralized balance configuration

---

# 59. MILESTONE 5 — MULTIPLAYER

Complete/refine:

- WebRTC synchronization
- host authority
- snapshots
- action events
- network interpolation where appropriate
- lobby/network edge cases
- player joining/leaving
- host promotion in lobby
- host disconnect behavior during matches
- reconnect handling where reasonably possible
- End Game control
- New Game control
- team chat
- `/shout`
- room cleanup
- presence
- Firebase rules/security
- victory synchronization
- match statistics

---

# 60. MILESTONE 6 — POLISH

Refine:

- Minecraft-like movement feel
- combat feel
- animations
- block cracks
- player animation
- crouching
- first-person item motion
- generator presentation
- sounds/hooks
- loading
- errors
- UI responsiveness
- performance
- chunk optimization
- entity optimization
- Chromebook testing
- network efficiency
- GitHub Pages deployment
- Firebase production configuration
- bugs
- final cleanup

Do NOT use this milestone as an excuse to add new gameplay systems.

---

# 61. PERFORMANCE

Target normal laptops and modest Chromebooks.

Avoid:

- one mesh per voxel
- unnecessary allocations every frame
- huge Firebase update rates
- transmitting animations every frame
- excessive DOM updates
- hundreds of uncontrolled item entities
- unnecessary high-resolution effects
- expensive dynamic shadows if they hurt performance

Prioritize stable framerate over visual gimmicks.

Use sensible pooling/batching/meshing where helpful.

---

# 62. FIREBASE

I have not used Firebase RTDB before.

When Firebase setup becomes necessary, guide me through it clearly.

I will need instructions for:

- creating the Firebase project
- creating a Web app
- configuration
- Anonymous Authentication
- Realtime Database
- RTDB rules
- Firebase presence
- server timestamps
- WebRTC signalling data
- scheduled cleanup function if used
- deploying the Firebase backend pieces
- connecting it safely to GitHub Pages

Do not assume I already know Firebase.

Explain setup steps when I actually need to perform them.

Remember:

Firebase client configuration being visible in browser JavaScript is normal.

Security must come from proper Firebase Authentication and Database Rules rather than pretending the public client configuration is a secret.

---

# 63. GITHUB PAGES

The final public client must work from GitHub Pages.

Be careful with:

- relative paths
- module imports
- case sensitivity
- repository subpaths
- static asset paths
- refresh behavior
- Firebase initialization
- WebRTC secure-context requirements

Do not design a deployment architecture that quietly requires a traditional Node server to serve the website.

Firebase backend services are allowed.

---

# 64. CREATIVE OWNERSHIP

Do not attempt to creatively finish the project for me.

I want to remain the game designer.

I will make:

- map geometry
- textures
- custom skins
- many icons
- sound choices
- visual personality
- future balancing decisions

Use placeholders where necessary.

Make placeholders easy to replace.

Do not surprise me with extensive redesigns, polished themes, extra mechanics, giant menus, new game modes, or features I did not request.

Act as the engineer helping me implement MY game.

---

# 65. QUALITY RULES

Do not produce spaghetti code.

Do not build core systems twice.

Do not put the entire game into one `game.js`.

Do not duplicate the physics engine inside the editor.

Do not hardcode map geometry.

Do not scatter game balance values throughout the code.

Do not make Firebase responsible for rendering-rate gameplay synchronization.

Do not create hundreds of Three.js meshes unnecessarily.

Do not create systems merely to imitate Hypixel if this specification intentionally removed them.

Do not sacrifice gameplay feel merely because the UI is simple.

When something can be data-driven, make it data-driven.

When a reusable shared system makes sense, use one.

---

# 66. FIRST ACTION

Treat everything above as frozen V1 scope.

Do not begin by proposing another completely different architecture.

Do not respond with a giant brainstorm.

Begin by:

1. establishing the actual project structure,
2. creating `spec.md` and `status.md`,
3. outlining the concrete internal implementation order for Milestone 1,
4. then beginning the real Milestone 1 implementation.

The first technical priority inside Milestone 1 is the shared core required by BOTH the real game and map editor:

voxel world → rendering → input → player physics → collision → camera → raycasting → block interaction → shared map format → editor.

Then integrate that foundation into:

rooms → lobby → teams → multiplayer.

Every piece written should be intended to survive into the finished game.

This project should ultimately feel like:

**a simple Kahoot-style room system attached to a genuinely fun browser BedWars game with Minecraft-like mechanics.**