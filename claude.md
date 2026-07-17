# knotify-frontend

## Project metadata
- **Name:** knotify-frontend
- **Description:** <one-line description — user fills>
- **Scope / vision:** <user fills>
- **Desired output:** <user fills>
- **Intended audience:** <user fills>

## Technology stack
- **Frontend:** <user fills>
- **Backend:** <user fills>
- **Hosting:** <user fills>
- **Deployment:** <user fills>
- **IaC:** <user fills>

## Workspace rules
- `C:\Users\syede\Claude-Master\engineeringprinciples.md` — global engineering principles + non-negotiable rules (no parallelism, phase-completion handoff)
- `C:\Users\syede\Claude-Master\gitbranching.md` — git branching strategy (skeleton, filled out later)
- `C:\Users\syede\Claude-Master\contextmanagement.md` — protocol for context updates and `/clear` after each feature

<!-- ## Workspace lessons applied
     (Populate this section only if the user opted in during /start-project. Otherwise omit it.) -->

## Workflow

Workflow triggers are slash commands. Never act on phrases.
- `/create-plan` — light cross-phase brainstorm on `architecture.md`, then generate the thin `implementationplan.md` index plus one detailed PRD per phase under `implementationplan/`
- `/implement-phase <n>` — per-phase brainstorm against the active PRD (persisted to `phasebrainstorms/`), then implement phase `n` if its `ready` flag is true in the index and prior phases are done

## Session loading

When a new session starts in this folder, the main agent reads (in this order):
1. Workspace `CLAUDE.md` (auto-loaded)
2. This file (`claude.md`)
3. `context.md`
4. `implementationplan.md` (thin index only)

It does NOT load `architecture.md`, `codingprinciples.md`, `cicd.md`, any per-phase PRD under `implementationplan/`, or any brainstorm file under `phasebrainstorms/` at session start. Those are read on demand.
