import {Args, Command} from '@oclif/core'
import {access} from 'node:fs/promises'
import {basename} from 'node:path'

import {findRigRoot, loadRigConfig, resolveDroneName} from '../../lib/rig-config.js'
import {ensureTmux, attachDroneWindow} from '../../lib/tmux.js'

export default class GoDrone extends Command {
  static override args = {
    id: Args.string({description: 'Drone name to attach to', required: true}),
  }

  static override description = 'Open a tmux window for a drone'

  async run(): Promise<void> {
    const {args} = await this.parse(GoDrone)

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
    try {
      await access(drone.path)
    } catch {
      this.error(`Drone directory not found: ${drone.path}`)
    }

    ensureTmux()
    attachDroneWindow(droneName, drone.path)

    this.log(`Attached to drone "${droneName}"`)
  }
}
