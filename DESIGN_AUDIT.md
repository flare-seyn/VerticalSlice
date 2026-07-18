# Design Audit — Relic Runner: Vertical Slice

## Scope note
The workspace does not contain a standard Unity `Assets/`, `Packages/`, or `ProjectSettings/` structure. The playable foundation is an HTML5/Canvas vertical-slice prototype composed primarily of `index.html`, `game.js`, `styles.css`, and documentation assets in `docs/`. This audit treats the existing prototype as the foundation to preserve and expand rather than replacing it with a new game.

## 1. Current core gameplay loop
1. Enter a compact platforming chamber.
2. Read terrain, patrol enemies, hazards, traversal objects, relic locations, joystick location, and gate location.
3. Collect all required relics while surviving spikes, moving hazards, enemies, gaps, crumble platforms, moving platforms, bounce pads, and dash routes.
4. Return to the joystick lever.
5. Pull the lever with `E` once the unlock requirement is satisfied.
6. Travel to the gate and enter the next chamber.
7. Repeat through six levels, then clear the final gate for the win state.

## 2. Existing player mechanics
- Left/right movement using `A/D` or arrow keys.
- Jump with `Space`.
- Coyote time and jump buffering for forgiving platforming.
- Ground dash with `Shift`, a short cooldown, and one ground-refreshed dash charge.
- Dash-refresh orb pickups that restore dash in route.
- Bounce pad launches.
- Stomping enemies from above to temporarily defeat them.
- Three-heart health system with temporary invulnerability after damage.
- Manual reset/restart with `R`.
- Joystick interaction with `E`.

## 3. Existing enemies, obstacles, levels, UI, progression, and game states

### Enemies
- Patrol enemy with explicit `Patrol`, `Alert`, and `Reset` states.
- Detection is horizontal-distance based.
- Alert state chases the player faster inside patrol bounds.
- Reset state returns to patrol origin after the player escapes.
- Enemies can be stomped, become temporarily defeated, and respawn after a delay.

### Obstacles and traversal content
- Static platforms.
- Spikes.
- Moving platforms.
- Bounce pads.
- Crumble platforms.
- Dash-refresh orbs.
- Laser bars.
- Saw blades.
- Gaps and vertical route changes.
- Decorative wall/trim/crystal tile props.

### Levels and progression
- Six sequential levels are defined as data objects in `game.js`.
- Each level has a start point, route geometry, objective relics, lever, gate, enemies, and optional traversal/hazard arrays.
- Most progression is relic-gated: all relics must be collected before the joystick opens the gate.
- The final level uses a finish gate and sets the player win state.

### UI and feedback
- Text status line gives current objective, collection progress, gate locked feedback, unlock feedback, damage feedback, and win prompt.
- Canvas HUD/visual feedback includes hearts, gate glow, particles, enemy state colors/animation, and collectible/hazard visuals.
- Page-level controls text explains basic controls.
- Audio cues exist for jump, dash, collect, unlock, bounce, hazard, and alert.

### Game states
- Active play.
- Per-level reset.
- Level transition.
- Temporary player invulnerability.
- Enemy state machine states.
- Enemy defeated/respawn state.
- Final win state with `R` restarting the run.

## 4. Important scripts and architecture
- `index.html`: hosts the page, controls summary, canvas, status text, build notes, and script/style references.
- `styles.css`: page layout, dark visual frame, canvas presentation, and devlog card styling.
- `game.js`: single-file game implementation including data, input, player state, level definitions, enemy state machine, collision, progression, rendering, audio, VFX, and loop timing.
- `docs/enemy-state-machine.svg`: visual support for the enemy state machine.
- `docs/visual-scripting-graph.svg` and shader graph SVG files: documentation/portfolio support assets.

The architecture is data-driven in spirit because level content is stored in arrays/objects, but it is not separated into Unity ScriptableObjects or modular runtime classes. Balance values are editable in JavaScript data, not in Unity Inspector fields.

## 5. Design strengths
- Clear repeatable objective loop: collect relics, unlock joystick, reach gate.
- Good mechanic layering for a small vertical slice: basic platforming grows into dash routing, moving platforms, bounce pads, crumble platforms, and respawning enemy pressure.
- Enemy state machine is understandable and portfolio-friendly because it has explicit states and readable transitions.
- Existing content already supports systems-design discussion: health, respawn, unlock requirements, patrol parameters, traversal rewards, and hazards.
- Visual/audio feedback is stronger than a greybox prototype: particles, gate pulse, sounds, heart HUD, and enemy state reads support player comprehension.
- Existing level-data structure makes small modular changes possible.

## 6. Player experience problems or missing features
- The project reads more like a completed class vertical slice than a game-design portfolio case study; design intent, balance rationale, and iteration evidence need to be surfaced.
- There is no formal telemetry summary for deaths, completion time, damage sources, ability use, relic collection, or level completion.
- Adjustable balance exists in code data, but there is no central balance table or designer-facing tuning guide.
- The player has only one main ability choice: dash timing. There is limited strategic tradeoff beyond execution.
- Enemy variety is mostly parameter variation rather than strongly differentiated behaviors.
- Onboarding relies heavily on status text and page controls; in-level teaching beats could be clearer.
- Win/completion exists, but there is limited post-run summary to help playtesting and iteration.
- Difficulty curve is present but undocumented; a reviewer cannot easily see why each level escalates.
- Because this is not a Unity project, Unity Inspector/ScriptableObject editability is not currently demonstrable in the workspace.

## 7. Technical limitations that affect the design
- The repository currently contains a Canvas web prototype, not a Unity project. Unity-specific deliverables such as scenes, prefabs, MonoBehaviours, ScriptableObjects, and Inspector-exposed fields cannot be implemented without migrating or adding a Unity project structure.
- `game.js` is monolithic. Small changes are possible, but large system additions risk making the file harder to maintain.
- Balance data is embedded directly in JavaScript objects, so designers must edit code-like data rather than dedicated tuning assets.
- Collision is simple axis-aligned rectangle/circle approximation, which limits precise level geometry and enemy shapes.
- No automated test harness currently verifies gameplay behaviors.
- No save system persists progression or telemetry across browser refreshes.
- No built-in screenshot/video capture pipeline exists.

## Three possible portfolio-quality updates

### Proposal A — Designer Telemetry + Balance Pass + End-of-Run Report
- **Player problem addressed:** The current loop is playable, but iteration evidence is invisible; players and reviewers cannot see performance data or how balance decisions were made.
- **Target player experience:** A complete arcade-style run with clear goals, readable feedback, and a summary that shows deaths, completion time, damage taken, dashes used, relics collected, enemies stomped, and levels cleared.
- **New or modified mechanic:** Add telemetry tracking, a completion report, centralized tuning constants/data table, and small difficulty adjustments based on the documented curve.
- **Expected effect on difficulty, pacing, and player decisions:** Difficulty does not spike from new mechanics; pacing improves because feedback and completion summaries clarify what happened. Players may choose safer routes when they see death/damage costs.
- **Required design work:** Define success metrics, categorize damage sources, set target completion/death ranges, create tuning table, document expected level difficulty curve.
- **Minimum implementation work:** Add telemetry object and event hooks, draw or display run summary, add difficulty/balance config constants, update README/docs.
- **Portfolio value:** Very strong for Systems Designer and Game Designer roles because it demonstrates metrics, balancing, playtest readiness, and production-style iteration without overemphasizing programming.

### Proposal B — Risk/Reward Dash Upgrade Route
- **Player problem addressed:** The player has dash execution, but few meaningful choices about when to take risk for long-term reward.
- **Target player experience:** Players choose between a safe required route and optional risky pickups that fund small upgrades or temporary boosts.
- **New or modified mechanic:** Add collectible shards awarded for relics/enemy stomps and a simple upgrade choice such as lower dash cooldown, +1 heart for a level, or bonus reward for no-hit play.
- **Expected effect on difficulty, pacing, and player decisions:** Adds mid-run planning. Optional routes increase difficulty for players seeking reward while preserving the base completion path.
- **Required design work:** Define rewards, costs, upgrade pacing, no-hit/optional-route incentives, and fail-safe rules so upgrades do not trivialize levels.
- **Minimum implementation work:** Track shards, add one upgrade station or between-level choice, expose upgrade costs, adjust one level to include optional shard route.
- **Portfolio value:** Strong for Systems Designer roles because it shows economy/reward tuning, but higher implementation risk than Proposal A.

### Proposal C — Enemy Variant Showcase + Redesigned Final Gauntlet
- **Player problem addressed:** Enemy encounters are readable but behavior variety is limited, so later levels can feel like obstacle remixing rather than enemy-driven decision-making.
- **Target player experience:** Players learn enemy archetypes, predict behaviors, and make different route/timing decisions in a final test chamber.
- **New or modified mechanic:** Add two enemy/obstacle variants such as a sentry with larger detection/short chase burst and a shielded enemy that cannot be stomped from the front, then redesign the final level around readable combinations.
- **Expected effect on difficulty, pacing, and player decisions:** Increases challenge and variety. Players must observe patterns before committing, but poor tuning could make the slice feel punishing.
- **Required design work:** Enemy role definitions, teaching sequence, readability rules, final challenge flow, damage/stomp interactions, and tuning targets.
- **Minimum implementation work:** Add behavior flags or type field to enemies, modify enemy collision/reactions, update final level data, add feedback/readability assets.
- **Portfolio value:** Strong for Game Designer/Content Designer roles because it demonstrates encounter design and teaching escalation, but it needs careful tuning and testing.

## Recommended proposal before major implementation
**Recommendation: Proposal A — Designer Telemetry + Balance Pass + End-of-Run Report.**

This is the strongest first portfolio update because it directly supports the career goal: game design and planning rather than gameplay programming. It turns the existing prototype into a case study about analyzing a shipped slice, defining success metrics, tuning difficulty, and preparing playtests. It also creates the foundation for later mechanics: once telemetry and balance documentation exist, Proposal B or C can be evaluated with real data instead of guesswork.

Proposal A should be implemented first, with Proposal C as the best second-phase content update if time allows. Proposal B is valuable but should wait until telemetry confirms whether players need more long-term reward motivation.

## Design opportunities for the final update
- Add a telemetry summary and playtest-friendly metrics before changing difficulty substantially.
- Centralize balance values into clearly named data/config sections.
- Redesign one level as a documented teaching/escalation sequence.
- Introduce two differentiated enemy/obstacle variants only after the base difficulty curve is measurable.
- Add in-level onboarding prompts and stronger gate/lever/relic feedback.
- Preserve the existing visual style, state-machine architecture, and relic-gated loop.
