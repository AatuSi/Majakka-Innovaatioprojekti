import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowTrendUp,
  faAward,
  faCheck,
  faClock,
  faBookOpen,
  faRotateRight,
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons'
import { PASS_RATIO, scoreRatio, summarizeAttempts, useAttemptHistory } from './attemptHistory'
import { card, eyebrow, input, insetPanel, secondaryButton, sectionIntro, sectionTitle } from './profileStyles'

const quizTitle = (name?: string | null) => name ?? 'Nimetön testi'

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('fi-FI', { dateStyle: 'short', timeStyle: 'short' })

const formatDuration = (totalSeconds?: number | null) => {
  if (totalSeconds === null || totalSeconds === undefined) return '–'
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60

  if (mins === 0) return `${secs} s`
  if (secs === 0) return `${mins} min`
  return `${mins} min ${secs} s`
}

export default function ProfileStatsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [visibleCount, setVisibleCount] = useState(5)

  const { history, loading, error } = useAttemptHistory()
  const summary = summarizeAttempts(history)
  const statValue = (value: string) => (loading || error ? '–' : value)

  const improvementValue =
    summary.improvement === null
      ? '–'
      : `${summary.improvement > 0 ? '+' : ''}${summary.improvement}%`

  const filteredHistory = history.filter((item) => {
    return quizTitle(item.quiz_name).toLowerCase().includes(searchTerm.toLowerCase())
  })

  const emptyMessage = loading
    ? 'Ladataan suorituksia...'
    : (error ?? (history.length === 0 ? 'Ei vielä suorituksia.' : 'Ei hakuehtoja vastaavia suorituksia.'))

  const displayedHistory = filteredHistory.slice(0, visibleCount)


  const summaryCards = [
    {
      icon: faBookOpen,
      tag: 'Suoritukset',
      title: 'Loistotehtäviä suoritettu',
      value: statValue(`${summary.completed}`),
      hint: 'Kaikki suoritukset, uusintakerrat mukaan lukien',
    },
    {
      icon: faAward,
      tag: 'Pisteet',
      title: 'Keskimääräinen pisteytys',
      value: statValue(`${summary.accuracy}%`),
      hint: 'Keskiarvo kaikista vastauksista',
    },
    {
      icon: faCheck,
      tag: 'Läpäisy',
      title: 'Läpäisyprosentti',
      value: statValue(`${summary.passRate}%`),
      hint: 'Läpäisyvaatimus ≥ 70%',
    },
    {
      icon: faClock,
      tag: 'Aika',
      title: 'Harjoitteluaika',
      value: statValue(`${Math.round(summary.totalSeconds / 60)} min`),
      hint: 'Loistotestien kokonaisaika',
    },
    {
      icon: faArrowTrendUp,
      tag: 'Kehitys',
      title: 'Kehitys',
      value: statValue(improvementValue),
      hint: 'Ensimmäisestä suorituksesta viimeisimpään, uusituissa testeissä',
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <span className={eyebrow}>Edistyminen</span>
        <h2 className={`mt-1 ${sectionTitle}`}>Tilastot</h2>
        <p className={sectionIntro}>Seuraa loistotestien tuloksia, oppimisen etenemistä sekä aihealueita.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {summaryCards.map((item) => (
          <div
            key={item.title}
            className={`${card} flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[#1D90F4]/60`}
          >
            <div className="relative flex h-24 items-center justify-center border-b border-[#2A3548]/40 bg-[#0F1724]">
              <span className="absolute top-3 left-3 text-[10px] uppercase text-[#718096]">{item.tag}</span>
              <span className="text-4xl font-light text-white">{item.value}</span>
            </div>
            <div className="flex flex-1 items-start gap-3 p-5">
              <FontAwesomeIcon icon={item.icon} className="mt-1 text-sm text-[#38bdf8]" fixedWidth />
              <div>
                <h3 className="text-base font-light text-[#1D90F4]">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-[#9fb0c7]">{item.hint}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className={`${card} p-6 sm:p-8`}>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-light text-white">Kaikki suoritukset</h3>
            <span className="rounded-full border border-[#2A3548] bg-[#0F1724] px-2.5 py-0.5 text-xs text-[#9fb0c7]">
              {filteredHistory.length}
            </span>
          </div>
          <div className="relative w-full sm:w-72">
            <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sm text-[#718096]">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </span>
            <input
              type="text"
              placeholder="Etsi testin nimellä..."
              aria-label="Etsi testin nimellä"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${input} pl-11`}
            />
          </div>
        </div>

        <div className={`${insetPanel} overflow-x-auto`}>
          <table className="w-full text-left text-sm text-[#c3cddb]">
            <thead className="border-b border-[#2A3548] text-[11px] uppercase tracking-widest text-[#718096]">
              <tr>
                <th className="px-5 py-3 font-normal">Testit</th>
                <th className="px-5 py-3 font-normal">Ajankohta</th>
                <th className="px-5 py-3 font-normal">Tulos</th>
                <th className="px-5 py-3 font-normal">Kesto</th>
                <th className="px-5 py-3 text-right font-normal">Toiminto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A3548]/50">
              {displayedHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center font-light text-[#9fb0c7]">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                displayedHistory.map((quiz) => (
                  <tr key={quiz.id} className="transition-colors hover:bg-[#1D90F4]/5">
                    <td className="px-5 py-4 font-medium text-white">{quizTitle(quiz.quiz_name)}</td>
                    <td className="whitespace-nowrap px-5 py-4 font-light">{formatDate(quiz.completed_at)}</td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          scoreRatio(quiz) >= PASS_RATIO
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                            : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                        }`}
                      >
                        {quiz.score}/{quiz.total_questions}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-light">{formatDuration(quiz.duration_seconds)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <Link
                        to={quiz.quiz_name === 'IALA-tietovisa' ? '/IALA-quiz' : '/COLREG-quiz'}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D90F4] underline-offset-4 transition hover:underline cursor-pointer"
                      >
                        <FontAwesomeIcon icon={faRotateRight} className="text-[10px]" />
                        <span>Kertaa</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {visibleCount < filteredHistory.length && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 5)}
              className={secondaryButton}
            >
              Näytä lisää
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
