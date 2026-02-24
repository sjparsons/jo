import {c, git} from './format.js'
import type {DroneEntry} from './rig-config.js'
import {getAssignedTickets, type TicketInfo} from './tickets.js'
import {capturePaneContent, sendToDronePane, windowExists} from './tmux.js'

const previousCaptures = new Map<string, string>()
const nudgedFor429 = new Set<string>()

export interface DroneStatus {
  drone: DroneEntry
  gitStatus: string
  claudeStatus: string
  tickets: TicketInfo[]
  windowAlive: boolean
}

export function getClaudeStatus(droneName: string): string {
  if (!windowExists(droneName)) return 'window closed'

  const content = capturePaneContent(droneName).trim()
  if (!content) return 'idle'

  const previous = previousCaptures.get(droneName)
  previousCaptures.set(droneName, content)

  // Only flag rate limited if 429 is new (not in previous capture)
  const has429 = /429|rate.?limit/i.test(content)
  const had429 = previous !== undefined && /429|rate.?limit/i.test(previous)

  if (has429 && !had429) {
    nudgedFor429.add(droneName)
    sendToDronePane(droneName, 'You seem to have hit an API rate limit. Please wait a moment and then retry your last action.')
    return 'rate limited'
  }

  nudgedFor429.delete(droneName)

  if (previous === undefined) return 'working'
  return content !== previous ? 'working' : 'idle'
}

export function formatGitStatus(dronePath: string): string {
  const branch = git(dronePath, 'rev-parse --abbrev-ref HEAD') || '?'

  const status = git(dronePath, 'status --porcelain')
  const changedFiles = status ? status.split('\n').filter(Boolean).length : 0

  const diffStat = git(dronePath, 'diff --shortstat')
  let lines = ''
  if (diffStat) {
    const ins = diffStat.match(/(\d+) insertion/)
    const del = diffStat.match(/(\d+) deletion/)
    const parts: string[] = []
    if (ins) parts.push(c.green(`+${ins[1]}`))
    if (del) parts.push(c.red(`-${del[1]}`))
    lines = parts.join('/')
  }

  const upstream = git(dronePath, 'rev-parse --abbrev-ref @{upstream}')
  let pushed = ''
  if (!upstream) {
    pushed = c.yellow('no upstream')
  } else {
    const ahead = git(dronePath, 'rev-list --count @{upstream}..HEAD')
    pushed = ahead === '0' ? c.dim('pushed') : c.yellow(`${ahead} ahead`)
  }

  const parts = [c.cyan(branch)]
  if (changedFiles > 0) parts.push(c.yellow(`${changedFiles} changed`))
  if (lines) parts.push(lines)
  parts.push(pushed)

  return parts.join('  ')
}

export function formatClaudeStatus(status: string): string {
  switch (status) {
    case 'working':
      return c.green(status)
    case 'waiting':
      return c.yellow(status)
    case 'idle':
      return c.dim(status)
    case 'rate limited':
      return c.red(status)
    case 'error':
      return c.red(status)
    case 'done':
      return c.cyan(status)
    case 'window closed':
      return c.red(status)
    default:
      return c.dim(status)
  }
}

export function formatTickets(tickets: TicketInfo[]): string[] {
  if (tickets.length === 0) return [c.dim('none')]

  const lines: string[] = []
  for (const t of tickets) {
    const tagsStr = t.tags.length > 0 ? `  ${c.magenta(`[${t.tags.join(', ')}]`)}` : ''
    lines.push(`${c.bold(t.id)} ${c.dim(t.status)} ${t.title}${tagsStr}`)
    if (t.pullRequest) {
      lines.push(`${c.dim('└')} ${c.dim(t.pullRequest)}`)
    }
  }
  return lines
}

export function gatherDroneStatus(drone: DroneEntry, rigRoot: string): DroneStatus {
  return {
    drone,
    gitStatus: formatGitStatus(drone.path),
    claudeStatus: getClaudeStatus(drone.name),
    tickets: getAssignedTickets(drone.name, rigRoot),
    windowAlive: windowExists(drone.name),
  }
}

export function renderDashboard(rigName: string, statuses: DroneStatus[]): string {
  const lines: string[] = []
  lines.push('')
  lines.push(c.bold(`  ${rigName}`) + c.dim(`  ${new Date().toLocaleTimeString()}`))
  lines.push('')

  for (const s of statuses) {
    const dot = s.windowAlive ? c.green('\u25cf') : c.red('\u25cf')
    lines.push(`  ${dot} ${c.bold(s.drone.name)}`)
    lines.push(`    git: ${s.gitStatus}`)
    lines.push(`    claude: ${formatClaudeStatus(s.claudeStatus)}`)

    const ticketLines = formatTickets(s.tickets)
    lines.push(`    tickets:`)
    for (const tl of ticketLines) {
      lines.push(`      ${tl}`)
    }

    lines.push('')
  }

  return lines.join('\n')
}
