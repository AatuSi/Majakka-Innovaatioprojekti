import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { listPublicQuizzes } from '../../client'
import { getApiErrorMessage } from '../../api/errors'

export default function QuizSelectionPage() {
  const [quizzes, setQuizzes] = useState<
    NonNullable<Awaited<ReturnType<typeof listPublicQuizzes>>['data']>
  >([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadQuizzes() {
      const result = await listPublicQuizzes()

      if (result.error) {
        setError(getApiErrorMessage(result))
        return
      }

      setQuizzes(result.data ?? [])
    }

    void loadQuizzes()
  }, [])

  if (error) {
    return <p className="p-8 text-red-300">{error}</p>
  }

  return (
    <main className="flex-1 bg-navy-900 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
          Tietovisat
        </p>

        <h1 className="mt-4 font-serif text-4xl font-semibold">
          Valitse tietovisa
        </h1>

        <p className="mt-4 text-slate-300">
          Valitse tietovisa, jonka haluat suorittaa.
        </p>

        {quizzes.length === 0 ? (
          <p className="mt-8 text-slate-300">
            Tietovisoja ei löytynyt.
          </p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {quizzes.map((quiz) => {
              const isIala = quiz.name === 'IALA-tietovisa'
              const href = isIala ? '/IALA-quiz' : '/COLREG-quiz'

              return (
                <Link
                  key={quiz.id}
                  to={href}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-amber-300/60 hover:bg-white/10"
                >
                  <h2 className="font-serif text-2xl font-semibold">
                    {quiz.name}
                  </h2>

                  <p className="mt-3 text-sm text-slate-300">
                    {quiz.questions?.length ?? 0} kysymystä
                  </p>

                  <span className="mt-6 inline-block rounded-full bg-amber-300 px-5 py-2 text-sm font-semibold text-navy-950">
                    Aloita tietovisa
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}