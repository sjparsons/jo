# jo

A CLI for parallel agentic development.

`jo` is repo-oriented and introduces a concept of a *rig* which is a repo that you want to work on. Each *rig* can have multiple *drones* working on tasks within that repo.A drone is a cloned copy of the repo, with its own Claude Code session running in a tmux window. 

`jo` is named about Johann Sebastian Bach.

## Install

```
npm install -g https://github.com/sjparsons/jo
```

Requires: Node.js 18+, tmux, claude.

### Dependencies

Jo uses [ticket](https://github.com/wedow/ticket) (`tk`) for task tracking within rigs. Install it along with the [ticket-amend](https://github.com/sjparsons/ticket-amend) plugin, which is needed for updating ticket fields:

```
npm install -g https://github.com/wedow/ticket
npm install -g https://github.com/sjparsons/ticket-amend
```

You may also want these optional plugins:

- [ticket-board](https://github.com/sjparsons/ticket-board) — kanban-style board view for tickets
- [ticket-wizard](https://github.com/sjparsons/ticket-wizard) — interactive guided ticket creation


### Shell setup

Run `jo init` to set up your shell integration:

```
jo init
```

This detects your shell (zsh or bash), checks your config file (`~/.zshrc` or `~/.bashrc`), and appends `eval "$(jo shell-init)"` if it isn't already present. Restart your shell or source the config file afterward.

Shell integration enables `jo use rig <name>` to cd into a rig directory.


## Commands

| Command | Description |
|---------|-------------|
| `jo init` | Add shell integration to your `.zshrc` or `.bashrc` |
| `jo create rig <name> <repo>` | Create a new rig with AGENTS.md and CLAUDE.md templates |
| `jo get rigs` | List all rigs |
| `jo use rig <name>` | cd into a rig directory (requires shell integration) |
| `jo create drone [name]` | Clone the repo, open a tmux window with Claude + shell |
| `jo get drones [--status <s>]` | List drones in current rig, optionally filtered by status |
| `jo get drone <id>` | Show detailed status for one drone |
| `jo go drone <id>` | Attach to a drone's tmux window |
| `jo assign <id> <ticket>` | Assign a ticket to a drone and nudge it |
| `jo assign-review <id> <target>` | Assign a code review task to a drone |
| `jo nudge <id> [message]` | Send a message to a drone's Claude session |
| `jo nudge-all [message]` | Nudge all drones in the current rig |
| `jo watch drones [--interval N]` | Live dashboard with git info, Claude activity, and tickets |
| `jo destroy drone <id> [--force]` | Destroy a drone (checks for uncommitted/unpushed work) |

## Layout

```
my-project/
  rig.toml                # config (repo url, drone list)
  AGENTS.md               # template for Claude instances
  CLAUDE.md               # template for Claude instances
  my-project-fox/         # drone (git clone)
  my-project-elm/         # drone (git clone)
  .tickets/               # ticket tracking
```

Global registry at `~/.jo.conf` tracks all rigs and drones for name uniqueness.
