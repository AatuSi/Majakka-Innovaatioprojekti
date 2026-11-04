import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faAward,
  faCheck,
  faClock,
  faBookOpen,
  faRotateRight,
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons'

const mockQuizHistoryData = [
  {
    id: '1',
    title: 'Testi 1',
    date: '22.10.2026, 14:00',
    score: 10,
    totalQuestions: 10,
    duration: 270,
  },
  {
    id: '2',
    title: 'Testi 2',
    date: '22.10.2026, 14:00',
    score: 10,
    totalQuestions: 10,
    duration: 315,
  },
  {
    id: '3',
    title: 'Testi 3',
    date: '22.10.2026, 14:00',
    score: 10,
    totalQuestions: 10,
    duration: 180,
  },
  {
    id: '4',
    title: 'Testi 4',
    date: '22.10.2026, 14:00',
    score: 10,
    totalQuestions: 10,
    duration: 360,
  },
  {
    id: '5',
    title: 'Testi 5',
    date: '22.10.2026, 14:00',
    score: 10,
    totalQuestions: 10,
    duration: 245,
  },
  {
    id: '6',
    title: 'Testi 6',
    date: '22.10.2026, 14:00',
    score: 10,
    totalQuestions: 10,
    duration: 125,
  },
]

const formatDuration = (totalSeconds: number) => {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60

  if (mins === 0) return `${secs} s`
  if (secs === 0) return `${mins} min`
  return `${mins} min ${secs} s`
}

export default function ProfileStatsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [visibleCount, setVisibleCount] = useState(5)

  const totalCompleted = mockQuizHistoryData.length

  const totalScore = mockQuizHistoryData.reduce((acc, curr) => acc + curr.score, 0)
  const totalPossible = mockQuizHistoryData.reduce((acc, curr) => acc + curr.totalQuestions, 0)
  const avgScore = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0

  const passRate = Math.round((mockQuizHistoryData.filter((item) => item.score / item.totalQuestions >= 0.7).length / totalCompleted) * 100)

  const totalSeconds = mockQuizHistoryData.reduce((acc, curr) => acc + curr.duration, 0)
  const totalMinutes = Math.round(totalSeconds / 60)

  const filteredHistory = mockQuizHistoryData.filter((item) => {
    return item.title.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const displayedHistory = filteredHistory.slice(0, visibleCount)

  return (
    <main className="mx-auto w-full max-w-[1350px] p-8">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-white">Tilastot</h1>
          <p className="mt-1 text-xs text-[#718096]">
            Seuraa loistotestien tuloksia, oppimisen etenemistä sekä aihealueita.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col justify-between rounded-xl border border-[#2A374B] bg-[#1E2839] p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-[#8B9BB4]">Loistotehtäviä suoritettu</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#1d90f4]/20 bg-[#1d90f4]/10 text-[#38bdf8]">
                <FontAwesomeIcon icon={faBookOpen} className="text-xs" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold tracking-tight text-white">{totalCompleted}</div>
              <div className="mt-1 text-[11px] text-[#718096]">Yhteensä tallennettuja loistotestejä</div>
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-xl border border-[#2A374B] bg-[#1E2839] p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-[#8B9BB4]">Keskimääräinen pisteytys</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#1d90f4]/20 bg-[#1d90f4]/10 text-[#38bdf8]">
                <FontAwesomeIcon icon={faAward} className="text-xs" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold tracking-tight text-white">{avgScore}%</div>
              <div className="mt-1 text-[11px] text-[#718096]">Keskiarvo kaikista vastauksista</div>
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-xl border border-[#2A374B] bg-[#1E2839] p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-[#8B9BB4]">Läpäisyprosentti</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#1d90f4]/20 bg-[#1d90f4]/10 text-[#38bdf8]">
                <FontAwesomeIcon icon={faCheck} className="text-xs" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold tracking-tight text-white">{passRate}%</div>
              <div className="mt-1 text-[11px] text-[#718096]">Läpäisyvaatimus ≥ 70%</div>
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-xl border border-[#2A374B] bg-[#1E2839] p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-[#8B9BB4]">Harjoitteluaika</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#1d90f4]/20 bg-[#1d90f4]/10 text-[#38bdf8]">
                <FontAwesomeIcon icon={faClock} className="text-xs" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold tracking-tight text-white">{totalMinutes} min</div>
              <div className="mt-1 text-[11px] text-[#718096]">Loistotestien kokonaisaika</div>
            </div>
          </div>
        </div>
        <section className="rounded-[14px] border border-[#2A374B] bg-[#1E2839] p-6 shadow-2xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#2A374B] pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-semibold text-white">Kaikki suoritukset</h2>
              <span className="flex items-center rounded-full bg-[#131B27] px-2.5 py-0.5 text-[10px] font-semibold text-[#8B9BB4] border border-[#2A374B]">
                {filteredHistory.length}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-64">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs text-[#718096]">
                  <FontAwesomeIcon icon={faMagnifyingGlass} />
                </span>
                <input
                  type="text"
                  placeholder="Etsi testin nimellä..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-md border border-[#2A374B] bg-[#131B27] py-2 pr-3.5 pl-9 text-xs text-white outline-none transition focus:border-[#1d90f4]"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#e2e8f0]">
              <thead className="border-b border-[#2A374B] text-[10px] font-semibold uppercase tracking-wider text-[#718096]">
                <tr>
                  <th className="pb-2.5">Testit</th>
                  <th className="pb-2.5">Ajankohta</th>
                  <th className="pb-2.5">Tulos</th>
                  <th className="pb-2.5">Kesto</th>
                  <th className="pb-2.5 text-right">Toiminto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A374B]/50">
                {displayedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-[#718096]">
                      Ei hakuehtoja vastaavia suorituksia.
                    </td>
                  </tr>
                ) : (
                  displayedHistory.map((quiz) => (
                    <tr key={quiz.id} className="transition-colors hover:bg-white/[0.02]">
                      <td className="py-3.5">
                        <div className="font-semibold text-white">{quiz.title}</div>
                      </td>
                      <td className="py-3.5 text-[#8B9BB4] whitespace-nowrap">{quiz.date}</td>
                      <td className="py-3.5 whitespace-nowrap font-semibold text-white">
                        {quiz.score}/{quiz.totalQuestions}
                      </td>
                      <td className="py-3.5 text-[#8B9BB4] whitespace-nowrap">
                        {formatDuration(quiz.duration)}
                      </td>
                      <td className="py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-sm border border-[#2A374B] bg-[#131B27] px-2.5 py-1 text-[11px] font-medium text-slate-300 transition hover:border-[#1d90f4] hover:text-white cursor-pointer"
                        >
                          <FontAwesomeIcon icon={faRotateRight} className="text-[10px] text-[#718096]" />
                          <span>Kertaa</span>
                        </button>
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
                className="rounded-sm border border-[#2A374B] bg-[#131B27] px-5 py-2 text-xs font-semibold text-white transition hover:border-[#1d90f4] hover:bg-[#1d90f4]/10 cursor-pointer"
              >
                Näytä lisää
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
