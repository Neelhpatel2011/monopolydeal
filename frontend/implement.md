# Frontend Implementation Runbook

## Purpose
This document explains how to execute board-screen frontend work so it stays:
- mobile-first
- backend-aligned
- safe for touch
- reviewable
- consistent with `promptsequence.md`

## Canonical Inputs
Before starting board work, read:
1. root `AGENTS.md`
2. `frontend/AGENTS.md`
3. `frontend/spec.md`
4. `frontend/plans.md`
5. `promptsequence.md`

If any of those disagree, follow this precedence:
1. direct user prompt
2. `AGENTS.md` and `frontend/AGENTS.md`
3. `promptsequence.md`
4. `plans.md`
5. `spec.md`

## Non-Negotiables

### Backend ownership stays intact
The frontend reads `PlayerView` and submits backend action DTOs.
Do not move Monopoly Deal rule logic into UI components.

### Mobile-first is mandatory
The board should be designed for small touch screens first.

### Static layout comes before interactions
Do not start interaction-heavy work before the static refinement checkpoint has passed.

### Screenshot direction is binding unless superseded
The provided screenshots are the current best reference for:
- board composition
- tonal separation
- opponent detail presentation

Do not collapse the hand tray and tableau area into one undifferentiated surface.

## Prompt-by-Prompt Execution Rules

### Milestones 1-6 are static-layout-first
For Milestones 1 through 6:
- do not backfill future interaction work
- do not add selection behavior early
- do not add drag/drop early
- do not add target logic early
- do not add end-turn confirmation early

### Milestones 7+ are interaction work
For Milestone 7 and later:
- preserve the approved static layout
- layer behavior onto the established surfaces
- do not redesign the board shell unless necessary to fix a blocker

### Prompt 9 note
`promptsequence.md` currently duplicates Prompt 8 as Prompt 9.
Unless the user clarifies otherwise, do not assume extra work for Prompt 9.

## Required Event Rules

### Card selection
- `CARD_TAP(cardId)` selects the card
- tapping the same selected card cancels back to `idle`
- tapping a different card replaces the current draft

### Dragging
- drag should not start instantly on touch
- require threshold movement or short hold before drag begins
- invalid release returns to `selected`, not `idle`
- pointer cancel, blur, orientation change, or scroll interruption should cancel and never submit

### Targeting
- opponent tap means expand in browse mode and choose target in targeting mode
- target selection should fill draft requirements one field at a time
- if server state invalidates the draft, clear it safely

### End turn
- end turn only activates from `idle`
- if actions remain, show confirmation
- if discard is required, route to discard flow
- if selection, drag, or targeting is active, end turn should not open confirmation

### Blocking flows
These modes suspend normal play:
- `awaitingPrompt`
- `paying`
- `discarding`

Board priority must be:
1. `game_over`
2. `pending prompt`
3. `payment required`
4. `discard required`
5. `normal play`

## Interaction Model
Use an explicit reducer or state machine once interaction work begins.

Primary modes:
- `idle`
- `selected`
- `dragging`
- `targeting`
- `submittingAction`
- `submittingEndTurn`
- `awaitingPrompt`
- `paying`
- `discarding`

Supporting transient state:
- `expandedOpponentId`
- `invalidFeedback`
- `endTurnConfirmOpen`

Recommended draft shape:

```ts
type DraftActionIntent = {
  cardId: string
  submitAs: ActionRequest["action_type"]
  chosen: Partial<ActionRequest>
  missing: Array<
    | "property_color"
    | "rent_color"
    | "target_player_id"
    | "steal_card_id"
    | "give_card_id"
    | "steal_color"
    | "discard_ids"
  >
}
```

## Prompt-Sequence Implementation Order

Minimal contract mirroring is allowed inside the milestone that first needs it, but it should not become a separate pre-shell milestone unless the user explicitly asks for that.

### Step 1: Build the board shell first
Implement only:
- board shell
- top header
- top opponent region shell
- center board region shell
- local player region shell

Do not implement advanced interactions here.

### Step 2: Build read-only opponent summaries
Implement only:
- compact opponent summary cards
- avatar and name
- card count
- bank amount
- compact property color summary
- active-player indication

No full opponent detail yet beyond a placeholder trigger.

### Step 3: Build the local committed-state area
Implement only:
- local played area
- grouped tableau
- bank display
- property stacking/compression behavior

The user must distinguish committed board state from in-hand state instantly.

### Step 4: Build the hand tray
Implement only:
- horizontal hand tray
- card sizing for hand cards
- overflow/scroll/peeking behavior
- strong separation from the played area above it

No drag/drop yet.
No selected-card logic yet.

### Step 5: Build opponent detail expansion
Implement only:
- expanded opponent detail view
- higher-detail property and bank information
- mobile-safe entry and exit
- quick-switch support if practical within the milestone

No targeting logic yet.

### Step 6: Run the static layout checkpoint
Before any interaction-heavy work:
- review board shell spacing
- review opponent summary clarity
- review local played area clarity
- review hand tray clarity
- review distinction between hand, played cards, and bank
- review browser-first space usage
- review mobile responsiveness

Only proceed when:
- hand versus tableau is clear
- bank reads as committed state
- opponent summaries are high-signal
- opponent detail works cleanly
- center stage has breathing room

### Step 7: Add selected-card behavior
Implement only:
- tap to select
- obvious selected styling
- deselect/cancel path

Do not add drag/drop or targeting yet.

### Step 8: Add drag preview and drag-start behavior
Implement only:
- drag-start state
- drag preview
- clear origin and active-card feedback

Do not implement target resolution yet.

### Step 9: Reserved for promptsequence duplicate
`promptsequence.md` currently duplicates drag-preview scope as Prompt 9.
Do not infer extra work here unless the user clarifies.

### Step 10: Add invalid target behavior
Implement only:
- invalid target feedback
- clear reset/cancel behavior
- preserved mobile clarity

### Step 11: Add end-turn safety
Implement only:
- safer placement
- disabled/de-emphasized state while card is selected or dragged
- confirm flow if actions remain

Do not let this interfere with hand interaction.

## File Ownership Rules

### `store/boardViewStore.ts`
Owns server-fed state only.

### `features/board/hooks/useBoardScreenController.ts`
Owns orchestration only.

### `features/hand/*`
Owns hand rendering and gesture normalization.

### `features/tableau/*`
Owns tableau rendering and local tableau target surfaces.
The tableau area should render on a lighter surface than the hand tray.

### `features/bank/*`
Owns bank rendering and bank presentation.

### `features/opponents/*`
Owns opponent summaries, detail expansion, and quick-switch behavior.
Opponent detail should default to a large centered modal sheet with dimmed backdrop.

### `features/drag-targeting/*`
Owns drag preview, target highlighting, target registry, and action resolution.

### `features/turn-controls/*`
Owns end-turn guard logic and confirmation.

### `features/game-log/*`
Owns action and payment tracker presentation.

## Concrete Component Contracts

### `BoardHeader`
Must render:
- menu button on the left
- centered round label
- end-turn control on the right
- nearby action-count text

### `OpponentSummaryCard`
Must render:
- avatar
- player name
- hand and bank summary
- compact property progress row
- overflow or utility icon

It should look like a compact white summary tile, not a miniature full tableau.

### `OpponentDetailSheet`
Must render:
- modal sheet container
- close affordance
- player identity block
- `Properties` section
- `Money` section
- `Quick Switch` area

It should follow the second mockup closely.

### `BoardCenterStage`
Must render:
- draw pile
- discard pile
- central drop zone with instructional text

Do not crowd this area with extra permanent controls.

### `LocalPlayerPanel`
Must render:
- avatar
- player identity text
- cards count
- bank summary
- optional expand affordance
- game log entry point

This should sit on the lighter tableau-associated surface.

### `ActionHintBar`
Must render:
- a short current-turn instruction or state message

This should visually bridge the lighter player summary area and the darker hand tray.

### `HandTray`
Must render:
- dark tray container
- horizontally browsable hand cards
- clear selected-card emphasis later

This darker tray is mandatory. It is not interchangeable with the tableau surface.

### `TableauPanel`
Must render:
- played properties
- played wilds
- buildings where relevant
- bank context where appropriate

This panel should stay lighter than `HandTray` and read as committed state.

## Edge Cases To Preserve
- if a selected card leaves the hand, clear the draft immediately
- if turn ownership changes away from the local player, cancel selection, drag, targeting, and end-turn confirm
- if the backend rejects an action but the card is still in hand, preserve selection and show feedback
- targeting must suppress opponent browsing
- discard mode can clear selected discard cards but cannot dismiss the requirement itself

## Validation
For most board tasks, run:
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

For layout-heavy changes, also verify:
- the hand tray is visibly darker than the tableau panel
- played-state and in-hand regions are distinguishable at a glance
- opponent detail reads as a modal sheet, not an inline accordion
- the center drop zone still has visual breathing room

For interaction-heavy changes, also verify:
- clear selected state
- clear drag-preview state
- clear invalid-target feedback
- safe end-turn behavior

## Reporting Expectations
When finishing a board task, summarize:
- what changed
- which files changed
- what assumptions were made
- what remains unfinished
- what the next bounded step should be
