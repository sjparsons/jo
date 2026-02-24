import {Args, Command} from '@oclif/core'

import {loadRegistry} from '../../lib/registry.js'

export default class UseRig extends Command {
  static override args = {
    name: Args.string({description: 'Rig name', required: true}),
  }

  static override description = 'Print rig path (use with shell-init for cd)'

  async run(): Promise<void> {
    const {args} = await this.parse(UseRig)
    const registry = await loadRegistry()
    const rig = registry.rigs.find((r) => r.name === args.name)
    if (!rig) {
      this.error(`Rig "${args.name}" not found`)
    }

    // Print path to stdout for shell wrapper to capture
    process.stdout.write(rig.path)
  }
}
