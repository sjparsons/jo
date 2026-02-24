import {execSync} from 'node:child_process'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'

export interface TicketInfo {
  id: string
  status: string
  title: string
  tags: string[]
  pullRequest: string | null
}

export function readTicketMeta(ticketId: string, rigRoot: string): {tags: string[]; pullRequest: string | null} {
  try {
    const filePath = join(rigRoot, '.tickets', `${ticketId}.md`)
    const content = readFileSync(filePath, 'utf-8')
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
    if (!fmMatch) return {tags: [], pullRequest: null}

    const fm = fmMatch[1]
    const tagsMatch = fm.match(/^tags:\s*\[([^\]]*)\]/m)
    const tags = tagsMatch
      ? tagsMatch[1].split(',').map((t) => t.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
      : []

    const prMatch = fm.match(/^pull_request:\s*(.+)/m)
    const pullRequest = prMatch ? prMatch[1].trim() : null

    return {tags, pullRequest}
  } catch {
    return {tags: [], pullRequest: null}
  }
}

export function getAssignedTickets(droneName: string, rigRoot: string): TicketInfo[] {
  let output: string
  try {
    output = execSync(`tk list -a "${droneName}"`, {
      cwd: rigRoot,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()
  } catch {
    return []
  }

  if (!output) return []

  const tickets: TicketInfo[] = []
  for (const line of output.split('\n')) {
    // Expected format: ID [status] - title   or   ID [status] - title <- [deps]
    const match = line.match(/^(\S+)\s+\[(\w+)\]\s+-\s+(.+?)(?:\s+<-\s+.*)?$/)
    if (!match) continue

    const [, id, status, title] = match
    const meta = readTicketMeta(id, rigRoot)
    tickets.push({
      id,
      status,
      title: title.trim(),
      tags: meta.tags,
      pullRequest: meta.pullRequest,
    })
  }

  return tickets
}
