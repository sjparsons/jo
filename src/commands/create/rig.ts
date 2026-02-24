import {Args, Command} from '@oclif/core'
import {copyFile, mkdir} from 'node:fs/promises'
import {join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

import {saveRigConfig} from '../../lib/rig-config.js'
import {addRig} from '../../lib/registry.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const dataDir = join(__dirname, '..', '..', '..', 'data')

export default class CreateRig extends Command {
  static override args = {
    name: Args.string({description: 'Name for the rig', required: true}),
    'repo-url': Args.string({description: 'Git repository URL', required: true}),
  }

  static override description = 'Create a new rig'

  async run(): Promise<void> {
    const {args} = await this.parse(CreateRig)
    const name = args.name
    const repoUrl = args['repo-url']
    const rigPath = resolve(join(process.cwd(), name))

    await mkdir(rigPath, {recursive: true})
    await saveRigConfig(rigPath, {repo: repoUrl})
    await copyFile(join(dataDir, 'AGENTS.md'), join(rigPath, 'AGENTS.md'))
    await copyFile(join(dataDir, 'CLAUDE.md'), join(rigPath, 'CLAUDE.md'))
    await addRig(name, rigPath)

    this.log(`Created rig "${name}" at ${rigPath}`)
  }
}
