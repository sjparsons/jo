import {Command} from '@oclif/core'

const SHELL_FUNCTION = `jo() {
  if [ "$1" = "use" ] && [ "$2" = "rig" ] && [ -n "$3" ]; then
    local dir; dir="$(command jo use rig "$3")"
    [ -n "$dir" ] && [ -d "$dir" ] && cd "$dir" || return 1
  else
    command jo "$@"
  fi
}`

export default class ShellInit extends Command {
  static override description = 'Output shell function for .zshrc/.bashrc'

  async run(): Promise<void> {
    await this.parse(ShellInit)
    this.log(SHELL_FUNCTION)
  }
}
