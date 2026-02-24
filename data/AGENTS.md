# Project Instructions

> **Note:** `CLAUDE.md` and `AGENTS.md` are kept in sync. If you edit one, update the other to match.

## Project Overview

Rigs is a CLI for managing parallel AI-assisted development environments.

## Task Management

We use [ticket](https://github.com/wedow/ticket) (`tk`) for all task tracking.

- Use `tk` commands to create, list, start, close, and query tasks.
- Use `tk amend <id>` to update ticket fields (e.g. `--tags`, `--assignee`, `--priority`, `--description`, `--type`, `--external-ref`, `--parent`).
- Do **not** use TodoWrite, TaskCreate, or markdown files for task tracking.
- Create a ticket before starting work; update status as you progress.
- Tickets are stored as markdown files with YAML front matter in `.tickets/`. To set front matter fields not supported by `tk amend` (e.g. `pull_request`), find the ticket file and edit it directly.

## Project Structure

```
~/rigs/
  RIGS.md          # Design document (source of truth)
  mcpaas/          # Rig workspace
    rig.toml       # Per-rig config (repo URL)
    <drone>/      # Git clones, one per drone
  ~/.rigs          # Global registry (TOML) tracking all rigs and drones
```

## Key Conventions

- **Config format**: TOML (`rig.toml` per rig, `~/.rigs` global registry)
- **Drone names**: Single-syllable English words, globally unique across all rigs
- **tmux**: Hard dependency — all drone sessions run inside tmux
- **CLI entry points**: `rigs` (top-level) and `rig` (inside a rig folder)
- **Rig detection**: Presence of `rig.toml` in cwd

## Building

This is a greenfield project. Key implementation decisions:

- **Two CLI entry points**: `rigs` (top-level) and `rig` (inside a rig folder)
- **Config format**: TOML
- **Hard dependency**: tmux (must be running inside a tmux session)
- **Drone names**: Single-syllable English words, globally unique across all rigs. Bundle a word list with the tool.

### Commands to implement

1. `rigs create <name> <repo-url>` — Create rig folder + `rig.toml`, register in `~/.rigs`
2. `rigs list` — List all rigs from `~/.rigs`
3. `rig drone create [name]` — Clone repo, set up tmux window (50/50 split: Claude Code left, shell right), register drone
4. `rig drone list` — List drones in current rig
5. `rig drone attach <name>` — Open tmux window for existing drone
6. `rig drone destroy <name>` — Safety checks (no uncommitted changes, all branches pushed), then tear down tmux window + directory + registry entry. `--force` skips checks.

### Testing

- Test drone create/destroy lifecycle
- Test global name uniqueness enforcement
- Test destroy safety checks (dirty working tree, unpushed branches)
- Test behavior outside tmux (should error clearly)
- Test behavior outside a rig folder (should error clearly)

## Drone Identity

Run `jo is-drone` to check if you are a drone. If the command succeeds (exit 0), you are a drone and it prints your drone name. If it exits non-zero, you are not a drone.

If you are **not** a drone, the drone-specific session startup and assignment checks below do not apply.

## Drone Session Startup

When you start a drone session, before doing anything else:

1. Check if you are a drone (see Drone Identity above)
2. If you are **not** a drone, skip the assignment checks — just ask the user what they'd like to do
3. If you **are** a drone:
   a. Run `tk list --assignee=<your-drone-name> --status=in_progress` to check for tickets you already have in progress
   b. If you have in-progress tickets, resume work on the highest priority one first
   c. If none in progress, run `tk list --assignee=<your-drone-name>` to check for other assigned tickets
   d. If you have assigned tickets, begin work on them in priority order (highest priority first)
   e. If no assigned tickets, run `tk list --status=open` and ask the user which ticket to start on

## Git Rules

- **Never** commit or push directly to `main`. Always work on a feature branch.
- **Before writing any code**, create a feature branch. Do not make changes on `main`.
- All changes go through PRs. Wait for the PR to be merged — do not merge it yourself.

## Workflow

1. Pick a ticket at session start (see above)
2. Assign/claim the ticket and mark it **in_progress** (`tk start <id>`)
3. **Immediately** create and check out a feature branch (`git checkout -b <ticket-id>-short-description`). Do this before writing any code.
4. Implement the changes, committing as you go
5. Push the branch to the remote and create a PR (`gh pr create`). Capture the PR URL from the output.
6. **Store the PR URL in the ticket front matter**: find the ticket file in `.tickets/` and add `pull_request: <url>` to the YAML front matter. Example:
   ```yaml
   ---
   id: mcp-c8b1
   status: in_progress
   pull_request: https://github.com/org/repo/pull/123
   ---
   ```
7. Leave ticket status as `in_progress` — do **not** close it until the PR is merged
7. The ticket is **not closed** until the PR is merged
8. Run `tk list --assignee=<your-drone-name>` to check for more assigned work
9. If more tickets are assigned, work on the next one in priority order
10. If none, inform the user that your queue is clear

## Ticket Status Lifecycle

| State | Status | Tag | When |
|-------|--------|-----|------|
| Starting work | `in_progress` | — | After selecting a ticket |
| Blocked | `in_progress` | `blocked` | When you cannot proceed — `tk amend <id> --tags blocked`, add a note with `tk add-note <id> "Blocked: <reason>"`, and inform user |
| Unblocked | `in_progress` | — | Remove `blocked` tag when resolved |
| PR opened | `in_progress` | `in_review` | `tk amend <id> --tags in_review`, then edit the ticket file to add `pull_request: <url>` to front matter |
| PR merged | closed | — | Only close the ticket when the PR is merged |
