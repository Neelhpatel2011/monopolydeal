# CI/CD

This repo uses GitHub Actions for continuous integration and optional Vercel deployment.

## What Runs

- Frontend: `npm ci`, `npm run lint`, `npm run typecheck`, `npm run build`
- Backend: `uv sync --locked`, `uv run pytest`
- Vercel: deploys only after frontend and backend jobs pass, and only when Vercel secrets are configured

## Branch Behavior

- Pull requests into `main` run CI only.
- Pushes to any branch run CI.
- Pushes to non-`main` branches create Vercel preview deployments when Vercel secrets exist.
- Pushes to `main` create a Vercel production deployment when Vercel secrets exist.

The workflow does not merge branches. GitHub pull requests still control when code reaches `main`.

## Required GitHub Secrets For Vercel

Add these in GitHub under `Settings > Secrets and variables > Actions`:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

The Vercel project should use `frontend/` as its project/root directory. You can get
`VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` by running `vercel link` from `frontend/`
and reading the generated `.vercel/project.json`.

If those secrets are missing, the deployment job exits successfully after logging a notice.

## Recommended Repository Protection

After this workflow is pushed, enable branch protection on `main` and require these checks before merge:

- `Frontend`
- `Backend`

This makes `main` production-safe: code must pass CI before it can be merged, and Vercel production deploys only from `main`.
