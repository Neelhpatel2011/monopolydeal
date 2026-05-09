Original prompt: Implement Phase 10 only: drag preview for hand cards only in the Monopoly Deal frontend board screen.

Notes:
- Added a touch-safe hand drag controller with move threshold and short-hold protection.
- Drag preview is restricted to hand cards and returns to selected state on release without a target.
- Drag cancellation is wired for pointer cancel, blur, orientation change, scroll interruption, and turn ownership loss.
- Current implementation intentionally avoids target highlighting, drop resolution, and blocking overlays.

2026-05-04 mobile drag follow-up:
- Property-card drag failure on mobile was caused by narrow tableau hit areas plus set cards intercepting the drop. Generic tableau drops only worked on exposed panel whitespace, which is easy to miss on phone widths.
- Updated `useHandDragController` to treat a hit on a tableau set card as the generic tableau target when the generic tableau drop is valid.
- Also moved drag preview/target resolution work onto `requestAnimationFrame` so touch drags do not dispatch a full React update on every raw pointermove.
- Frontend validation passed with `npx tsc --noEmit` and `npm run build`.

2026-05-09 direct drag / center play target:
- Changed hand drag so pointer movement can enter dragging directly from idle via `START_HAND_DRAG`; a simple tap still selects/previews the card.
- Simplified hand-card drop targets to center play area plus bank when bankable. Tableau-specific and opponent-specific drag targets are no longer advertised for hand plays; guided choices open from the center play area instead.
- Selected cards no longer block End Turn. Requesting End Turn clears the selection and opens/submits the normal end-turn flow.
- Added center play-zone targetable/preview/invalid states with source-of-truth CSS near the end of `board.css`.
- Validation passed: `tsc --noEmit`, `npm run build`, `npm run lint`, `git diff --check`.
- Browser smoke passed on a live backend/frontend session: tap selects and pulses center while End Turn remains enabled; End Turn clears selection; direct drag from idle previews center and drops successfully.
