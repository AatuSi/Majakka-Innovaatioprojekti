import { useEffect, useState } from 'react'
import { getAttemptHistory } from '../../client'
import type { QuizAttemptHistoryItem } from '../../client'
import { getApiErrorMessage } from '../../api/errors'

export const PASS_RATIO = 0.7

export function scoreRatio(item: QuizAttemptHistoryItem) {
  return item.total_questions > 0 ? item.score / item.total_questions : 0
}

export function isUnfinished(item: QuizAttemptHistoryItem) {
  return item.completed_at === null || item.completed_at === undefined
}

/** Page that runs the quiz, by its name in the database. */
export function quizPath(quizName?: string | null) {
  return quizName === 'IALA-tietovisa' ? '/IALA-quiz' : '/COLREG-quiz'
}

/**
 * The unfinished attempts worth continuing: per quiz only the latest, and only
 * when the quiz has not been finished after it was started. Older ones were
 * left behind for a newer try, so offering them would only add noise.
 */
function continuableAttempts(all: QuizAttemptHistoryItem[]) {
  const latestFinishedStart = new Map<string, string>()
  for (const item of all) {
    if (isUnfinished(item)) continue
    const previous = latestFinishedStart.get(item.quiz_id)
    if (!previous || item.created_at > previous) latestFinishedStart.set(item.quiz_id, item.created_at)
  }

  const latestUnfinished = new Map<string, QuizAttemptHistoryItem>()
  for (const item of all) {
    if (!isUnfinished(item)) continue
    const previous = latestUnfinished.get(item.quiz_id)
    if (!previous || item.created_at > previous.created_at) latestUnfinished.set(item.quiz_id, item)
  }

  return new Set(
    [...latestUnfinished.values()]
      .filter((item) => item.created_at > (latestFinishedStart.get(item.quiz_id) ?? ''))
      .map((item) => item.id),
  )
}

/**
 * The logged-in user's quiz attempts. `history` holds the finished ones, which
 * all statistics are counted from; `rows` adds the unfinished attempts that can
 * be continued, for the attempt list. Both are newest first.
 */
export function useAttemptHistory() {
  const [all, setAll] = useState<QuizAttemptHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void getAttemptHistory({ query: { include_unfinished: true } }).then((result) => {
      if (cancelled) return
      if (result.error) setError(getApiErrorMessage(result))
      else setAll(result.data)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const continuable = continuableAttempts(all)
  const history = all.filter((item) => !isUnfinished(item))
  const rows = all.filter((item) => !isUnfinished(item) || continuable.has(item.id))

  return { history, rows, loading, error }
}

/**
 * Average change from the first attempt to the latest, in percentage points,
 * over the quizzes taken more than once. Null until a quiz has been retaken.
 */
function averageImprovement(history: QuizAttemptHistoryItem[]) {
  const attemptsByQuiz = new Map<string, QuizAttemptHistoryItem[]>()

  for (const item of history) {
    attemptsByQuiz.set(item.quiz_id, [...(attemptsByQuiz.get(item.quiz_id) ?? []), item])
  }

  const changes = [...attemptsByQuiz.values()]
    .filter((attempts) => attempts.length > 1)
    .map((attempts) => scoreRatio(attempts[0]) - scoreRatio(attempts[attempts.length - 1]))

  if (changes.length === 0) return null
  return Math.round((changes.reduce((acc, curr) => acc + curr, 0) / changes.length) * 100)
}

export function summarizeAttempts(history: QuizAttemptHistoryItem[]) {
  const totalScore = history.reduce((acc, curr) => acc + curr.score, 0)
  const totalQuestions = history.reduce((acc, curr) => acc + curr.total_questions, 0)
  const passed = history.filter((item) => scoreRatio(item) >= PASS_RATIO).length

  return {
    completed: history.length,
    accuracy: totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0,
    passRate: history.length > 0 ? Math.round((passed / history.length) * 100) : 0,
    totalSeconds: history.reduce((acc, curr) => acc + (curr.duration_seconds ?? 0), 0),
    improvement: averageImprovement(history),
  }
}
