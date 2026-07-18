# Systems Design — Relic Runner Portfolio Update

## Progression structure
The current structure is a six-level linear run. Each level teaches or combines platforming, relic routing, enemy pressure, and gate unlocking.

1. **Entry Hall:** teaches movement, first relic collection, lever, gate, simple hazards.
2. **Early traversal rooms:** introduce dash refresh, moving hazards, and enemy pressure.
3. **Midgame rooms:** combine route planning with bounce pads, moving platforms, and crumble timing.
4. **Late rooms:** increase density and ask the player to chain mechanics.
5. **Final gate:** validates the full loop and sets the win state.

## Rewards and costs
- **Relics:** required objective pickups that unlock gate interaction.
- **Dash orbs:** route rewards that restore dash access and support aggressive traversal.
- **Enemy stomps:** temporary safety reward and skill expression; enemies respawn so the route stays pressured.
- **Hearts:** mistake allowance; damage costs time and restarts the player at level start.
- **Completion summary:** proposed reward/feedback layer that converts play into design data.

## Difficulty curve
Difficulty should increase through layered complexity rather than raw punishment.

| Phase | Main learning | Pressure source | Intended difficulty |
| --- | --- | --- | --- |
| 1 | Controls + relic gate | Simple gap/spike/enemy | Low |
| 2 | Dash and route timing | Moving platform + dash orb | Low-medium |
| 3 | Enemy plus hazards | Patrol pressure + collectibles | Medium |
| 4 | Timing chains | Crumble/bounce/moving hazards | Medium-high |
| 5 | Dense route planning | Multiple hazards and returns | High |
| 6 | Final synthesis | Combined enemy/hazard/gate route | High but fair |

## Enemy and player relationships
- Patrol enemies create timing windows.
- Alert enemies create local pressure when the player gets close.
- Reset behavior prevents endless chase and supports readable enemy territories.
- Stomp interaction gives the player agency and a recovery bounce.
- Respawn prevents enemy removal from trivializing the route.

## Important formulas and tuning relationships
- **Enemy alert speed:** `enemy.speed * 1.35` in the current implementation.
- **Unlock requirement:** collected relics must equal total relics for standard levels.
- **Dash availability:** one ground-refreshed dash charge, restored by landing or dash orb.
- **Damage economy:** three hearts; damage returns the player to level start; zero hearts resets the level.
- **Completion time target:** pending real playtests.
- **Deaths/damage target:** pending real playtests.

## Balance rationale
The recommended first update focuses on telemetry because difficulty cannot be responsibly tuned without knowing where players fail, how often they dash, and how long levels take. Initial revisions should favor clarity and consistency: reduce unclear punishment, preserve challenge, and document why each value changes. Stronger enemy/content changes should follow after baseline metrics are collected.
