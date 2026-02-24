import {execSync} from 'node:child_process'

function run(cmd: string): string {
  return execSync(cmd, {encoding: 'utf-8'}).trim()
}

export function ensureTmux(): void {
  if (!process.env.TMUX) {
    throw new Error('Not in a tmux session. Please start tmux first.')
  }
}

export function createDroneWindow(droneName: string, dronePath: string): void {
  run(`tmux new-window -d -n "${droneName}" -c "${dronePath}"`)
  run(`tmux split-window -h -t "${droneName}" -c "${dronePath}"`)
  run(`tmux select-pane -t "${droneName}.0"`)
  run(`tmux send-keys -t "${droneName}.0" "claude" Enter`)
}

export function killDroneWindow(droneName: string): void {
  try {
    run(`tmux kill-window -t "${droneName}"`)
  } catch {
    // Window may already be closed
  }
}

export function windowExists(windowName: string): boolean {
  try {
    run(`tmux list-windows -F '#{window_name}' | grep -qx '${windowName}'`)
    return true
  } catch {
    return false
  }
}

export function capturePaneContent(droneName: string, lines = 50): string {
  try {
    return run(`tmux capture-pane -p -t "${droneName}.0" -S -${lines}`)
  } catch {
    return ''
  }
}

export function sendToDronePane(droneName: string, text: string): void {
  // Send text and Enter as separate commands so Claude Code's TUI
  // doesn't batch them together and treat Enter as a newline in the input.
  // The -l flag ensures text is sent literally (no key name interpretation).
  run(`tmux send-keys -t "${droneName}.0" -l ${JSON.stringify(text)}`)
  run(`tmux send-keys -t "${droneName}.0" Enter`)
}

export function attachDroneWindow(droneName: string, dronePath: string): void {
  if (windowExists(droneName)) {
    run(`tmux select-window -t "${droneName}"`)
  } else {
    createDroneWindow(droneName, dronePath)
  }
}
