import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faRotateRight } from '@fortawesome/free-solid-svg-icons'
import { useAuthUser } from '../../components/authUserStore'
import { PASS_RATIO, useTopicResults, weakestTopic } from './attemptHistory'
import QuizLink from './QuizLink'
import { card, insetPanel } from './profileStyles'

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('fi-FI')

/** The user's results per quiz, each quiz being one topic (IALA, COLREG). */
export default function TopicResults() {
  const authUser = useAuthUser()
  const { topics, loading, error } = useTopicResults(authUser?.id)
  const weakest = weakestTopic(topics)

  return (
    <section className={`${card} p-6 sm:p-8`}>
      <h3 className="text-xl font-light text-white">Tulokset aiheittain</h3>
      <p className="mt-1 text-sm font-light text-[#9fb0c7]">
        Oikeiden vastausten osuus kaikista vastauksistasi, tietovisa kerrallaan.
      </p>

      {loading || error || topics.length === 0 ? (
        <p className="mt-6 text-sm font-light text-[#9fb0c7]">
          {loading
            ? 'Ladataan tuloksia...'
            : (error ?? 'Tietovisoja ei löytynyt.')}
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {topics.map((topic) => {
            const tried =
              topic.accuracy !== null && topic.accuracy !== undefined
            const percent = tried ? Math.round((topic.accuracy ?? 0) * 100) : 0
            const passed = tried && (topic.accuracy ?? 0) >= PASS_RATIO
            const isWeakest =
              weakest?.quiz_id === topic.quiz_id && topics.length > 1

            return (
              <div
                key={topic.quiz_id}
                className={`${insetPanel} flex flex-col gap-4 p-5`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-base font-medium text-white">
                    {topic.quiz_name ?? 'Nimetön tietovisa'}
                  </h4>
                  {isWeakest && (
                    <span className="shrink-0 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                      Kertaa tätä
                    </span>
                  )}
                </div>

                {tried ? (
                  <>
                    <div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-3xl font-light text-white">
                          {percent}%
                        </span>
                        <span className="text-xs text-[#9fb0c7]">
                          {topic.correct_count}/{topic.answer_count} oikein
                        </span>
                      </div>
                      <div
                        className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#0F1724]"
                        role="progressbar"
                        aria-label={`${topic.quiz_name ?? 'Tietovisa'}: oikeita vastauksia`}
                        aria-valuenow={percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className={`h-full rounded-full ${passed ? 'bg-emerald-400' : 'bg-rose-400'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                    <dl className="space-y-1 text-xs text-[#9fb0c7]">
                      <div className="flex justify-between">
                        <dt>Suorituksia</dt>
                        <dd className="text-[#c3cddb]">
                          {topic.attempt_count}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>Kysymyksiä tietovisassa</dt>
                        <dd className="text-[#c3cddb]">
                          {topic.question_count}
                        </dd>
                      </div>
                      {topic.last_attempt_at && (
                        <div className="flex justify-between">
                          <dt>Viimeisin suoritus</dt>
                          <dd className="text-[#c3cddb]">
                            {formatDate(topic.last_attempt_at)}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </>
                ) : (
                  <p className="text-sm font-light text-[#9fb0c7]">
                    Et ole vielä vastannut tämän tietovisan kysymyksiin.
                  </p>
                )}

                <QuizLink
                  quizName={topic.quiz_name}
                  className="mt-auto inline-flex items-center gap-1.5 self-start text-xs font-semibold text-[#1D90F4] underline-offset-4 transition hover:underline"
                >
                  <FontAwesomeIcon
                    icon={tried ? faRotateRight : faPlay}
                    className="text-[10px]"
                  />
                  <span>{tried ? 'Kertaa' : 'Aloita'}</span>
                </QuizLink>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
