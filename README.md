# GDIM33 Vertical Slice

## Milestone 1 Playable Build
This repository now includes a playable Milestone 1 web prototype with the required core scope:
- Player can move left/right and jump.
- Test levels have platforming obstacles (gaps + spikes).
- Player can reach a first gate, then complete a second level.
- Enemy uses a behavior state machine with **Patrol → Alert → Reset**.
- Includes interactive **joystick/lever pulls** to unlock progression gates.
- Player and enemy use more polished, distinct visual materials/styles.
- Player and enemy models now include layered parts and richer animation states for idle, run, jump/fall, dash, patrol, alert, reset, and defeated reads.
- Moved the Visual Scripting bridge explanation outside the gameplay canvas so the game screen only shows tutorial prompts.
- Added audio effects, particle VFX, ambient VFX, and decorative tilemap layers for stronger polish.
- Added extra mechanics for richer play: moving platforms, bounce pads, crumble platforms, and collectible relic objectives.
- Stage 1 difficulty is tuned easier (lighter enemy pressure and safer hazard spacing) to improve onboarding.

## Run Locally
Because this is plain HTML/CSS/JS, you can run it with a static server:

```bash
python3 -m http.server 8000
```

Then open: `http://localhost:8000`

## Controls
- `A` / `D` or `Left` / `Right Arrow`: Move
- `Space`: Jump
- `Shift`: Ground dash
- `E`: Interact (pull lever/joystick)
- `R`: Reset/restart current level

Goal: collect relics in each stage, then pull that stage’s joystick to unlock its gate and progress.

## State Machine (MS1)
Enemy behavior uses three states:
- **Patrol**: enemy moves back and forth in a fixed zone.
- **Alert**: enemy speeds up and chases player direction when player is close.
- **Reset**: enemy returns to patrol origin when player leaves range.

Transitions:
- Patrol → Alert: player enters detection range.
- Alert → Reset: player leaves reset range.
- Reset → Patrol: enemy reaches patrol start area.

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

## Itch.io Description
**Relic Runner: Vertical Slice** is a short 2D platformer prototype about collecting relics, reading enemy states, and unlocking joystick-controlled gates. The goal is to collect every relic in the current stage, return to the joystick lever, pull it, and reach the gate without falling into spikes or being caught by patrol enemies.

**Controls:**
- `A` / `D` or `Left` / `Right Arrow`: Move
- `Space`: Jump
- `Shift`: Ground dash
- `E`: Interact with joystick levers
- `R`: Reset or restart the current level

## Milestone 2 Devlog

### ANSWER THIS BEFORE CODING: Complicating gameplay summary and task break-down
For this milestone, I built on the existing relic-gated joystick mechanic and polished it into a clearer **relic-gated unlock loop with graph-driven feedback**. The complicating gameplay factor is that the player cannot simply run to the exit: they must collect every relic, survive dynamic platforming obstacles, return to the joystick lever, and trigger the gate unlock while enemy state-machine pressure continues to matter.

1. **Make the relic-gated joystick loop easier to read and preserve the existing gameplay.**
   - Keep the Milestone 1 movement, jumping, reset flow, and enemy Patrol → Alert → Reset state machine working.
   - Keep each level's relic requirement connected to the joystick lever so the gate only opens after all relics are collected.
   - Add clearer status feedback when the player collects relics, lacks relics, or unlocks the gate.
   - Verify that hazards, enemy collisions, stomp defeat, level transitions, and final win state still behave correctly.

2. **Increase character model complexity without changing collision balance.**
   - Replace simple rectangular player art with layered helmet, visor, torso armor, scarf, arms, legs, boots, backpack, shadows, and dash trail details.
   - Replace simple blob enemy art with animated legs, feet, antennae/horns, armor ring, eyes, jaw, teeth, and state-colored materials.
   - Keep the collision boxes the same so improved visuals do not break existing platforming.
   - Use enemy state color and animation speed to communicate Patrol, Alert, Reset, and defeated conditions.

3. **Integrate the chosen visual-scripting-style system and additional polish outside the core game UI.**
   - Keep graph labels and explanation outside the gameplay canvas so the player only sees tutorial prompts while playing.
   - Trigger code-side feedback from relic collection, dash, bounce pads, enemy alerts, hazards, and joystick unlock events.
   - Add audio effects, particle VFX, ambient VFX, and tilemap-like decorative layers without changing collision balance.
   - Document the intended Unity bridge as custom events moving between gameplay scripts and a Visual Scripting Graph, and include the graph screenshot asset for submission.

### ANSWER THIS AFTER CODING: Reflection
The W5 task steps break-down helped because it forced me to separate the feature into testable chunks instead of treating “polish” as one vague task. The biggest benefit was preserving the already-working Milestone 1 requirements first, then layering visual and feedback complexity on top of the same collision boxes. If I did it again, I would improve the break-down by adding more explicit acceptance checks, such as “gate stays locked at 1/2 relics,” “enemy still changes to Alert near the player,” and “dash does not recharge in air.” That would make each task easier to verify after implementation.

### Visual scripting and code bridge
The playable web build bridges code and a graph-style system through code-side gameplay events plus documentation outside the gameplay canvas. The code-side gameplay methods update relic collection, dash, bounce, hazard, enemy alert, and joystick unlock state; those events now trigger audio cues and particle VFX in `game.js`, while the Visual Scripting Graph itself is documented outside the game screen in the devlog/HTML page and in `docs/visual-scripting-graph.svg`. This serves the same architectural purpose as calling a Unity Visual Scripting custom event from C# after gameplay logic succeeds: gameplay code owns rules and collision, while the graph owns readable feedback/FX routing.

For the Unity version, the equivalent C# scripts would be:
- `PlayerController.cs`: owns movement, jump buffering, dash state, and calls the graph event when dash feedback should play.
- `RelicGateGraphBridge.cs`: listens for relic collection and joystick interactions, then raises a `GateUnlock` custom event into the Visual Scripting Graph.
- `GateController.cs`: receives the unlock result and changes the gate from locked to open.

The relevant Graph screenshot is included at [`docs/visual-scripting-graph.svg`](docs/visual-scripting-graph.svg).

### Unity system integration note
The chosen Unity system for the intended Unity build is **Unity Visual Scripting**. In this repository's HTML5 prototype, that system is represented by the external graph documentation plus gameplay events that route to audio/VFX feedback, so the architecture can be demonstrated without adding extra non-tutorial text to the game screen. The implemented flow mirrors a Visual Scripting Graph receiving custom gameplay events from code and routing feedback to UI/FX.


## Milestone 3 Devlog
Milestone 3 Devlog goes here.

## Milestone 4 Devlog
Milestone 4 Devlog goes here.

## Final Devlog
Final Devlog goes here.

## Open-source assets
- None yet.
