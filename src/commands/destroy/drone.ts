import {Args, Command, Flags} from '@oclif/core'
import {execSync} from 'node:child_process'
import {rm} from 'node:fs/promises'
import {basename} from 'node:path'

import {findRigRoot, loadRigConfig, resolveDroneName, saveRigConfig} from '../../lib/rig-config.js'
import {killDroneWindow} from '../../lib/tmux.js'

export default class DestroyDrone extends Command {
  static override args = {
    id: Args.string({description: 'Drone name to destroy', required: true}),
  }

  static override description = 'Destroy a drone'

  static override flags = {
    force: Flags.boolean({char: 'f', description: 'Skip safety checks'}),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(DestroyDrone)

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

    if (!flags.force) {
      // Check for uncommitted changes
      try {
        const status = execSync('git status --porcelain', {cwd: drone.path, encoding: 'utf-8'}).trim()
        if (status) {
          this.error(`Drone "${droneName}" has uncommitted changes:\n${status}\n\nUse --force to skip checks.`)
        }
      } catch {
        this.error(`Could not check git status for drone "${droneName}". Use --force to skip checks.`)
      }

      // Check all branches are pushed
      try {
        const branches = execSync('git branch -vv', {cwd: drone.path, encoding: 'utf-8'})
        const unpushed = branches
          .split('\n')
          .filter((line) => line.includes('[') && (line.includes('ahead') || !line.includes('[')))
          .map((line) => line.trim())

        const localOnly = branches
          .split('\n')
          .filter((line) => line.trim() && !line.includes('['))
          .map((line) => line.trim())

        const issues = [...unpushed, ...localOnly].filter(Boolean)
        if (issues.length > 0) {
          this.error(`Drone "${droneName}" has unpushed branches:\n${issues.join('\n')}\n\nUse --force to skip checks.`)
        }
      } catch {
        // If we can't check, warn but allow
      }
    }

    killDroneWindow(droneName)

    await rm(drone.path, {recursive: true, force: true})

    config.drones = (config.drones ?? []).filter((d) => d.name !== droneName)
    await saveRigConfig(rigRoot, config)

    this.log(`Drone "${droneName}" destroyed`)
  }
}
