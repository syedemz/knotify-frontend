# CI/CD — knotify-frontend

## Deployment targets (environments)
TBD

## Secret management
TBD

## Build pipeline
TBD

## Test pipeline

### Workflow file

`.github/workflows/ci.yml`

Triggers on every `pull_request` event targeting `development` or `main`.

### Commands the CI job runs (in order)

1. `npm ci` — clean install from `package-lock.json`
2. `npx tsc --noEmit` — TypeScript type-check; fails on any type error
3. `npx eslint src __tests__` — lint all source and test files; fails on any ESLint error
4. `npx jest --coverage` — run the full test suite with coverage collection, including the labels-parity test at `__tests__/labels/labels.test.ts`

### Coverage thresholds (enforced by `jest.config.js` and surfaced by the CI job)

| Metric     | Threshold |
|------------|-----------|
| Lines      | 80%       |
| Branches   | 75%       |
| Functions  | 80%       |
| Statements | 80%       |

When `npx jest --coverage` runs, Jest reads these thresholds from `jest.config.js` and exits non-zero if any threshold is not met — the coverage table and failure message appear in the CI check output automatically. No extra reporter is needed.

## Deploy pipeline
TBD

## Rollback strategy
TBD

## Notifications / alerts
TBD
