import { useEffect, useState } from 'react'
import { listPublicQuizzes } from '../../client'
import { getApiErrorMessage } from '../../api/errors'
import { Link } from '@tanstack/react-router'
import QuizRunner from '../../components/quiz/QuizRunner'
import { mapBackendQuiz } from '../../components/quiz/backendQuiz'
import type { QuizDefinition } from '../../components/quiz/types'

export default function COLREGQuizPage() {
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
        (item) => item.name === 'COLREG-tietovisa',
      )

      if (!backendQuiz) {
        setError('COLREG-tietovisaa ei löytynyt.')
        return
      }
    
      setQuiz(
        mapBackendQuiz(backendQuiz, {
          eyebrow: 'Meriteiden säännöt — COLREG',
          description:
            'Testaa, tunnistatko alusten kulkuvalot ja tiedätkö kumpi alus väistää.',
          accentLights: ['#ef4444', '#22c55e', '#f8fafc'],
        })
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
          to="/IALA-quiz"
          className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        >
          Kokeile IALA-tietovisaa
        </Link>
      }
    />
  )
}
