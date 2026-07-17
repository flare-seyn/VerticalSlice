# Relic Runner: Design-Led Vertical Slice Portfolio

Relic Runner is a short 2D platforming vertical slice about collecting relics, reading enemy patrol states, activating joystick-controlled gates, and clearing a six-level run. This repository is being developed into a portfolio case study for Game Designer, Systems Designer, Content Designer, and Associate Game Designer internship applications.

> **Project foundation note:** The prompt references Unity, but the current workspace contains an HTML5/Canvas prototype rather than a standard Unity project. The design work preserves this existing playable foundation instead of replacing it with a new game.

## My role
Game Designer / Systems Designer focused on:

- Auditing an existing playable game.
- Identifying player experience problems.
- Proposing scoped improvements.
- Documenting systems, balance values, level flow, and playtest plans.
- Using telemetry and playtest evidence to guide future iteration.
- Collaborating with implementation support without presenting the project as a solo engine-programming showcase.

## Design goals
- Preserve the existing relic-gated platforming loop.
- Make design intent and balance rationale visible.
- Keep future implementation changes small and modular.
- Add measurable telemetry before claiming balance improvements.
- Improve onboarding, feedback, progression clarity, and level pacing.
- Demonstrate iteration process for game-design roles.

## Key features in the current build
- Six sequential platforming levels.
- Relic collection objectives.
- Joystick lever interactions.
- Locked/unlocked crystal gates.
- Player movement, jumping, coyote time, jump buffering, and ground dash.
- Dash-refresh orbs, bounce pads, moving platforms, and crumble platforms.
- Spikes, laser bars, and saw blade hazards.
- Enemy state machine with Patrol, Alert, Reset, stomp defeat, and respawn behavior.
- Three-heart health, invulnerability feedback, particles, sound effects, procedural music, and final win state.

## Recommended next update
The strongest first portfolio update is a **telemetry-led balance pass**:

- Track deaths, completion time, damage source, dash usage, relic collection, enemy stomps, and level completion.
- Add an end-of-run summary.
- Centralize and document tuning values.
- Use real playtests before revising difficulty claims.

This update best supports a Game Designer / Systems Designer portfolio because it demonstrates analysis, balance thinking, playtest preparation, and measurable iteration.

## Controls
- `A` / `D` or `Left` / `Right Arrow`: Move
- `Space`: Jump
- `Shift`: Ground dash
- `E`: Interact with joystick levers
- `R`: Reset the current level or restart after winning

## Screenshots and video
Screenshots and video captures should be added after the next playable implementation pass.

- Screenshot placeholder: `docs/screenshots/gameplay-overview.png`
- Screenshot placeholder: `docs/screenshots/telemetry-summary.png`
- Video placeholder: gameplay walkthrough link pending

## How to run the project
1. Clone or download this repository.
2. Open `index.html` in a modern web browser.
3. Click or press a movement/control key once to enable browser audio.
4. Play through all six levels by collecting relics, pulling the joystick, and entering the gate.

For a local server, you can also run:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Design documentation
- [Design Audit](DESIGN_AUDIT.md)
- [Feature Brief](FEATURE_BRIEF.md)
- [Systems Design](SYSTEMS_DESIGN.md)
- [Balance Data](BALANCE_DATA.csv)
- [Level Design](LEVEL_DESIGN.md)
- [Playtest Plan](PLAYTEST_PLAN.md)
- [Changelog](CHANGELOG.md)
- [Portfolio Case Study](PORTFOLIO_CASE_STUDY.md)

## AI-assisted development disclosure
AI-assisted development was used for implementation planning, debugging support, documentation drafting, and portfolio-structure support. Design ownership, final review, playtest decisions, and future tuning choices should remain with the project creator. No playtest results or improvement percentages are fabricated in this repository.
