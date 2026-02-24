import {Command} from '@oclif/core'

import {loadRigConfig} from '../../lib/rig-config.js'
import {loadRegistry} from '../../lib/registry.js'

export default class GetRigs extends Command {
  static override description = 'List all rigs'

  async run(): Promise<void> {
    await this.parse(GetRigs)
    const registry = await loadRegistry()

    if (registry.rigs.length === 0) {
      this.log('No rigs found. Create one with: jo create rig <name> <repo-url>')
      return
    }

    this.log('')
    for (const rig of registry.rigs) {
      let droneCount = 0
      try {
        const config = await loadRigConfig(rig.path)
        droneCount = (config.drones ?? []).length
      } catch {
        // rig config may not be readable
      }
      const droneLabel = droneCount === 1 ? 'drone' : 'drones'
      this.log(`  ${rig.name}  ${rig.path}  (${droneCount} ${droneLabel})`)
    }
    this.log('')
  }
}
