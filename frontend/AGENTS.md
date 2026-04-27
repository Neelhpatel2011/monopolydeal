
# AGENTS.md

## Frontend mission
Build a polished, mobile-first Monopoly Deal interface that feels clean, modern, and safe to use on iPhone-sized screens first, while still scaling well to tablet and desktop web.

## Product priorities
1. Mobile usability
2. Clear game-state readability
3. Safe touch interactions
4. Fast understanding of opponents
5. Visually mature, non-kid-ish aesthetic

## Core UX principles
- Default to compact summaries for opponents.
- Let the local player's board be the primary focus.
- Show the player's hand on mobile.
- Make selected, dragging, targeting, and invalid-target states visually obvious.
- Never place important actions where they are easy to fat-finger during drag interactions.
- Do not place large turn-ending controls near the hand or the central drop zone.
- End-turn flow should be intentionally safe and visually secondary to card play.
- During drag interactions, turn-ending actions should be disabled or visually de-emphasized.

## Visual direction
- Minimal, premium, and modern.
- Avoid toy-like styling, over-rounding, loud gradients, and noisy textures.
- Use strong spacing, restrained color, and clear grouping.
- Prefer subtle depth and shadow over decorative background art.
- Property colors should remain recognizable, but the overall UI should feel refined.

## Board layout goals
The main board should generally support:
- top area: compact opponent summaries
- center area: draw pile, discard pile, current action or drop target
- bottom area: player's hand, player's property tableau, bank
- optional drill-in: tap opponent to open a higher-level summary or expanded tableau

## Interaction rules
- Tap card: inspect or select
- Drag card: play or target
- Drag onto valid zone: highlight valid drop target
- Drag onto invalid zone: clearly show invalid state
- Selected card state must always have a clear escape path
- Important actions must not be hidden behind tiny hitboxes
- Touch targets should be generous and thumb-friendly

## State modeling
Keep these UI states explicit where relevant:
- idle
- selected card
- dragging card
- targeting opponent
- target preview
- invalid target
- end-turn confirm
- opponent summary expanded

## Engineering expectations
- Prefer feature-based organization.
- Keep presentational components separate from stateful interaction logic where practical.
- Reuse shared UI primitives when it improves consistency.
- Avoid giant monolithic board components.
- Keep component APIs simple and readable.

## Preferred frontend structure
Use or move toward feature areas such as:
- `features/board`
- `features/hand`
- `features/tableau`
- `features/bank`
- `features/opponents`
- `features/turn-controls`
- `features/drag-targeting`

## Validation
For frontend tasks, usually run:
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

If a task affects interaction-heavy UI, also sanity-check:
- narrow mobile width
- common iPhone-sized viewport
- wider desktop responsive layout

## What to avoid
- duplicate controls
- duplicate game-state labels
- giant permanent buttons competing with the hand
- always-expanded opponent tableaus
- visual clutter
- full-card rendering everywhere when summary blocks would communicate better