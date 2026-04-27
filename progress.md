Original prompt: Implement Phase 10 only: drag preview for hand cards only in the Monopoly Deal frontend board screen.

Notes:
- Added a touch-safe hand drag controller with move threshold and short-hold protection.
- Drag preview is restricted to hand cards and returns to selected state on release without a target.
- Drag cancellation is wired for pointer cancel, blur, orientation change, scroll interruption, and turn ownership loss.
- Current implementation intentionally avoids target highlighting, drop resolution, and blocking overlays.
