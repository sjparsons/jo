import {Args, Command} from '@oclif/core'
import {basename} from 'node:path'

import {DEFAULT_NUDGE} from '../lib/prompts.js'
import {findRigRoot, loadRigConfig, resolveDroneName} from '../lib/rig-config.js'
import {ensureTmux, sendToDronePane} from '../lib/tmux.js'

export default class Nudge extends Command {
  static override args = {
    'drone-id': Args.string({description: 'Drone name to nudge', required: true}),
    message: Args.string({description: 'Message to send (uses default if omitted)', required: false}),
  }

  static override description = 'Send a message to a drone\'s Claude session'

  async run(): Promise<void> {
    const {args} = await this.parse(Nudge)

    const rigRoot = await findRigRoot(process.cwd())
    if (!rigRoot) {
      this.error('Not inside a rig. Run this from a directory containing rig.toml')
    }

    const rigName = basename(rigRoot)
    const config = await loadRigConfig(rigRoot)
    const droneName = resolveDroneName(config, rigName, args['drone-id'])
    if (!droneName) {
      this.error(`Drone "${args['drone-id']}" not found in this rig`)
    }

    ensureTmux()

    const message = args.message ?? DEFAULT_NUDGE
    sendToDronePane(droneName, message)

    this.log(`Nudged ${droneName}`)
  }
}
