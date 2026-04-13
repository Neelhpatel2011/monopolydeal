# AGENTS.md

## Project overview
This repository contains a Monopoly Deal multiplayer game.
- `backend/` contains the game engine, API, and tests.
- `frontend/` contains the web client.
- Current priority is frontend UX and interaction design.
- Backend contracts should be preserved unless a task explicitly requires backend changes.

## Working style
- Make focused, incremental changes.
- Prefer improving existing code over introducing broad rewrites.
- Keep patches small and easy to review.
- When multiple solutions are possible, choose the simpler and more maintainable one.
- Do not make unrelated cleanup changes unless explicitly requested.

## Architecture expectations
- Preserve separation between backend game logic and frontend presentation.
- Frontend should consume backend state rather than re-implementing game rules.
- Keep shared types and API contracts consistent.
- Avoid duplicating business logic across files.

## Quality bar
Before considering work complete:
- run relevant tests
- run lint
- run typecheck
- ensure the app still builds

If a task changes only frontend code, prioritize frontend validation commands.
If a task changes only backend code, prioritize backend validation commands.

## Safety and scope
- Do not delete large folders or refactor unrelated modules without explicit instruction.
- Do not change environment configuration, deployment setup, or secrets handling unless the task requires it.
- Ask for clarification only when a missing detail would materially block the task. Otherwise make the best grounded assumption and state it.

## Backend rules
- Treat the backend game engine as the source of truth.
- Do not break API response shapes used by the frontend.
- Keep tests deterministic when touching game logic.

## Frontend rules
- Mobile-first design is the default.
- Avoid cluttered layouts and decorative textures.
- Favor clear visual hierarchy and touch-safe controls.
- Opponent information should default to summary view, with details revealed on tap or expansion.
- Hand interactions must be safe on small screens.

## Commands
### Backend
- Install: `cd backend && uv sync`
- Test: `cd backend && pytest`
- Lint/typecheck: use the project-standard Python tooling already configured in `pyproject.toml`

### Frontend
- Install: `cd frontend && npm install`
- Dev: `cd frontend && npm run dev`
- Build: `cd frontend && npm run build`
- Lint: `cd frontend && npm run lint`
- Typecheck: `cd frontend && npx tsc --noEmit`

## Documentation
- Update documentation when behavior, architecture, or UX patterns materially change.
- Record major frontend decisions in `frontend/plans.md` or related docs.