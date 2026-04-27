# monopolydeal
A minimalist and free way to play monopoly deal anywhere with internet. Coming soon with custom cards feature that you can code into the game!


### MVP Goal

✅ **2 players (then 4) can:**

* Create game, join game
* Play actions
* Get prompted for JSN / payments
* See state updates immediately
* Share short join codes for lobby entry
* Keep each browser locked to its own player seat with a guest session cookie

❌ **Not needed for MVP:**

* Achievements/stats
* Persistence beyond memory

---

## Phase 0 — Make the Engine Deterministic (Testable)

Before API tests, avoid randomness so tests don’t flake.

Do **one** of these:

* **Seeded deck:** allow `create_new_game(seed=123)` so deck order is reproducible
* **Fixed deck fixture:** in tests, inject a known deck order into `GameState.deck`

**Why this matters:** lets you write reliable tests like “P1 draws X”.

---

## Phase 1 — Engine-Level Unit Tests (Fastest Feedback) 

Write tests that import functions from:

* `backend/app/engine/rules.py`
* `backend/app/engine/effects/*`

Test with pure `GameState` objects (no HTTP, no WS).

### What to test first (small wins)

* `create_new_game()` produces valid state
* `start_action()` rejects illegal plays (wrong turn, missing card, etc.)
* Rent action produces `payment_required`
* Counterable action produces `response_required`
* JSN chain resolution works
* `process_payment()` removes cards correctly

### Why this matters

* Engine tests run in milliseconds
* If later API tests fail, you’ll know whether it’s engine vs service/API

---

## Phase 2 — Build the Glue Layer: `GameService`

Your API should be thin; `GameService` is where orchestration happens.

### `GameService` responsibilities

* Store active games: `games[game_id] -> GameState` (internal)
* Store locks: `locks[game_id] -> asyncio.Lock`
* Validate `pending_id` / `request_id` belongs to the correct player
* Call engine functions:

  * `start_action`
  * `respond_to_pending`
  * `process_payment`
* After any mutation, trigger WS broadcast via a manager

### Service-level tests (important)

Test `GameService` without HTTP:

* Create game → join game
* Submit action → service returns correct `ActionResponse`
* Pending respond → service transitions correctly
* Payment → service updates correctly
* Invalid pending/payment IDs → clean error response envelope

**Why this matters:** this is where you learn system design—state orchestration + correctness.

---

## Phase 3 — Internal State vs Client View State

Clean rule (even for MVP):

> API never returns `GameState` directly; it returns a `PlayerViewState`.

### Minimal MVP `PlayerViewState`

* **For viewer:** full hand
* **For others:** `hand_count` only
* **Public:** banks, properties, discard pile, whose turn, pending prompts (only if relevant)

Add one function:

* `get_view(game_state, viewer_player_id) -> PlayerViewState`

Write unit tests:

* Viewer sees own cards
* Viewer does NOT see other hands

---

## Phase 4 — Implement REST Routes (Thin Wrappers)

Create the FastAPI endpoints.

### MVP endpoints

* `POST /games` (create)
* `POST /games/{id}/join`
* `GET /games/{id}/state`
* `GET /games/{id}/view`
* `POST /games/{id}/actions`
* `POST /games/{id}/pending/{pending_id}/respond`
* `POST /games/{id}/payments`
* `WS /ws/games/{id}`

### Route function rule

Routes should do almost nothing:

* Parse request
* Call `GameService`
* Return response model

**No rule logic in routes.**

---

## Phase 5 — WebSocket Manager (MVP Version)

Store active sockets:

* `connections[game_id][player_id] = websocket`

When state changes:

* For each connected player: compute `PlayerViewState(player_id)` and send
* If a prompt is required: send `response_required` / `payment_required` only to target player(s)

### WS tests (MVP)

You don’t need to test UI details. Confirm:

* Connection established
* After action, target receives `payment_required`
* Others receive `state_update`

---

## Phase 6 — API Integration Tests (End-to-End)

Use `pytest` + FastAPI TestClient / `httpx`.

### Minimum “vertical slice” tests

* Create → join → get state
* Play a basic bank/property action resolves
* Rent → `payment_required` delivered (REST response OR WS message)
* Submit payment → state updates
* Invalid pending/payment ID → envelope error response
* Out-of-turn action rejected

**Why these matter:** they’re interview-friendly because they test the whole system (routes → service → engine).

