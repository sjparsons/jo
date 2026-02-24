import {Command} from '@oclif/core'
import {existsSync, readFileSync, appendFileSync} from 'node:fs'
import {join} from 'node:path'
import {homedir} from 'node:os'

const INIT_LINE = 'eval "$(jo shell-init)"'

export default class Init extends Command {
  static override description = 'Add jo shell-init to your shell config'

  async run(): Promise<void> {
    await this.parse(Init)

    const shell = process.env.SHELL ?? ''
    let configFile: string

    if (shell.endsWith('/zsh')) {
      configFile = join(homedir(), '.zshrc')
    } else if (shell.endsWith('/bash')) {
      configFile = join(homedir(), '.bashrc')
    } else {
      this.error(`Unsupported shell: ${shell || '(unknown)'}. Add ${INIT_LINE} to your shell config manually.`)
    }

    if (existsSync(configFile)) {
      const contents = readFileSync(configFile, 'utf8')
      if (contents.includes('jo shell-init')) {
        this.log(`Already set up in ${configFile}`)
        return
      }
    }

    appendFileSync(configFile, `\n${INIT_LINE}\n`)
    this.log(`Added ${INIT_LINE} to ${configFile}`)
    this.log('Restart your shell or run: source ' + configFile)
  }
}
