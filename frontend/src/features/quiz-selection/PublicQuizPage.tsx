import { useEffect, useState } from 'react'
import { getPublicQuiz } from '../../client'
import { getApiErrorMessage } from '../../api/errors'
import QuizRunner from '../../components/quiz/QuizRunner'
import { mapBackendQuiz } from '../../components/quiz/backendQuiz'
import type { QuizDefinition } from '../../components/quiz/types'

export default function PublicQuizPage({ quizId }: { quizId: string }) {
  const [quiz, setQuiz] = useState<QuizDefinition | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadQuiz() {
      const result = await getPublicQuiz({
        path: { quiz_id: quizId },
      })

      if (result.error || !result.data) {
        setError(
          result.error
            ? getApiErrorMessage(result)
            : 'Tietovisaa ei löytynyt.',
        )
        return
      }

      setQuiz(
        mapBackendQuiz(result.data, {
          eyebrow: 'Majakka-tietovisa',
          description: 'Testaa tietosi ja vastaa jokaiseen kysymykseen.',
          accentLights: ['#ef4444', '#22c55e', '#f8fafc', '#f59e0b'],
        }),
      )
    }

    void loadQuiz()
  }, [quizId])

  if (error) return <p className="p-8 text-red-300">{error}</p>
  if (!quiz) return <p className="p-8 text-slate-300">Ladataan tietovisaa...</p>

  return <QuizRunner quiz={quiz} />
}
