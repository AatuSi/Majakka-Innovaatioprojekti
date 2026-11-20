import { useEffect, useState } from 'react'
import { Navigate } from '@tanstack/react-router'
import { listQuizResultsByTopic } from '../../client'
import type { QuizTopicResult } from '../../client'
import { getApiErrorMessage } from '../../api/errors'
import { openAuthModal } from '../../components/authModalStore'
import { useAuthUser } from '../../components/authUserStore'

// Quiz results grouped by topic (one quiz = one topic), for every user
// combined. Only admins get here: a regular user's own results are on the
// profile's Tilastot page, so they are sent there.
export default function QuizResultsPage() {
  const authUser = useAuthUser()
  const [results, setResults] = useState<QuizTopicResult[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // The endpoint needs a login, and only admins stay on this page.
    if (authUser?.role !== 'admin') return

    async function loadResults() {
      const result = await listQuizResultsByTopic()

      if (result.error) {
        setError(getApiErrorMessage(result))
        return
      }

      setError(null)
      setResults(result.data)
    }

    void loadResults()
  }, [authUser])

  if (authUser && authUser.role !== 'admin') {
    return <Navigate to="/profile/stats" replace />
  }

  return (
    <main className="flex-1 bg-navy-900 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
          Tulokset
        </p>

        <h1 className="mt-4 font-serif text-4xl font-semibold">
          Tulokset aiheittain
        </h1>

        <p className="mt-4 text-slate-300">
          Kaikkien käyttäjien tietovisatulokset yhteensä. Omat tuloksesi
          näet profiilisi Tilastot-sivulla.
        </p>

        {!authUser ? (
          <div className="mt-8">
            <p className="text-slate-300">
              Kirjaudu sisään nähdäksesi tuloksesi.
            </p>
            <button
              type="button"
              onClick={() => openAuthModal('sign-in')}
              className="mt-6 inline-block rounded-full bg-amber-300 px-5 py-2 text-sm font-semibold text-navy-950"
            >
              Kirjaudu
            </button>
          </div>
        ) : error ? (
          <p className="mt-8 text-red-300">{error}</p>
        ) : results.length === 0 ? (
          <p className="mt-8 text-slate-300">Tietovisoja ei löytynyt.</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {results.map((topic) => (
              <div
                key={topic.quiz_id}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <h2 className="font-serif text-2xl font-semibold">
                  {topic.quiz_name}
                </h2>

                {topic.attempt_count === 0 ? (
                  <p className="mt-3 text-sm text-slate-300">
                    Ei suorituksia vielä.
                  </p>
                ) : (
                  <>
                    {/* accuracy is null when nothing has been answered */}
                    <p className="mt-4 font-serif text-4xl font-semibold text-amber-300">
                      {topic.accuracy == null
                        ? '–'
                        : `${Math.round(topic.accuracy * 100)} %`}
                    </p>

                    <dl className="mt-4 space-y-1 text-sm text-slate-300">
                      <div className="flex justify-between">
                        <dt>Oikeita vastauksia</dt>
                        <dd>
                          {topic.correct_count} / {topic.answer_count}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>Suorituksia</dt>
                        <dd>{topic.attempt_count}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>Kysymyksiä visassa</dt>
                        <dd>{topic.question_count}</dd>
                      </div>
                      {topic.last_attempt_at && (
                        <div className="flex justify-between">
                          <dt>Viimeisin suoritus</dt>
                          <dd>
                            {new Date(topic.last_attempt_at).toLocaleDateString(
                              'fi-FI',
                            )}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
