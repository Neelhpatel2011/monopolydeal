# Frontend Docs

## Current Scope
The current frontend focus is the Monopoly Deal board screen.

## Read In This Order
1. `AGENTS.md`
2. `spec.md`
3. `plans.md`
4. `implement.md`

## What Each File Covers

### `spec.md`
Product and UX requirements for the board screen.

### `plans.md`
Target file structure, ownership boundaries, build order, and rollout plan.

### `implement.md`
Execution rules for board work, including the interaction model and implementation order.

## Current Direction Summary
The board should be a mobile-first, premium-feeling screen driven by backend `PlayerView` data.

Core principles:
- local player is the visual focus
- opponents stay compact by default
- the center area stays stable
- drag and targeting states must be explicit
- blocking flows take priority over normal play
- end-turn must be intentionally safe
