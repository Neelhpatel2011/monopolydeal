
## Prompt 1:
Read AGENTS.md, frontend/AGENTS.md, frontend/spec.md, frontend/plans.md, and frontend/implement.md first.

Implement Milestone 1 only: Board shell.

Scope:
- board shell
- top header
- top opponent region shell
- center board region shell
- local player region shell

Constraints:
- mobile-first
- browser-first
- no drag/drop
- no selected-card logic
- no end-turn confirmation logic
- no backend changes

Keep the work structural and composable.

After implementation, spawn frontend_reviewer to review layout hierarchy and file structure.
Return a summary of changed files, decisions, and remaining gaps.

## Prompt 2:
Read AGENTS.md, frontend/AGENTS.md, frontend/spec.md, frontend/plans.md, and frontend/implement.md first.

Implement Milestone 2 only: compact opponent summaries.

Scope:
- compact opponent summary cards
- avatar/name
- card count
- bank amount
- compact property color summary
- active-player indication

Constraints:
- professional visual treatment
- no emoji-style property indicators
- no opponent full detail expansion yet beyond a placeholder trigger
- no drag/drop
- no backend changes

Use a professional compact summary system for property colors and counts.

After implementation, spawn design_guardian and frontend_reviewer.
Return:
1. changed files
2. design choices
3. top remaining issues

## Prompt 3:

Read AGENTS.md, frontend/AGENTS.md, frontend/spec.md, frontend/plans.md, and frontend/implement.md first.

Implement Milestone 3 only: local played area.

Scope:
- local player's played area
- grouped property tableau
- bank display
- clear visual distinction between tableau and bank
- property stacking/overlap behavior as sets grow
- responsive card sizing for played cards

Constraints:
- this area must be visually distinct from the hand tray
- no drag/drop
- no selection state
- no backend changes

Focus on clarity:
- what is already played
- what is banked
- what belongs to each set
- how stacked cards should compress cleanly

After implementation, spawn frontend_reviewer.
Return a summary of changed files and any layout tradeoffs.

## Prompt 4:

Read AGENTS.md, frontend/AGENTS.md, frontend/spec.md, frontend/plans.md, and frontend/implement.md first.

Implement Milestone 4 only: hand tray.

Scope:
- horizontal hand tray
- card sizing for hand cards
- overflow/scroll/peeking behavior if hand grows
- clear visual separation from the played area above it

Constraints:
- no drag/drop
- no selected-card logic yet
- no end-turn behavior changes
- no backend changes

The goal is to make the distinction between:
1. cards in hand
2. cards already played

extremely obvious on mobile.

After implementation, spawn design_guardian and frontend_reviewer.
Return:
1. changed files
2. whether the hand/play distinction is now clear
3. any remaining spacing issues

## Prompt 5:

Read AGENTS.md, frontend/AGENTS.md, frontend/spec.md, frontend/plans.md, and frontend/implement.md first.

Implement Milestone 5 only: opponent detail expansion.

Scope:
- tapping an opponent summary opens a seamless expanded detail view
- show higher-detail bank/property information
- keep entry/exit simple and mobile-safe

Constraints:
- default view must remain compact
- expansion should feel lightweight and browser-friendly
- no targeting logic yet
- no backend changes

After implementation, spawn frontend_reviewer.
Return a summary plus any recommendations for making opponent inspection faster and cleaner.

## Prompt 6:

Read AGENTS.md, frontend/AGENTS.md, frontend/spec.md, frontend/plans.md, and frontend/implement.md first.

We are doing the static layout refinement checkpoint before any interaction-heavy work.

Review and improve:
- board shell spacing
- opponent summary clarity
- local played area clarity
- hand tray clarity
- distinction between hand vs played cards vs bank
- browser-first space usage
- mobile responsiveness

Do not add drag/drop, targeting, or end-turn confirmation yet.

Use the attached screenshots/references and compare the current implementation against them.
Fix only the highest-impact layout and clarity issues.

After implementation, spawn design_guardian and frontend_reviewer.
Return blockers and whether the static layout is ready for interaction work.

## Prompt 7:

Implement Milestone 7 only: selected-card state.

Scope:
- tap-to-select card
- obvious selected styling
- deselect/cancel path

Do not implement drag/drop or targeting yet.

## Prompt 8:

Implement Milestone 8 only: drag preview and drag-start behavior.

Scope:
- drag-start state
- drag preview
- clear origin and active card feedback

Do not implement target resolution yet.

## Prompt 9:
Implement Milestone 8 only: drag preview and drag-start behavior.

Scope:
- drag-start state
- drag preview
- clear origin and active card feedback

Do not implement target resolution yet.

## Prompt 10:

Implement Milestone 10 only: invalid target behavior.

Scope:
- invalid target feedback
- clear reset/cancel behavior
- preserve mobile clarity

## Prompt 11:

Implement Milestone 11 only: end-turn safety.

Scope:
- safer placement
- disabled/de-emphasized while card is selected or dragged
- confirm flow if actions remain

Do not let this interfere with hand interaction.



