import {Args, Command} from '@oclif/core'
import {execSync} from 'node:child_process'
import {mkdir, symlink} from 'node:fs/promises'
import {basename, join, relative} from 'node:path'

import {findRigRoot, loadRigConfig, saveRigConfig} from '../../lib/rig-config.js'
import {ensureTmux, createDroneWindow} from '../../lib/tmux.js'
import {pickName} from '../../lib/words.js'

export default class CreateDrone extends Command {
  static override args = {
    name: Args.string({description: 'Name for the drone (auto-generated if omitted)', required: false}),
  }

  static override description = 'Create a new drone in the current rig'

  async run(): Promise<void> {
    const {args} = await this.parse(CreateDrone)

    const rigRoot = await findRigRoot(process.cwd())
    if (!rigRoot) {
      this.error('Not inside a rig. Run this from a directory containing rig.toml')
    }

    ensureTmux()

    const rigName = basename(rigRoot)
    const config = await loadRigConfig(rigRoot)

    const existingNames = new Set((config.drones ?? []).map((d) => d.name))

    let word = args.name
    if (word) {
      const droneName = `${rigName}-${word}`
      if (existingNames.has(droneName)) {
        this.error(`Drone "${droneName}" already exists in this rig`)
      }
    } else {
      const takenWords = new Set(
        (config.drones ?? []).map((d) => d.name.replace(`${rigName}-`, ''))
      )
      const picked = pickName(takenWords)
      if (!picked) {
        this.error('No available drone names. Destroy some drones first.')
      }
      word = picked
    }

    const droneName = `${rigName}-${word}`
    const dronePath = join(rigRoot, droneName)

    this.log(`Cloning ${config.repo} into ${droneName}/...`)
    execSync(`git clone "${config.repo}" "${dronePath}"`, {stdio: 'inherit'})

    // Symlink .claude/settings.local.json from rig to drone
    const droneClaudeDir = join(dronePath, '.claude')
    await mkdir(droneClaudeDir, {recursive: true})
    const rigSettingsPath = join(rigRoot, '.claude', 'settings.local.json')
    const droneSettingsPath = join(droneClaudeDir, 'settings.local.json')
    const relPath = relative(droneClaudeDir, rigSettingsPath)
    try {
      await symlink(relPath, droneSettingsPath)
    } catch {
      // Symlink may fail if target doesn't exist yet, that's fine (dangling symlink)
    }

    config.drones ??= []
    config.drones.push({name: droneName, path: dronePath})
    await saveRigConfig(rigRoot, config)

    // Set up tmux window
    createDroneWindow(droneName, dronePath)

    this.log(`Drone "${droneName}" created and ready`)
  }
}
