import {Args, Command} from '@oclif/core'
import {execSync} from 'node:child_process'
import {readFileSync, writeFileSync} from 'node:fs'
import {basename, join} from 'node:path'

import {assignReviewPrompt} from '../lib/prompts.js'
import {findRigRoot, loadRigConfig, resolveDroneName} from '../lib/rig-config.js'
import {ensureTmux, sendToDronePane} from '../lib/tmux.js'

export default class AssignReview extends Command {
  static override args = {
    'drone-id': Args.string({description: 'Drone name to assign the review to', required: true}),
    target: Args.string({description: 'Ticket ID, branch name, or PR URL to review', required: true}),
  }

  static override description = 'Create a review ticket and assign it to a drone'

  async run(): Promise<void> {
    const {args} = await this.parse(AssignReview)

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

    const target = args.target

    // Resolve target to get a title
    let title: string
    try {
      // Try as ticket ID first
      const ticketOutput = execSync(`tk show "${target}"`, {
        cwd: rigRoot,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim()
      const titleMatch = ticketOutput.match(/^#\s+(.+)/m) || ticketOutput.match(/title:\s*(.+)/m)
      title = titleMatch ? titleMatch[1].trim() : target
    } catch {
      // Try as PR URL or branch
      try {
        const prOutput = execSync(`gh pr view "${target}" --json title -q .title`, {
          cwd: rigRoot,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
        }).trim()
        title = prOutput || target
      } catch {
        title = target
      }
    }

    // Create review ticket
    const createOutput = execSync(`tk create "Review: ${title}" --tags review`, {
      cwd: rigRoot,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()

    // Extract ticket ID from creation output
    const idMatch = createOutput.match(/(\S+)/)
    if (!idMatch) {
      this.error('Failed to parse ticket ID from tk create output')
    }
    const ticketId = idMatch[1]

    // Edit ticket frontmatter to add review_of and assignee
    const ticketPath = join(rigRoot, '.tickets', `${ticketId}.md`)
    try {
      const content = readFileSync(ticketPath, 'utf-8')
      const updated = content.replace(/^(---\n)/, `$1review_of: ${target}\nassignee: ${droneName}\n`)
      writeFileSync(ticketPath, updated, 'utf-8')
    } catch {
      // If we can't edit the file directly, try tk amend
      try {
        execSync(`tk amend "${ticketId}" --assignee "${droneName}"`, {
          cwd: rigRoot,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
        })
      } catch {
        // Best effort
      }
    }

    this.log(`Created review ticket ${ticketId}: Review: ${title}`)

    // Nudge the drone
    ensureTmux()
    sendToDronePane(droneName, assignReviewPrompt(ticketId, target))

    this.log(`Assigned to ${droneName} and nudged`)
  }
}
