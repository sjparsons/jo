import {Command, Flags} from '@oclif/core'
import {basename} from 'node:path'

import {gatherDroneStatus, renderDashboard} from '../../lib/drone-status.js'
import {findRigRoot, loadRigConfig} from '../../lib/rig-config.js'
import {loadRegistry} from '../../lib/registry.js'

export default class WatchDrones extends Command {
  static override description = 'Watch drone status with a polling dashboard'

  static override flags = {
    interval: Flags.integer({
      char: 'n',
      default: 60,
      description: 'Polling interval in seconds',
    }),
    rig: Flags.string({
      description: 'Watch a specific rig by name',
    }),
    status: Flags.string({
      char: 's',
      default: 'open,in_progress',
      description: 'Comma-separated ticket statuses to show (default: open,in_progress)',
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(WatchDrones)
    const interval = flags.interval * 1000
    const allowedStatuses = new Set(flags.status.split(',').map((s) => s.trim()))

    // Determine which rigs to watch
    interface RigTarget {
      name: string
      path: string
    }

    const targets: RigTarget[] = []

    if (flags.rig) {
      // Explicit --rig flag
      const registry = await loadRegistry()
      const rig = registry.rigs.find((r) => r.name === flags.rig)
      if (!rig) this.error(`Rig "${flags.rig}" not found`)
      targets.push({name: rig.name, path: rig.path})
    } else {
      // Try to find rig root from cwd
      const rigRoot = await findRigRoot(process.cwd())
      if (rigRoot) {
        targets.push({name: basename(rigRoot), path: rigRoot})
      } else {
        // Not in a rig — watch all rigs
        const registry = await loadRegistry()
        if (registry.rigs.length === 0) {
          this.error('No rigs found. Create one with: jo create rig <name> <repo-url>')
        }
        for (const rig of registry.rigs) {
          targets.push({name: rig.name, path: rig.path})
        }
      }
    }

    while (true) {
      const allOutput: string[] = []

      for (const target of targets) {
        try {
          const config = await loadRigConfig(target.path)
          const drones = config.drones ?? []

          if (drones.length === 0) {
            allOutput.push(`\n  ${target.name}: no drones\n`)
          } else {
            const statuses = drones.map((d) => {
              const s = gatherDroneStatus(d, target.path)
              s.tickets = s.tickets.filter((t) => allowedStatuses.has(t.status))
              return s
            })
            allOutput.push(renderDashboard(target.name, statuses))
          }
        } catch {
          allOutput.push(`\n  ${target.name}: could not load rig config\n`)
        }
      }

      process.stdout.write('\x1b[2J\x1b[H')
      process.stdout.write(allOutput.join(''))

      await new Promise((resolve) => setTimeout(resolve, interval))
    }
  }
}
