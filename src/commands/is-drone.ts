import {Command} from '@oclif/core'

import {loadRigConfig} from '../lib/rig-config.js'
import {loadRegistry} from '../lib/registry.js'

export default class IsDrone extends Command {
  static override description = 'Check if the current directory is inside a drone'

  async run(): Promise<void> {
    await this.parse(IsDrone)

    const cwd = process.cwd()
    const registry = await loadRegistry()

    for (const rig of registry.rigs) {
      try {
        const config = await loadRigConfig(rig.path)
        const match = (config.drones ?? []).find(
          (d) => cwd === d.path || cwd.startsWith(d.path + '/')
        )
        if (match) {
          this.log(match.name)
          return
        }
      } catch {
        // rig config may not be readable
      }
    }

    process.exit(1)
  }
}
