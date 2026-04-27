# Frontend Spec

## Current Scope
The current frontend scope is the Monopoly Deal board screen only.

This includes:
- board shell
- opponent summaries
- local played area
- hand tray
- opponent detail expansion
- later interaction work for selection, drag, invalid targets, and end-turn safety

Other frontend flows are out of scope unless explicitly requested later.

## Source Of Truth
The backend remains the source of truth for:
- game state
- legal actions
- turn progression
- pending prompts
- payment requests
- discard requirements
- win state

The board should read from `PlayerView` and write through backend DTOs such as `ActionRequest`.
The frontend must not re-implement Monopoly Deal rules beyond small contract adapters and transient UI state.

## Product Goal
Build a mobile-first board that is:
- clean
- modern
- mature
- touch-safe
- easy to scan in multiplayer

The strongest experience should be on iPhone-sized screens first. Tablet and desktop should expand the same model rather than invent a different one.

## Board Priorities
The board must optimize for:
1. mobile usability (390x844px, 393x852px, or 430x932px)
2. local player readability
3. clear separation of played state versus hand state
4. fast opponent understanding
5. safe interaction behavior

## Screenshot-Derived Direction
The provided screenshots are the current best visual reference and should guide the board layout closely.

Key takeaways:
- the overall board is bright, soft, and premium
- opponent summaries appear in a clean top row of rounded white cards
- the center area is open and calm, with draw pile on one side, discard on the other, and a broad central drop zone
- the local player area is split into distinct surfaces instead of one merged region
- opponent detail opens as a large centered white modal sheet with a dimmed backdrop

The board should feel like a purpose-built digital tabletop, not a generic dashboard.

## Region Hierarchy

### Top Region
Compact opponent summaries.

Requirements:
- default state stays summarized
- opponent cards are immediately scannable
- active/current player state is visible
- full detail is hidden behind expansion

### Center Region
A shared action table.

Requirements:
- draw pile
- discard pile
- large central drop zone or play zone
- optional current action or prompt messaging

The center should stay visually calm and not become a cluttered control cluster.

### Bottom Region
The local player area.

Within the local player area, the visual hierarchy should be:
1. hand tray
2. tableau / played-state area
3. bank detail within played-state context

These should not be rendered with the same weight or background treatment.

## Local Player Area Requirements
The local player area is the focal point of the board.

It must make these clear:
- whose turn it is
- what is already played
- what is banked
- what is still in hand
- what the current board state is

The local player area should be split into two stacked surfaces:
- a lighter tableau-associated surface for played properties, wilds, buildings, and bank context
- a darker hand tray below for cards still in hand

This split is a core product requirement now.

## Hand Requirements
The hand must remain visible on mobile.

It must support:
- tap to select
- tap again to cancel
- drag later in the implementation sequence
- clear selected state
- clear drag state
- obvious valid and invalid target feedback later in the implementation sequence

The hand tray should:
- use a deep brown-black or charcoal-brown tone
- be materially darker than the tableau area above it
- make card faces pop clearly
- support horizontal browsing on mobile
- remain visually stable even when hand size grows

The hand area must read instantly as "cards available to play now."

## Tableau Requirements
The tableau should group properties by set and emphasize completion progress.

It should:
- distinguish complete and incomplete sets quickly
- support wild cards
- support house and hotel modifiers
- compress or stack cards cleanly as sets grow
- avoid unnecessary full-card clutter when grouped rendering communicates better

The tableau surface should:
- be lighter than the hand tray
- read as committed board state
- visually connect to local player summary information
- feel closer to the main board surface than to the hand tray

## Bank Requirements
The bank should communicate value quickly without dominating the layout.

Bank belongs with the played-state area, not with the hand tray.
It should read as committed board information, not as in-hand options.

## Opponent Summary Requirements
Opponent summaries should default to compact, high-signal information.

Each summary should show:
- player identifier
- avatar
- hand count
- bank summary
- compact property progress summary
- current-player state

The user should not need to expand opponents just to answer basic threat questions.

## Opponent Detail Requirements
Opponent detail should follow the second screenshot closely.

Requirements:
- opens as a large centered modal sheet
- uses a dimmed backdrop
- shows opponent identity and summary at the top
- separates `Properties` and `Money` sections clearly
- includes a `Quick Switch` region for jumping between opponents
- keeps the board visible in the background for orientation

This should not be implemented as a tiny popover or permanent inline expansion.

## Turn Control Requirements
End-turn is a high-risk action and must be intentionally safe.

Requirements:
- no large end-turn control near the hand tray
- no large end-turn control inside the main drag/drop zone
- end-turn sits high on the screen, away from the hand area
- action count can appear nearby as secondary text
- later interaction milestones must disable or de-emphasize end-turn during risky states

## Interaction Model Requirements
The board interaction model should be explicit and reducer-driven when interaction work begins.

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

Required behavior:
- tapping the same selected card cancels selection
- invalid drag release returns to selected, not idle
- target browsing and opponent expansion cannot compete with each other
- blocking flows suspend normal play
- server view replacement can invalidate local drafts

## Blocking Flow Priority
When interaction work is implemented, the board must obey this UI priority stack:

1. `game_over`
2. `pending prompt`
3. `payment required`
4. `discard required`
5. `normal turn play`

Normal play affordances should be suppressed or clearly disabled while a blocking flow is active.

## Visual Direction
The board should feel:
- minimal
- premium
- restrained
- readable
- non-toy-like

Recommended tonal system:
- main board background: bright, soft neutral
- opponent cards: white or near-white elevated tiles
- tableau region: light neutral panel
- hand tray: deep brown-black or charcoal-brown panel
- modal surfaces: bright white sheets with strong separation from the dimmed background

Recommended shape and spacing cues:
- large rounded rectangles
- soft shadows
- clear panel boundaries
- generous spacing
- strong separation between stacked regions

Avoid:
- loud gradients
- noisy textures
- oversized CTAs
- decorative clutter
- always-expanded detail regions

The hand tray and tableau area must never collapse into the same tonal family.

## Product Risks
These risks should guide implementation decisions:

1. Blocking flows are mishandled because they lack UI priority.
2. Opponent summaries are too weak to support quick multiplayer reading.
3. The center region becomes overloaded.
4. The local player zone becomes crowded.
5. The hand tray and tableau become too visually similar.
6. Opponent detail drifts away from the centered modal-sheet pattern.
7. End-turn becomes unsafe.
8. A mature visual direction reduces card legibility.

## Static Layout Gate
Before interaction-heavy work begins, the static layout must be visually approved.

The static layout is ready only when:
- opponent summaries are high-signal
- center stage has breathing room
- tableau reads as played state
- bank reads as played state
- hand tray is clearly darker and distinct
- opponent detail works cleanly

## Acceptance Criteria
The board screen is successful when:

1. The local player can always see hand, tableau, bank, and turn state on mobile.
2. Opponents are readable in compact form without opening details.
3. The center area supports play without dominating the screen.
4. Hand state and played state are visually distinct at a glance.
5. Opponent detail feels seamless and secondary to the default board.
6. Interaction states are obvious once implemented.
7. End-turn is present but materially hard to trigger by accident once implemented.
8. The frontend stays aligned with backend contracts.
