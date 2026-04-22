# GDIM33 Vertical Slice

## Milestone 1 Playable Build
This repository now includes a playable Milestone 1 web prototype with the required core scope:
- Player can move left/right and jump.
- Test level has platforming obstacles (gap + spikes).
- Player can reach an exit area.
- Enemy uses a behavior state machine with **Patrol → Alert → Reset**.

## Run Locally
Because this is plain HTML/CSS/JS, you can run it with a static server:

```bash
python3 -m http.server 8000
```

Then open: `http://localhost:8000`

## Controls
- `A` / `D` or `Left` / `Right Arrow`: Move
- `Space`: Jump

Goal: reach the green exit while avoiding spikes and the enemy.

## State Machine (MS1)
Enemy behavior uses three states:
- **Patrol**: enemy moves back and forth in a fixed zone.
- **Alert**: enemy speeds up and chases player direction when player is close.
- **Reset**: enemy returns to patrol origin when player leaves range.

Transitions:
- Patrol → Alert: player enters detection range.
- Alert → Reset: player leaves reset range.
- Reset → Patrol: enemy reaches patrol start area.

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
