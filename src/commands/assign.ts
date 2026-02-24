import {Args, Command} from '@oclif/core'
import {execSync} from 'node:child_process'
import {basename} from 'node:path'

import {ASSIGN_PROMPT} from '../lib/prompts.js'
import {findRigRoot, loadRigConfig, resolveDroneName} from '../lib/rig-config.js'
import {ensureTmux, sendToDronePane} from '../lib/tmux.js'

const ASSIGN_SCRIPT = `
set -euo pipefail
ticket_id="$1"
assignee="$2"

# Find tickets dir by walking parents
dir="$PWD"
while [[ "$dir" != "/" ]]; do
  [[ -d "$dir/.tickets" ]] && { TICKETS_DIR="$dir/.tickets"; break; }
  dir=$(dirname "$dir")
done
[[ -z "\${TICKETS_DIR:-}" ]] && { echo "No .tickets directory found" >&2; exit 1; }

# Find the ticket file (supports partial match)
file="$TICKETS_DIR/\${ticket_id}.md"
if [[ ! -f "$file" ]]; then
  match=$(find "$TICKETS_DIR" -maxdepth 1 -name "*\${ticket_id}*.md" 2>/dev/null | head -1)
  [[ -z "$match" ]] && { echo "Ticket not found" >&2; exit 1; }
  file="$match"
fi

# Update or add assignee field
if grep -q "^assignee:" "$file"; then
  sed -i "s/^assignee:.*/assignee: $assignee/" "$file"
else
  sed -i "/^---$/a\\\\
assignee: $assignee" "$file"
fi

echo "Assigned $(basename "$file" .md) to $assignee"
`

export default class Assign extends Command {
  static override args = {
    'drone-id': Args.string({description: 'Drone name', required: true}),
    ticket: Args.string({description: 'Ticket ID', required: true}),
  }

  static override description = 'Assign a ticket to a drone and notify it'

  async run(): Promise<void> {
    const {args} = await this.parse(Assign)

    const rigRoot = await findRigRoot(process.cwd())
    if (!rigRoot) {
      this.error('Not inside a rig. Run this from a directory containing rig.toml')
    }

    const rigName = basename(rigRoot)
    const config = await loadRigConfig(rigRoot)
    const droneName = resolveDroneName(config, rigName, args['drone-id'])
    if (!droneName) {
      this.error(`Drone "${args['drone-id']}" not found in this rig`)
    }

    // Verify the ticket exists
    try {
      execSync(`tk show "${args.ticket}"`, {encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe']})
    } catch (err: any) {
      this.error(`Ticket "${args.ticket}" not found: ${err.stderr?.trim() || err.message}`)
    }

    // Assign the ticket
    const result = execSync(`bash -c '${ASSIGN_SCRIPT.replace(/'/g, "'\\''")}' -- "${args.ticket}" "${droneName}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()
    this.log(result)

    // Notify the drone
    ensureTmux()
    sendToDronePane(droneName, ASSIGN_PROMPT)

    this.log(`Notified ${droneName}`)
  }
}
