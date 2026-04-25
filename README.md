# GDIM33 Vertical Slice

## Milestone 1 Playable Build
This repository now includes a playable Milestone 1 web prototype with the required core scope:
- Player can move left/right and jump.
- Test levels have platforming obstacles (gaps + spikes).
- Player can reach a first gate, then complete a second level.
- Enemy uses a behavior state machine with **Patrol → Alert → Reset**.
- Includes an interactive **lever/joystick pull** mechanic to unlock the final gate.

## Run Locally
Because this is plain HTML/CSS/JS, you can run it with a static server:

```bash
python3 -m http.server 8000
```

Then open: `http://localhost:8000`

## Controls
- `A` / `D` or `Left` / `Right Arrow`: Move
- `Space`: Jump
- `E`: Interact (pull lever/joystick)
- `R`: Reset/restart current level

Goal: clear Level 1, then in Level 2 pull the lever to unlock the gate and finish.

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

## Milestone 2 Devlog
Milestone 2 Devlog goes here.

## Milestone 3 Devlog
Milestone 3 Devlog goes here.

## Milestone 4 Devlog
Milestone 4 Devlog goes here.

## Final Devlog
Final Devlog goes here.

## Open-source assets
- None yet.
