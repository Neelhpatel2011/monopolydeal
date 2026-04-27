# Frontend Plan

## Canonical Order
`promptsequence.md` is the canonical implementation order for this frontend board work.

This file translates that prompting sequence into a stable milestone plan so future prompts and implementation stay aligned.

Note:
- `Prompt 9` in `promptsequence.md` currently duplicates `Prompt 8`
- unless the user clarifies otherwise, do not assume a separate milestone from `Prompt 9`

## Current Objective
Create the board-screen foundation for the Monopoly Deal frontend without breaking backend ownership or overloading the main screen.

## Visual System Update
The board visual direction now has an approved bold graphic variant for gameplay surfaces.

Design cues for current board work:
- off-white paper background with visible grid structure
- strong black framing and chunkier shadows
- oversized display typography for key turn and action moments
- white framed gameplay panels with limited accent colors
- darker, more dramatic hand dock
- card faces that still use the reusable system, but with bolder outlines and more graphic contrast

Keep this visual system focused on the gameplay screen unless the user explicitly requests matching updates for lobby or other routes.

## Post-Game UX
The game-over summary should be dismissible without hiding the final board state.

Post-game rules:
- keep all normal play actions disabled after game over
- allow browsing board details and opponent profiles after dismissing the summary
- keep a persistent game-over callout visible after dismissal
- mark the winner with gold emphasis and a crown on their summary card

## Recommended File Structure
Target this structure as board work proceeds:

```text
frontend/src/
  main.tsx
  components/
    ui/
      Button.tsx
      Badge.tsx
      Sheet.tsx
      IconButton.tsx
    layout/
      ScreenFrame.tsx
      BottomDock.tsx
    shared/
      GameCard.tsx
      CardBack.tsx
      PlayerPill.tsx
  features/
    board/
      screens/BoardScreen.tsx
      components/BoardShell.tsx
      components/BoardHeader.tsx
      components/BoardCenterStage.tsx
      components/LocalPlayerPanel.tsx
      components/ActionHintBar.tsx
      components/BoardOverlayHost.tsx
      hooks/useBoardScreenController.ts
      hooks/useBoardResponsiveLayout.ts
      model/interaction-types.ts
      model/interaction-machine.ts
      model/interaction-selectors.ts
      selectors.ts
    hand/
      components/HandTray.tsx
      components/HandCard.tsx
      hooks/useHandGestures.ts
    tableau/
      components/TableauPanel.tsx
      components/TableauSection.tsx
      components/PropertySetColumn.tsx
      components/BuildingStack.tsx
      components/WildColorPickerSheet.tsx
    bank/
      components/BankStrip.tsx
    opponents/
      components/OpponentRail.tsx
      components/OpponentSummaryCard.tsx
      components/OpponentDetailSheet.tsx
      components/OpponentQuickSwitch.tsx
      model/opponentExpansion.ts
    turn-controls/
      components/TurnControlsDock.tsx
      components/EndTurnConfirmSheet.tsx
      model/endTurnFlow.ts
      end-turn-policy.ts
    drag-targeting/
      components/DragPreview.tsx
      components/TargetHighlightLayer.tsx
      hooks/useDragController.ts
      model/interactionStore.ts
      drop-target-registry.ts
      resolver.ts
      types.ts
    game-log/
      components/GameLogPanel.tsx
      components/PaymentTrackerList.tsx
  lib/
    api/gameClient.ts
    adapters/playerView.ts
    card-capabilities.ts
  store/
    boardViewStore.ts
  styles/
    tokens.css
    board.css
  types/
    api.ts
    cards.ts
```

## Screenshot-To-Component Mapping

### `BoardHeader`
Maps to:
- menu button
- centered round label
- end-turn button
- action-count text

### `OpponentRail`
Maps to:
- top row of compact opponent cards

### `OpponentSummaryCard`
Maps to:
- each top-row opponent card

Must include:
- avatar
- name
- card count
- bank amount
- compact property color summary
- active-player indication

### `BoardCenterStage`
Maps to:
- draw pile
- central drop zone
- discard pile

### `LocalPlayerPanel`
Maps to:
- local player summary row above the lower play area

### `TableauPanel`
Maps to:
- lighter committed-state / played-state surface

### `ActionHintBar`
Maps to:
- dark instruction bar above the visible hand cards

### `HandTray`
Maps to:
- darker brown-black / charcoal-brown tray for cards still in hand

### `OpponentDetailSheet`
Maps to:
- large centered modal sheet in the second mockup

### `OpponentQuickSwitch`
Maps to:
- quick-switch strip inside opponent detail

## Cleanup Direction
As implementation starts, converge toward this cleanup:
- retire `frontend/src/pages`
- retire `frontend/src/features/interactions`
- keep interaction ownership in `features/board` and `features/drag-targeting`

## Ownership Boundaries

### `store/boardViewStore.ts`
Owns:
- current `PlayerView`
- connection status
- submission status
- latest server error
- current player identity

Should not own:
- gesture mechanics
- component-local expansion state

### `features/board/hooks/useBoardScreenController.ts`
Owns:
- composition-level wiring
- selectors
- action dispatching
- overlay opening rules
- reconciliation between server responses and local interaction state

### `features/hand/*`
Owns:
- hand rendering
- hand-card presentation
- pointer and touch gesture normalization

### `features/tableau/*`
Owns:
- grouped property rendering
- building rendering
- wild-color chooser presentation
- local tableau target surfaces

### `features/bank/*`
Owns:
- bank rendering
- bank presentation inside played state

### `features/opponents/*`
Owns:
- opponent summaries
- opponent detail expansion
- quick-switch behavior

### `features/turn-controls/*`
Owns:
- turn-control presentation
- end-turn guard rules
- confirmation flow

### `features/drag-targeting/*`
Owns:
- drag preview
- target highlight layer
- target registry
- target resolution helpers

### `features/game-log/*`
Owns:
- game-log entry point
- action and payment tracker presentation

## Prompt-Driven Milestone Order

### Milestone 1: Board shell
Source: `Prompt 1`

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

Deliverable:
- structural and composable board skeleton only

### Milestone 2: Compact opponent summaries
Source: `Prompt 2`

Scope:
- compact opponent summary cards
- avatar and name
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

### Milestone 3: Local played area
Source: `Prompt 3`

Scope:
- local player's played area
- grouped property tableau
- bank display
- clear visual distinction between tableau and bank
- property stacking and overlap behavior
- responsive played-card sizing

Constraints:
- visually distinct from the hand tray
- no drag/drop
- no selection state
- no backend changes

### Milestone 4: Hand tray
Source: `Prompt 4`

Scope:
- horizontal hand tray
- card sizing for hand cards
- overflow, scroll, or peeking behavior
- clear visual separation from the played area above it

Constraints:
- no drag/drop
- no selected-card logic
- no end-turn behavior changes
- no backend changes

### Milestone 5: Opponent detail expansion
Source: `Prompt 5`

Scope:
- tapping an opponent summary opens expanded detail view
- higher-detail bank and property information
- mobile-safe entry and exit

Constraints:
- default view must remain compact
- expansion should feel lightweight and browser-friendly
- no targeting logic yet
- no backend changes

### Milestone 6: Static layout refinement checkpoint
Source: `Prompt 6`

Scope:
- board shell spacing
- opponent summary clarity
- local played area clarity
- hand tray clarity
- distinction between hand, played cards, and bank
- browser-first space usage
- mobile responsiveness

Constraints:
- no drag/drop
- no targeting
- no end-turn confirmation

Gate:
- this checkpoint must pass before interaction-heavy work begins

### Milestone 7: Selected-card state
Source: `Prompt 7`

Scope:
- tap-to-select card
- obvious selected styling
- deselect and cancel path

Constraints:
- no drag/drop
- no targeting

### Milestone 8: Drag preview and drag-start behavior
Source: `Prompt 8`

Scope:
- drag-start state
- drag preview
- clear origin and active-card feedback

Constraints:
- do not implement target resolution yet

### Milestone 9: Reserved / promptsequence duplicate
Source: `Prompt 9`

`Prompt 9` currently repeats Milestone 8.
Do not invent extra work here unless the user clarifies a separate milestone.

### Milestone 10: Invalid target behavior
Source: `Prompt 10`

Scope:
- invalid target feedback
- clear reset and cancel behavior
- preserve mobile clarity

### Milestone 11: End-turn safety
Source: `Prompt 11`

Scope:
- safer placement
- disabled or de-emphasized state while card is selected or dragged
- confirmation flow if actions remain

Constraint:
- must not interfere with hand interaction

## Safe Parallel Review Pattern

### Milestone 1
After implementation, spawn `frontend_reviewer`.

### Milestone 2
After implementation, spawn `design_guardian` and `frontend_reviewer`.

### Milestone 3
After implementation, spawn `frontend_reviewer`.

### Milestone 4
After implementation, spawn `design_guardian` and `frontend_reviewer`.

### Milestone 5
After implementation, spawn `frontend_reviewer`.

### Milestone 6
After implementation, spawn `design_guardian` and `frontend_reviewer`.

## Product Risks To Watch
Keep these visible during implementation:

1. Blocking flows competing with normal play.
2. Opponent summaries being too weak.
3. Center-stage overload.
4. Local player zone crowding.
5. Hand tray and tableau panel becoming too visually similar.
6. Opponent detail drifting away from the centered modal-sheet pattern.
7. End-turn placement becoming unsafe.
8. Mature styling reducing card legibility.

## Definition Of Done For The Static Board Foundation
The static board foundation is ready for interaction work when:
- the board shell is stable
- opponent summaries are compact and high-signal
- local played state is readable
- hand tray is clearly distinct from played state
- opponent detail expansion works cleanly
- the layout has passed the static refinement checkpoint

## Definition Of Done For Interaction Work
The interaction layer is ready when:
- selected state is obvious
- drag preview is obvious
- invalid target behavior is obvious
- end-turn is safe and non-intrusive
- responsive behavior still holds

## Backend Integration Notes

The live board now treats the backend as the source of truth.

- `frontend/src/integration/backend/contracts.ts`
  Purpose: typed DTO boundary for REST and websocket payloads.
- `frontend/src/integration/backend/client.ts`
  Purpose: transport only.
- `frontend/src/integration/backend/catalog.ts`
  Purpose: backend card metadata + backend-card-id to approved UI-card mapping.
- `frontend/src/integration/backend/adapters.ts`
  Purpose: shape backend `PlayerView` into board-facing UI models only.
- `frontend/src/features/board/hooks/useBoardSession.ts`
  Purpose: board orchestration, bootstrap, fetch, websocket sync, and action submission.

Rules:
- backend owns Monopoly Deal logic, legality, prompts, payments, and state transitions
- frontend may shape backend data for rendering, but must not recreate rules
- surface-specific card sizes are only outer scale changes on canonical card faces
- `PlayerView` now carries additive backend-derived UI fields for:
  - per-hand-card action options
  - property-set summaries
  - wild reassignment options
- prefer consuming those additive fields over inferring action semantics or rent/set state in the frontend
