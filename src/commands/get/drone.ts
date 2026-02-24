import {Args, Command} from '@oclif/core'
import {basename} from 'node:path'

import {c, git} from '../../lib/format.js'
import {getClaudeStatus, formatClaudeStatus, formatTickets} from '../../lib/drone-status.js'
import {findRigRoot, loadRigConfig, resolveDroneName} from '../../lib/rig-config.js'
import {getAssignedTickets} from '../../lib/tickets.js'
import {windowExists} from '../../lib/tmux.js'

export default class GetDrone extends Command {
  static override args = {
    id: Args.string({description: 'Drone name or short name', required: true}),
  }

  static override description = 'Show detailed status for a single drone'

  async run(): Promise<void> {
    const {args} = await this.parse(GetDrone)

    const rigRoot = await findRigRoot(process.cwd())
    if (!rigRoot) {
      this.error('Not inside a rig. Run this from a directory containing rig.toml')
    }

    const rigName = basename(rigRoot)
    const config = await loadRigConfig(rigRoot)
    const droneName = resolveDroneName(config, rigName, args.id)
    if (!droneName) {
      this.error(`Drone "${args.id}" not found in this rig`)
    }

    const drone = config.drones!.find((d) => d.name === droneName)!
    const alive = windowExists(droneName)
    const claudeStatus = getClaudeStatus(droneName)
    const tickets = getAssignedTickets(droneName, rigRoot)

    // Git details
    const branch = git(drone.path, 'rev-parse --abbrev-ref HEAD') || '?'
    const status = git(drone.path, 'status --porcelain')
    const changedFiles = status ? status.split('\n').filter(Boolean).length : 0
    const diffStat = git(drone.path, 'diff --shortstat')
    const upstream = git(drone.path, 'rev-parse --abbrev-ref @{upstream}')
    let pushStatus = ''
    if (!upstream) {
      pushStatus = 'no upstream'
    } else {
      const ahead = git(drone.path, 'rev-list --count @{upstream}..HEAD')
      pushStatus = ahead === '0' ? 'pushed' : `${ahead} commits ahead`
    }

    const dot = alive ? c.green('\u25cf') : c.red('\u25cf')

    this.log('')
    this.log(`  ${dot} ${c.bold(droneName)}`)
    this.log(`  ${c.dim(drone.path)}`)
    this.log('')
    this.log(`  ${c.bold('git')}`)
    this.log(`    branch:   ${c.cyan(branch)}`)
    this.log(`    changed:  ${changedFiles > 0 ? c.yellow(String(changedFiles)) : c.dim('0')}`)
    if (diffStat) this.log(`    diff:     ${diffStat.trim()}`)
    this.log(`    upstream: ${pushStatus}`)
    this.log('')
    this.log(`  ${c.bold('claude')}`)
    this.log(`    status:   ${formatClaudeStatus(claudeStatus)}`)
    this.log('')
    this.log(`  ${c.bold('tickets')}`)
    const ticketLines = formatTickets(tickets)
    for (const tl of ticketLines) {
      this.log(`    ${tl}`)
    }
    this.log('')
  }
}
