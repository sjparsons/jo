import {readFile, writeFile} from 'node:fs/promises'
import {homedir} from 'node:os'
import {join} from 'node:path'

import {parse, stringify} from 'smol-toml'

const REGISTRY_PATH = join(homedir(), '.jo.conf')

export interface Rig {
  name: string
  path: string
}

export interface Registry {
  rigs: Rig[]
}

export async function loadRegistry(): Promise<Registry> {
  try {
    const content = await readFile(REGISTRY_PATH, 'utf-8')
    const data = parse(content) as unknown as Registry
    return {rigs: data.rigs ?? []}
  } catch {
    return {rigs: []}
  }
}

export async function saveRegistry(registry: Registry): Promise<void> {
  await writeFile(REGISTRY_PATH, stringify(registry as any), 'utf-8')
}

export async function addRig(name: string, path: string): Promise<void> {
  const registry = await loadRegistry()
  registry.rigs.push({name, path})
  await saveRegistry(registry)
}
