import {execSync} from 'node:child_process'

export const c = {
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  magenta: (s: string) => `\x1b[35m${s}\x1b[0m`,
}

export function git(cwd: string, cmd: string): string {
  try {
    return execSync(`git ${cmd}`, {cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe']}).trim()
  } catch {
    return ''
  }
}
