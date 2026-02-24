export const ASSIGN_PROMPT =
  'Hey I just assigned a new ticket to you, you should see if you can pick it up next.'

export function assignReviewPrompt(ticketId: string, target: string): string {
  return `Hey I just assigned a code review to you. Please review ticket ${ticketId} — it's a review of "${target}". Check the PR, review the code, and leave feedback.`
}

export const DEFAULT_NUDGE =
  'Hey check tk for in_progress work to finish, or if there\'s new things to assign. If blocked update tk with blocked on the story.'
