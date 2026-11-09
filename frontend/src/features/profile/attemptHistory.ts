import { useEffect, useState } from 'react'
import { getAttemptHistory } from '../../client'
import type { QuizAttemptHistoryItem } from '../../client'
import { getApiErrorMessage } from '../../api/errors'

export const PASS_RATIO = 0.7

export function scoreRatio(item: QuizAttemptHistoryItem) {
  return item.total_questions > 0 ? item.score / item.total_questions : 0
}

/** The logged-in user's finished quiz attempts, newest first. */
export function useAttemptHistory() {
  const [history, setHistory] = useState<QuizAttemptHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void getAttemptHistory().then((result) => {
      if (cancelled) return
      if (result.error) setError(getApiErrorMessage(result))
      else setHistory(result.data ?? [])
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  return { history, loading, error }
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
