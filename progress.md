Original prompt: use the [$develop-web-game](C:\\Users\\Neel Patel\\.codex\\skills\\develop-web-game\\SKILL.md)  and the [$frontend-skill](C:\\Users\\Neel Patel\\.codex\\skills\\frontend-skill\\SKILL.md) to make sure my game design is sound and updated. Also I want my UI to look like these images. Refactor the whole FRONT END CODEBASSE (FRONTEND ONLY) to accomplish this. Do not touch the BACKEND. Keep the design theme as this: premium black-and-gold tabletop aesthetic with the detailed design.md constraints and supplied screenshots.

Notes:
- Frontend stack is Next.js 16 + React 19 under frontend/.
- Existing game page already has a custom board, but the visual system is inconsistent and several strings contain mojibake.
- Primary refactor targets: lobby, game board hierarchy, opponent HUDs, center stage, bank/properties zones, hand tray, and modal styling.
- Backend must remain untouched.

Visual thesis:
- A matte-black digital card table with thin brushed-gold trim, restrained spotlighting, and premium dark cards where Monopoly colors appear as controlled accents rather than full-surface noise.

Content plan:
- Lobby: present hosting/joining as a cinematic pre-table ritual instead of a utilitarian form stack.
- Board: keep one dominant play surface with three clear lanes: bank, action stage, properties.
- Hand: treat the hand as the player's control strip, with selected-card context and deliberate fan motion.
- Modals: use framed tactical overlays that feel like tabletop decision moments, not generic dialogs.

Interaction thesis:
- Opponent panels get subtle lift and gold-edge emphasis on hover/target.
- Selected/hovered hand cards rise with a restrained arc instead of playful bounce.
- Overlays and spotlight panels fade in with soft scale and vignette emphasis.

Desktop pass notes:
- Mobile is now explicitly out of scope; optimize for large-screen board composition first.
- Current desktop board still reads too empty and boxy in low-state games.
- Priority gaps: side zones need richer empty-state art, the center stage needs a stronger pedestal, the top opponent rail needs to feel like a proper HUD band, and the hand tray needs more physical presence.

Reference-layout refactor:
- Rebuilt the live board around dedicated view components: `PlayerHud`, `InspectPanel`, `BankPocket`, `CardStack`, `SelectedCardStage`, `PropertyOverview`, and `HandFan`.
- Main board composition now follows the reference more closely: top HUD rail, left inspect panel, center play stage with deck/discard flanks, right property overview, and bottom hand fan.
- Interaction/data flow stayed in the frontend only. Drag-to-bank, drag-to-property, target selection, and action trays were preserved.

TODO:
- Define cleaner black/gold design tokens and reduce mixed legacy styling.
- Refactor the game screen markup for stronger tabletop symmetry and clearer zones.
- Update modals and lobby surfaces to match the same premium system.
- Run frontend validation and document any remaining gaps.

Validation:
- `npm run typecheck` passes in `frontend/`.
- `npm run build` passes in `frontend/`.
- Live desktop captures were taken against `http://localhost:3000/game/efc95b91-869b-4a7f-9254-1490f7f689b5?player_id=lux_host`.
- Local Playwright runtime check against the live game showed no console or page errors after the desktop refactor.
- Additional five-player validation capture was taken against `http://localhost:3000/game/113e8c7b-b861-4aef-826f-c62d6af2efbe?player_id=hud_a` to confirm the four-card top HUD row layout.
