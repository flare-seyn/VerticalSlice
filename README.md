# GDIM33 Vertical Slice

## Milestone 1 Devlog

### Prompt 1: Pick 1 Visual Scripting Graph and explain how it works
The Visual Scripting graph I modeled in this prototype is the **Enemy Behavior State Machine** (implemented in code as the same graph logic). The graph continuously measures the horizontal distance between the player and the enemy, then routes behavior through three states: **Patrol**, **Alert**, and **Reset**. In Patrol, the enemy paces between two X-boundaries. When the player enters a detection threshold, the transition condition fires and the graph switches to Alert, where movement changes to a faster chase-style motion toward the player. If the player leaves a larger reset threshold, the graph transitions to Reset, where the enemy returns to its patrol origin and then re-enters Patrol. This graph improves gameplay because the enemy is no longer static; it reacts to player position and changes behavior based on state.

### Prompt 2: Updated break-down + state machine explanation
I updated my game break-down by separating “Enemy” into a full **state-machine system** rather than treating it as one simple object. The break-down now explicitly lists enemy states, state transitions, detection values, and reset behavior. This update makes the design more implementation-ready: each state now has a clear purpose, condition checks, and gameplay impact. I also clarified keyboard input and player movement as the core mechanic layer for MS1 (move, jump, reset), which directly matches the milestone rubric for playable mechanics and responsive controls.

The state machine is connected to other systems in the game. It depends on the **Player System** for position/distance checks, feeds into the **Challenge/Level System** by controlling threat pressure in the obstacle section, and integrates with the **Fail/Reset System** via collision outcomes and restart flow. In other words, the enemy state machine is not isolated; it is a behavior controller that links input-driven player movement, level pacing, and fail/retry feedback into one playable loop.

### Updated Break-down (attached for Devlog)
**Player System**
- Input: `A/D` or arrows to move, `Space` to jump, `E` to interact, `R` to reset.
- Physics: gravity, ground/platform collision, jump arc.
- State flags: alive/won.

**Level System**
- Level 1 start area + first gate transition.
- Level 2 platform sequence with spikes and enemy encounter.
- Lever/joystick interaction area to unlock gate.
- Final gate goal area.

**Enemy System (State Machine)**
- States: Patrol, Alert, Reset.
- Transition checks: player distance in/out of thresholds.
- Patrol bounds and return-to-origin logic.
- Contact outcome: player reset on collision.

**Game Loop / Feedback System**
- Per-frame update/draw loop.
- Status text for fail, success, and replay instructions.
- Win state + manual replay/reset flow.

## Milestone 2 Devlog

### Itch.io Description (Controls)
- `W` / `A` / `S` / `D` or Arrow Keys: Move
- `Space`: Attack
- `E`: Interact / use item
- `R`: Reset level

### Prompt 1 (Before Coding): Complicating Feature + Task Break-down
**Complicating feature summary:**  
For this milestone I implemented the complicating feature from my pitch: **the sigil-and-seal progression loop in a top-down dungeon run**. The player must read a clue, collect resources, obtain the correct sigil item, and return to the sealed door to unlock the final encounter. This adds decision-making and readable objective chaining beyond basic movement/combat.

**Task break-down**
1. Build the dungeon objective chain.
   - Add room-based layout for start, clue room, trap room, key room, sealed door room, and final room.
   - Add interactable clue object, potion resource, and sigil key item.
   - Add locked magical door that only opens with the correct sigil.
2. Integrate combat/risk loop with state-machine enemies.
   - Keep normal enemy Patrol → Alert → Reset behavior.
   - Add trap damage and health loss pressure.
   - Add miniboss attack pattern for the final room.
3. Connect to clear win/lose outcomes.
   - Lose when HP reaches zero.
   - Win when miniboss is defeated after unsealing the final path.
   - Keep controls and status feedback readable for Itch reviewers.

### Prompt 2 (After Coding): Reflection
Yes, the W5 task break-down process helped because it forced me to sequence work in dependency order: objective chain first, then pressure/combat systems, then win/lose resolution. That prevented partial implementations where rooms existed but progression gates did not, or combat existed without meaningful purpose.

If I repeated this, I would improve the break-down by adding tighter acceptance checks per room (for example: “clue communicates required sigil,” “sealed door rejects without key and opens with key,” and “boss defeat triggers victory”). That would reduce retesting overhead and catch progression bugs earlier.

### Prompt 3: Bridging Visual Scripting and Code
In this web prototype, the equivalent of the Visual Scripting graph is represented by the **state-machine logic inside `game.js`** (especially enemy transitions and sealed-door progression states). Architecture-wise, the “bridge” is event-style input (`keydown`/`isPressed`) triggering code-side transitions (`patrol`, `alert`, `reset`, clue/sigil acquisition, and seal unlock), which then drive update loops and rendering behavior.

If this were mapped directly to Unity, the bridge would be: a C# gameplay controller script raising custom events to a Visual Scripting graph for state transitions, while the graph pushes state flags back to C# update methods for movement and UI. In this project file set, that role is consolidated inside `game.js`, so the bridge is code-to-state-machine rather than C#↔Graph.

**Graph screenshot attachment note:** A Visual Scripting Graph screenshot is not available in this repository because this milestone build is implemented as HTML/CSS/JavaScript rather than a Unity graph asset.

## Milestone 3 Devlog
Milestone 3 Devlog goes here.

## Milestone 4 Devlog
Milestone 4 Devlog goes here.

## Final Devlog
Final Devlog goes here.

## Open-source assets
- None yet.
