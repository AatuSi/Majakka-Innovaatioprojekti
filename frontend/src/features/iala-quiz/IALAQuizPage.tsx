import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { listPublicQuizzes } from '../../client'
import { getApiErrorMessage } from '../../api/errors'
import QuizRunner from '../../components/quiz/QuizRunner'
import { mapBackendQuiz } from '../../components/quiz/backendQuiz'
import type { QuizDefinition } from '../../components/quiz/types'

export default function IALAQuizPage() {
  const [quiz, setQuiz] = useState<QuizDefinition | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadQuiz() {
      const result = await listPublicQuizzes()

      if (result.error) {
        setError(getApiErrorMessage(result))
        return
      }

      const backendQuiz = result.data?.find(
        (item) => item.name === 'IALA-tietovisa',
      )

      if (!backendQuiz) {
        setError('IALA-tietovisaa ei löytynyt.')
        return
      }
    
      setQuiz(
        mapBackendQuiz(backendQuiz, {
          eyebrow: 'IALA-merenkulun merkintäjärjestelmä',
          description:
            'Testaa, tunnistatko IALA-järjestelmän poijut, huippumerkit ja loistojen rytmit.',
          accentLights: ['#ef4444', '#22c55e', '#f8fafc', '#f59e0b'],
        }),
      )
    }

    void loadQuiz()
  }, [])

    if (error) {
    return <p>{error}</p>
  }

  if (!quiz) {
    return <p>Ladataan tietovisaa...</p>
  }

  return (
      <QuizRunner
        quiz={quiz}
        relatedLink={
          <Link
            to="/COLREG-quiz"
            className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          >
            Kokeile COLREG-tietovisaa
          </Link>
        }
      />
  )
}
