import {Args, Command} from '@oclif/core'
import {basename} from 'node:path'

import {DEFAULT_NUDGE} from '../lib/prompts.js'
import {findRigRoot, loadRigConfig} from '../lib/rig-config.js'
import {ensureTmux, sendToDronePane, windowExists} from '../lib/tmux.js'

export default class NudgeAll extends Command {
  static override args = {
    message: Args.string({description: 'Message to send (uses default if omitted)', required: false}),
  }

  static override description = 'Send a message to all drones in the current rig'

  async run(): Promise<void> {
    const {args} = await this.parse(NudgeAll)

    const rigRoot = await findRigRoot(process.cwd())
    if (!rigRoot) {
      this.error('Not inside a rig. Run this from a directory containing rig.toml')
    }

    ensureTmux()

    const rigName = basename(rigRoot)
    const config = await loadRigConfig(rigRoot)
    const drones = config.drones ?? []

    if (drones.length === 0) {
      this.log(`No drones in rig "${rigName}"`)
      return
    }

    const message = args.message ?? DEFAULT_NUDGE
    let nudged = 0

    for (const drone of drones) {
      if (windowExists(drone.name)) {
        sendToDronePane(drone.name, message)
        this.log(`Nudged ${drone.name}`)
        nudged++
      } else {
        this.log(`Skipped ${drone.name} (window closed)`)
      }
    }

    this.log(`\nNudged ${nudged}/${drones.length} drones`)
  }
}
