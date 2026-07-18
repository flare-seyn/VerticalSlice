# Feature Brief — Recommended Update: Telemetry-Led Balance Pass

## Feature overview
Add a designer-facing telemetry and balance layer to the existing relic-gated platformer. The update should track run performance, expose key tuning values, improve completion feedback, and document how difficulty is intended to scale before any larger content changes are made.

## Design goals
- Demonstrate game design, systems design, and planning skill rather than a full rebuild.
- Preserve the current movement, relic, joystick, gate, enemy, and level architecture.
- Make balance decisions visible and editable.
- Prepare the game for real playtests without fabricating results.
- Support later additions such as enemy variants, upgrades, or redesigned levels.

## Target player experience
Players should understand the goal of each room, recover quickly from failure, and finish a run with a clear summary of what happened. Reviewers should be able to see that the project was analyzed, tuned, and prepared for iteration using measurable design criteria.

## Rules and interactions
- Start a telemetry run when Level 1 loads.
- Track deaths, damage events, damage source, completion time, dashes used, enemies stomped, relics collected, levels completed, and final win.
- Show a completion summary after the final gate.
- Keep all major tuning values documented in `BALANCE_DATA.csv`.
- Do not use telemetry as a scoring system until real playtests establish fair targets.

## Edge cases
- Manual reset should count separately from hazard deaths if implemented.
- Restarting after win should clear the previous run and start a new telemetry session.
- Level transitions should not double-count completion.
- Stomping a respawned enemy should count each successful stomp, but enemy defeat should not be required for relic-only gates unless that level explicitly says so.
- Browser refresh clears telemetry unless persistence is intentionally added later.

## UI and feedback requirements
- Preserve the existing status text and canvas HUD style.
- Add end-of-run summary text or panel in the same visual language.
- Avoid cluttering the game canvas during active play.
- Use concise labels: time, deaths, damage, dashes, stomps, relics, levels cleared.
- Mark playtest targets as pending until real sessions are run.

## Acceptance criteria
- A player can complete the existing six-level loop.
- Completion produces a readable run summary.
- The design documents explain what telemetry is collected and why.
- Balance values are listed with initial and revised values.
- No required mechanic from the original slice is removed.
- The README positions the work as design-led improvement of an existing game.

## Unity verification guidance
If this project is later migrated back into Unity, equivalent telemetry can be implemented as a `RunTelemetry` MonoBehaviour or ScriptableObject-backed service. Verify in Play Mode by clearing a run, taking damage, dashing, collecting relics, clearing a level, and confirming that the displayed counters update.
