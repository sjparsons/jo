import {Command, Flags} from '@oclif/core'
import {basename} from 'node:path'

import {c, git} from '../../lib/format.js'
import {getClaudeStatus} from '../../lib/drone-status.js'
import {findRigRoot, loadRigConfig} from '../../lib/rig-config.js'

function formatDrone(name: string, dronePath: string): string {
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

  const main = `  ${c.bold(name)}  ${parts.join('  ')}`
  const sub = `  ${c.dim(`└ ${dronePath}`)}`
  return `${main}\n${sub}`
}

export default class GetDrones extends Command {
  static override description = 'List drones in the current rig'

  static override flags = {
    status: Flags.string({
      char: 's',
      description: 'Filter by claude status (e.g. working, idle, rate limited, window closed)',
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(GetDrones)

    const rigRoot = await findRigRoot(process.cwd())
    if (!rigRoot) {
      this.error('Not inside a rig. Run this from a directory containing rig.toml')
    }

    const rigName = basename(rigRoot)
    const config = await loadRigConfig(rigRoot)
    const drones = config.drones ?? []

    if (drones.length === 0) {
      this.log(`No drones in rig "${rigName}". Create one with: jo create drone`)
      return
    }

    const filtered = flags.status
      ? drones.filter((d) => getClaudeStatus(d.name) === flags.status)
      : drones

    if (filtered.length === 0) {
      this.log(`No drones with status "${flags.status}"`)
      return
    }

    this.log('')
    for (const drone of filtered) {
      this.log(formatDrone(drone.name, drone.path))
    }
    this.log('')
  }
}
