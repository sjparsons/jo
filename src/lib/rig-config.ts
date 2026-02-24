import {access, readFile, writeFile} from 'node:fs/promises'
import {dirname, join} from 'node:path'

import {parse, stringify} from 'smol-toml'

export interface DroneEntry {
  name: string
  path: string
}

export interface RigConfig {
  repo: string
  drones?: DroneEntry[]
}

export async function loadRigConfig(dir: string): Promise<RigConfig> {
  const content = await readFile(join(dir, 'rig.toml'), 'utf-8')
  const config = parse(content) as unknown as RigConfig
  config.drones ??= []
  return config
}

export async function saveRigConfig(dir: string, config: RigConfig): Promise<void> {
  await writeFile(join(dir, 'rig.toml'), stringify(config as any), 'utf-8')
}

export function resolveDroneName(config: RigConfig, rigName: string, input: string): string | null {
  const drones = config.drones ?? []
  // Try exact match first
  if (drones.some((d) => d.name === input)) return input
  // Try with rig prefix
  const prefixed = `${rigName}-${input}`
  if (drones.some((d) => d.name === prefixed)) return prefixed
  return null
}

export async function findRigRoot(startDir: string): Promise<string | null> {
  let dir = startDir
  while (true) {
    try {
      await access(join(dir, 'rig.toml'))
      return dir
    } catch {
      const parent = dirname(dir)
      if (parent === dir) return null
      dir = parent
    }
  }
}
