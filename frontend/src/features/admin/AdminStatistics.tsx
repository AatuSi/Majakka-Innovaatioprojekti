import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChartBar,
  faRotateRight,
  faUsers,
  faClipboardList,
  faCalendarDays,
  faFilter,
  faMagnifyingGlass,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import ToastContainer from '../../components/Toast'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { getApiErrorMessage } from '../../api/errors'
import { getAccessToken } from '../../api/config'
import { listUsers } from '../../client'

interface ToastMessage {
  id: number
  message: string
  color: string
  icon: IconDefinition
  duration: number
}

interface UserRecord {
  id: string
  created_at?: string | null
}

interface QuizOptionRecord {
  id: string
  is_correct: boolean
}

interface QuizQuestionRecord {
  id: string
  options?: QuizOptionRecord[]
}

interface QuizRecord {
  id: string
  name?: string | null
  questions?: QuizQuestionRecord[]
}

interface QuizResponseRecord {
  id: string
  question_id: string
  selected_option_id: string
}

interface QuizAttemptRecord {
  id: string
  quiz_id?: string | null
  score?: number | null
  max_score?: number | null
  completed_at?: string | null
  created_at?: string | null
  responses?: QuizResponseRecord[]
}

interface TrendChartSectionProps {
  title: string
  subtitle: string
  unitLabel: string
  icon: IconDefinition
  gradientId: string
  records: { dateStr?: string | null }[]
  isInitialLoading: boolean
  onErrorToast: (msg: string) => void
}

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const finnishMonthsShort = [
  'Tammi',
  'Helmi',
  'Maalis',
  'Huhti',
  'Touko',
  'Kesä',
  'Heinä',
  'Elo',
  'Syys',
  'Loka',
  'Marras',
  'Joulu',
]

function TrendLineChartCard({
  title,
  subtitle,
  unitLabel,
  icon,
  gradientId,
  records,
  isInitialLoading,
  onErrorToast,
}: TrendChartSectionProps) {
  const todayStr = formatLocalDate(new Date())

  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return formatLocalDate(d)
  })
  const [endDate, setEndDate] = useState(() => todayStr)
  const [hoveredTimestamp, setHoveredTimestamp] = useState<number | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const filterRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<HTMLDivElement>(null)
  const mouseRatioRef = useRef<number>(0.5)
  const datesRef = useRef({ startDate, endDate })

  useEffect(() => {
    datesRef.current = { startDate, endDate }
  }, [startDate, endDate])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const chartEl = chartRef.current
    if (!chartEl) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      const start = new Date(datesRef.current.startDate).getTime()
      const end = new Date(datesRef.current.endDate).getTime()
      const currentSpan = end - start
      const currentSpanDays = Math.round(currentSpan / (1000 * 60 * 60 * 24))

      let newDays = currentSpanDays
      if (e.deltaY < 0) {
        if (currentSpanDays > 100) newDays = Math.round(currentSpanDays * 0.75)
        else if (currentSpanDays > 30) newDays = Math.round(currentSpanDays * 0.8)
        else if (currentSpanDays > 5) newDays = currentSpanDays - 3
        else newDays = Math.max(0, currentSpanDays - 1)
      } else {
        if (currentSpanDays >= 100) newDays = Math.round(currentSpanDays * 1.35)
        else if (currentSpanDays >= 30) newDays = Math.round(currentSpanDays * 1.25)
        else if (currentSpanDays >= 5) newDays = currentSpanDays + 3
        else newDays = currentSpanDays + 1
      }

      const maxDays = 10 * 365
      if (newDays > maxDays) newDays = maxDays

      const newSpan = newDays * 24 * 60 * 60 * 1000
      const anchorTime =
        hoveredTimestamp !== null
          ? hoveredTimestamp
          : start + currentSpan * mouseRatioRef.current

      const ratio = mouseRatioRef.current
      let newStart = anchorTime - newSpan * ratio
      let newEnd = anchorTime + newSpan * (1 - ratio)

      const todayMs = new Date().setHours(23, 59, 59, 999)
      if (newEnd > todayMs) {
        newEnd = todayMs
        newStart = newEnd - newSpan
      }

      setStartDate(formatLocalDate(new Date(newStart)))
      setEndDate(formatLocalDate(new Date(newEnd)))
    }

    chartEl.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      chartEl.removeEventListener('wheel', handleWheel)
    }
  }, [hoveredTimestamp])

  const handleStartDateChange = (val: string) => {
    if (val > todayStr) {
      onErrorToast('Alkupäivämäärä ei voi olla tulevaisuudessa.')
      return
    }
    setStartDate(val)
    if (endDate < val) {
      onErrorToast('Loppupäivämäärä ei voi olla aikaisempi kuin alkupäivämäärä.')
    }
  }

  const handleEndDateChange = (val: string) => {
    if (val > todayStr) {
      onErrorToast('Loppupäivämäärä ei voi olla tulevaisuudessa.')
      setEndDate(todayStr)
      return
    }
    setEndDate(val)
    if (val < startDate) {
      onErrorToast('Loppupäivämäärä ei voi olla aikaisempi kuin alkupäivämäärä.')
    }
  }

  const safeEndDate =
    endDate > todayStr ? todayStr : endDate < startDate ? startDate : endDate

  const startMs = new Date(startDate).getTime()
  const endMs = new Date(safeEndDate).getTime()
  const totalDays = Math.max(0, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)))
  const durationLabel = `${totalDays + 1} pv`
  const isSingleDay = totalDays === 0

  const pointsCount = isSingleDay
    ? 1
    : totalDays <= 120
      ? totalDays + 1
      : Math.min(Math.max(totalDays + 1, 2), 150)

  const countsByDayKey = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const item of records) {
      if (!item.dateStr) continue
      const parsed = new Date(item.dateStr)
      if (Number.isNaN(parsed.getTime())) continue
      const key = formatLocalDate(parsed)
      counts[key] = (counts[key] ?? 0) + 1
    }
    return counts
  }, [records])

  const rawPoints = Array.from({ length: pointsCount }).map((_, i) => {
    const currentMs =
      startMs + (isSingleDay ? 0 : (i / (pointsCount - 1 || 1)) * (endMs - startMs))
    const d = new Date(currentMs)
    const dayKey = formatLocalDate(d)

    return {
      timestamp: currentMs,
      fullDateStr: `${d.getDate()}. ${d.toLocaleDateString('fi-FI', { month: 'long' })} ${d.getFullYear()}`,
      count: countsByDayKey[dayKey] ?? 0,
    }
  })

  const maxDataValue = Math.max(...rawPoints.map((p) => p.count), 1)
  const maxCount = Math.max(4, Math.ceil(maxDataValue * 1.5))
  const midCount = Math.round(maxCount / 2)

  const chartXMin = 20
  const chartXMax = 600
  const chartWidth = chartXMax - chartXMin
  const chartYTop = 20
  const chartYBottom = 180
  const chartHeight = chartYBottom - chartYTop

  const currentData = rawPoints.map((item, idx) => ({
    ...item,
    x: isSingleDay ? 300 : chartXMin + (idx / (pointsCount - 1)) * chartWidth,
    y: Math.max(
      chartYTop,
      Math.min(chartYBottom, chartYBottom - (item.count / maxCount) * chartHeight)
    ),
  }))

  const formatYAxisValue = (val: number) => {
    if (val >= 1000) {
      return (val / 1000).toFixed(1).replace('.0', '') + 'k'
    }
    return val.toString()
  }

  const activePointIndex =
    hoveredTimestamp !== null && currentData.length > 0
      ? currentData.reduce((closestIdx, curr, idx, arr) => {
          const prevDiff = Math.abs(arr[closestIdx].timestamp - hoveredTimestamp)
          const currDiff = Math.abs(curr.timestamp - hoveredTimestamp)
          return currDiff < prevDiff ? idx : closestIdx
        }, 0)
      : null

  const getAxisTicks = () => {
    if (isSingleDay) {
      const d = new Date(startMs)
      return [`${d.getDate()}. ${finnishMonthsShort[d.getMonth()]} ${d.getFullYear()}`]
    }
    const tickCount = totalDays > 365 ? 5 : totalDays > 90 ? 4 : 3
    const ticks: string[] = []

    for (let i = 0; i < tickCount; i++) {
      const currentMs = startMs + (i / (tickCount - 1)) * (endMs - startMs)
      const d = new Date(currentMs)
      const month = finnishMonthsShort[d.getMonth()]
      const year = d.getFullYear()
      const day = d.getDate()

      ticks.push(totalDays <= 45 ? `${day}. ${month}` : `${month} ${year}`)
    }
    return ticks
  }

  const axisTicks = getAxisTicks()

  return (
    <section className="flex min-w-0 flex-col rounded-[16px] border border-[#2A374B] bg-[#1E2839] p-6 shadow-2xl">
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-[#2A374B]/70 pb-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1d90f4]/15 text-[#38bdf8]">
            <FontAwesomeIcon icon={icon} />
          </div>
          <div className="min-w-0">
            <h2 className="m-0 truncate text-base font-semibold tracking-wide text-white">
              {title}
            </h2>
            <p className="mt-0.5 truncate text-xs text-[#718096]">{subtitle}</p>
          </div>
        </div>

        <div className="relative shrink-0" ref={filterRef}>
          <button
            type="button"
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#2A374B] bg-[#182130] px-3.5 py-2 text-xs font-medium text-white transition hover:border-[#1d90f4]"
          >
            <FontAwesomeIcon icon={faCalendarDays} className="text-[#38bdf8]" />
            <span>{durationLabel}</span>
            <FontAwesomeIcon icon={faFilter} className="ml-0.5 text-[10px] text-[#718096]" />
          </button>

          {isFilterOpen && (
            <div className="absolute top-full right-0 z-50 mt-2 flex w-72 flex-col gap-3 rounded-xl border border-[#2A374B] bg-[#131B27] p-4 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-[#2A374B] pb-2">
                <span className="text-xs font-semibold text-white">Aikavälin rajaus</span>
                <span className="rounded-md border border-[#1d90f4]/30 bg-[#1d90f4]/15 px-2 py-0.5 text-[10px] font-semibold text-[#38bdf8]">
                  Yhteensä {durationLabel}
                </span>
              </div>

              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-[#718096] uppercase">
                    Alkupäivä:
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    max={todayStr}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full cursor-pointer rounded-lg border border-[#2A374B] bg-[#182130] px-2.5 py-1.5 font-medium text-white outline-none [color-scheme:dark]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-[#718096] uppercase">
                    Loppupäivä (Max tänään):
                  </span>
                  <input
                    type="date"
                    value={endDate}
                    max={todayStr}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full cursor-pointer rounded-lg border border-[#2A374B] bg-[#182130] px-2.5 py-1.5 font-medium text-white outline-none [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        ref={chartRef}
        className="relative flex h-80 w-full flex-col justify-between rounded-xl border border-[#2A374B] bg-[#131B27]/60 p-5 select-none"
        onMouseLeave={() => setHoveredTimestamp(null)}
      >
        {isInitialLoading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#131B27]/80 text-xs font-medium text-[#38bdf8] backdrop-blur-sm">
            Haetaan tietoja tietokannasta...
          </div>
        )}

        <div className="relative h-60 w-full">
          <svg
            className="h-full w-full overflow-visible"
            viewBox="0 0 600 200"
            onMouseMove={(e) => {
              if (currentData.length === 0) return
              const svgElement = e.currentTarget
              const rect = svgElement.getBoundingClientRect()
              const clickX = e.clientX - rect.left
              const percentage = Math.max(0, Math.min(1, clickX / rect.width))
              mouseRatioRef.current = percentage

              if (isSingleDay) {
                setHoveredTimestamp(currentData[0]?.timestamp ?? null)
                return
              }

              const svgX = percentage * 600
              const closest = currentData.reduce(
                (prev, curr) =>
                  Math.abs(curr.x - svgX) < Math.abs(prev.x - svgX) ? curr : prev,
                currentData[0]
              )

              if (closest) {
                setHoveredTimestamp(closest.timestamp)
              }
            }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            <line
              x1={chartXMin}
              y1={chartYBottom}
              x2={chartXMax}
              y2={chartYBottom}
              stroke="#2A374B"
              strokeWidth="1"
            />
            <line
              x1={chartXMin}
              y1={(chartYTop + chartYBottom) / 2}
              x2={chartXMax}
              y2={(chartYTop + chartYBottom) / 2}
              stroke="#2A374B"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <line
              x1={chartXMin}
              y1={chartYTop}
              x2={chartXMax}
              y2={chartYTop}
              stroke="#2A374B"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <line
              x1={chartXMin}
              y1={chartYTop}
              x2={chartXMin}
              y2={chartYBottom}
              stroke="#2A374B"
              strokeWidth="1"
            />

            <text
              x={chartXMin - 6}
              y={chartYBottom + 4}
              textAnchor="end"
              fill="#718096"
              fontSize="10"
              fontFamily="monospace"
            >
              0
            </text>
            <text
              x={chartXMin - 6}
              y={(chartYTop + chartYBottom) / 2 + 4}
              textAnchor="end"
              fill="#718096"
              fontSize="10"
              fontFamily="monospace"
            >
              {formatYAxisValue(midCount)}
            </text>
            <text
              x={chartXMin - 6}
              y={chartYTop + 4}
              textAnchor="end"
              fill="#718096"
              fontSize="10"
              fontFamily="monospace"
            >
              {formatYAxisValue(maxCount)}
            </text>

            {!isInitialLoading &&
              currentData.length > 0 &&
              (isSingleDay ? (
                <g>
                  <path
                    d={`M ${chartXMin} ${chartYBottom} L ${chartXMin} ${currentData[0].y} L ${chartXMax} ${currentData[0].y} L ${chartXMax} ${chartYBottom} Z`}
                    fill={`url(#${gradientId})`}
                  />
                  <path
                    d={`M ${chartXMin} ${currentData[0].y} L ${chartXMax} ${currentData[0].y}`}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="300"
                    cy={currentData[0].y}
                    r="5"
                    className="fill-[#131B27] stroke-[#38bdf8]"
                    strokeWidth="2.5"
                  />
                </g>
              ) : (
                <>
                  <path
                    d={
                      `M ${chartXMin} ${chartYBottom} ` +
                      currentData.map((d) => `L ${d.x} ${d.y}`).join(' ') +
                      ` L ${chartXMax} ${chartYBottom} Z`
                    }
                    fill={`url(#${gradientId})`}
                  />
                  <path
                    d={currentData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${d.x} ${d.y}`).join(' ')}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              ))}

            {activePointIndex !== null && currentData[activePointIndex] && (
              <g>
                <line
                  x1={isSingleDay ? 300 : currentData[activePointIndex].x}
                  y1={chartYTop}
                  x2={isSingleDay ? 300 : currentData[activePointIndex].x}
                  y2={chartYBottom}
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity="0.8"
                />
                <circle
                  cx={isSingleDay ? 300 : currentData[activePointIndex].x}
                  cy={currentData[activePointIndex].y}
                  r="5"
                  className="fill-[#131B27] stroke-[#38bdf8]"
                  strokeWidth="2.5"
                />
              </g>
            )}
          </svg>

          {activePointIndex !== null && currentData[activePointIndex] && (
            <div
              className="pointer-events-none absolute -top-3 z-20 -translate-x-1/2 transform"
              style={{
                left: isSingleDay ? '50%' : `${(currentData[activePointIndex].x / 600) * 100}%`,
              }}
            >
              <div className="rounded-md border border-[#2A374B] bg-[#182130] px-2.5 py-1 text-center whitespace-nowrap shadow-2xl">
                <div className="text-[10px] font-semibold text-white">
                  {currentData[activePointIndex].fullDateStr}
                </div>
                <div className="text-[11px] font-bold text-[#38bdf8]">
                  {currentData[activePointIndex].count.toLocaleString('fi-FI')} {unitLabel}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#2A374B]/50 pt-2 pr-2 pl-6 text-[10px] font-medium text-[#718096]">
          {isSingleDay ? (
            <div className="w-full text-center">
              <span>{axisTicks[0]}</span>
            </div>
          ) : (
            axisTicks.map((tick, index) => <span key={index}>{tick}</span>)
          )}
        </div>
      </div>
    </section>
  )
}

const themedScrollClass =
  'pr-1.5 [scrollbar-width:thin] [scrollbar-color:#2A374B_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#131B27]/60 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border [&::-webkit-scrollbar-thumb]:border-[#1E2839] [&::-webkit-scrollbar-thumb]:bg-[#2A374B] hover:[&::-webkit-scrollbar-thumb]:bg-[#38bdf8]/60'

export default function AdminStatistics() {
  const [usersData, setUsersData] = useState<{ dateStr?: string | null }[]>([])
  const [attemptsData, setAttemptsData] = useState<{ dateStr?: string | null }[]>([])
  const [quizzes, setQuizzes] = useState<QuizRecord[]>([])
  const [attempts, setAttempts] = useState<QuizAttemptRecord[]>([])
  const [optionsCorrectness, setOptionsCorrectness] = useState<Record<string, boolean>>({})
  const [quizSearch, setQuizSearch] = useState('')
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((msg: string) => {
    setToasts((prev) => {
      if (prev.some((t) => t.message === msg)) return prev
      return [
        ...prev,
        {
          id: Date.now() + Math.random(),
          message: msg,
          color: '#f59e0b',
          icon: faTriangleExclamation,
          duration: 6,
        },
      ]
    })
  }, [])

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const fetchStatisticsData = useCallback(
    async (options?: { manual?: boolean; isMounted?: () => boolean }) => {
      const checkMounted = options?.isMounted ?? (() => true)
      if (options?.manual) {
        setIsRefreshing(true)
      }

      const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
      const token = getAccessToken()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }

      const enrichQuizzes = async (rawQuizzes: QuizRecord[]): Promise<QuizRecord[]> => {
        return Promise.all(
          rawQuizzes.map(async (quiz) => {
            const hasOptions =
              Array.isArray(quiz.questions) &&
              quiz.questions.every((q) => Array.isArray(q.options))
            if (hasOptions) return quiz

            try {
              const res = await fetch(`${baseUrl}/quizzes/${quiz.id}`, { headers })
              if (res.ok) {
                const detail = (await res.json()) as QuizRecord
                return { ...quiz, ...detail }
              }
            } catch {
            }
            return quiz
          })
        )
      }

      const enrichAttempts = async (
        rawAttempts: QuizAttemptRecord[]
      ): Promise<QuizAttemptRecord[]> => {
        return Promise.all(
          rawAttempts.map(async (attempt) => {
            if (Array.isArray(attempt.responses)) return attempt
            try {
              const res = await fetch(`${baseUrl}/quiz-attempts/${attempt.id}/responses`, {
                headers,
              })
              if (res.ok) {
                const responses = (await res.json()) as QuizResponseRecord[]
                return { ...attempt, responses: Array.isArray(responses) ? responses : [] }
              }
            } catch {
            }
            return { ...attempt, responses: [] }
          })
        )
      }

      try {
        const [usersResult, quizzesRes, attemptsRes] = await Promise.all([
          listUsers().catch(() => null),
          fetch(`${baseUrl}/quizzes`, { headers }).catch(() => null),
          fetch(`${baseUrl}/quiz-attempts`, { headers }).catch(() => null),
        ])

        if (!checkMounted()) return

        const usersList = Array.isArray(usersResult?.data)
          ? (usersResult.data as UserRecord[])
          : []
        const rawQuizzesList: QuizRecord[] = quizzesRes?.ok
          ? ((await quizzesRes.json()) as QuizRecord[])
          : []
        const rawAttemptsList: QuizAttemptRecord[] = attemptsRes?.ok
          ? ((await attemptsRes.json()) as QuizAttemptRecord[])
          : []

        const quizzesList = Array.isArray(rawQuizzesList)
          ? await enrichQuizzes(rawQuizzesList)
          : []
        const attemptsList = Array.isArray(rawAttemptsList)
          ? await enrichAttempts(rawAttemptsList)
          : []

        if (!checkMounted()) return

        const correctnessMap: Record<string, boolean> = {}
        for (const quiz of quizzesList) {
          for (const q of quiz.questions ?? []) {
            for (const opt of q.options ?? []) {
              if (opt.id) correctnessMap[opt.id] = Boolean(opt.is_correct)
            }
          }
        }

        setUsersData(usersList.map((u) => ({ dateStr: u.created_at })))
        setAttemptsData(
          attemptsList.map((a) => ({ dateStr: a.completed_at || a.created_at }))
        )
        setQuizzes(quizzesList)
        setAttempts(attemptsList)
        setOptionsCorrectness(correctnessMap)

        setIsInitialLoading(false)
        if (options?.manual) {
          setIsRefreshing(false)
        }
      } catch (err) {
        if (!checkMounted()) return
        setIsInitialLoading(false)
        if (options?.manual) {
          setIsRefreshing(false)
        }
        addToast(getApiErrorMessage(err))
      }
    },
    [addToast]
  )

  useEffect(() => {
    let isMounted = true
    const handler = setTimeout(() => {
      void fetchStatisticsData({ isMounted: () => isMounted })
    }, 250)

    return () => {
      isMounted = false
      clearTimeout(handler)
    }
  }, [fetchStatisticsData])

  const getAttemptAccuracy = useCallback(
    (att: QuizAttemptRecord, fallbackQuestionCount: number): number | null => {
      if (
        typeof att.score === 'number' &&
        typeof att.max_score === 'number' &&
        att.max_score > 0
      ) {
        return (att.score / att.max_score) * 100
      }

      const responses = Array.isArray(att.responses) ? att.responses : []
      const denom = fallbackQuestionCount > 0 ? fallbackQuestionCount : responses.length
      if (denom <= 0) return null

      const correct = responses.reduce(
        (sum, r) => (optionsCorrectness[r.selected_option_id] === true ? sum + 1 : sum),
        0
      )
      return (correct / denom) * 100
    },
    [optionsCorrectness]
  )

  const quizBreakdown = useMemo(() => {
    const qFilter = quizSearch.trim().toLowerCase()
    return quizzes
      .filter((quiz) => !qFilter || (quiz.name || '').toLowerCase().includes(qFilter))
      .map((quiz) => {
        const quizAttempts = attempts.filter((a) => a.quiz_id === quiz.id)
        const qCount = Array.isArray(quiz.questions) ? quiz.questions.length : 0
        const accuracies = quizAttempts
          .map((att) => getAttemptAccuracy(att, qCount))
          .filter((v): v is number => typeof v === 'number')

        const avgAccuracy =
          accuracies.length > 0
            ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length
            : null

        return {
          id: quiz.id,
          name: quiz.name || 'Nimetön tietovisa',
          questionCount: qCount,
          attemptsCount: quizAttempts.length,
          avgAccuracy,
        }
      })
      .sort((a, b) => b.attemptsCount - a.attemptsCount)
  }, [quizzes, attempts, quizSearch, getAttemptAccuracy])

  return (
    <div className="relative flex flex-col gap-6 p-8">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <FontAwesomeIcon icon={faChartBar} className="text-xl text-[#38bdf8]" />
            <h1 className="text-2xl font-bold text-white">Tilastot</h1>
          </div>
          <p className="mt-1 text-xs text-[#718096]">
            Rekisteröityneiden käyttäjien ja suoritusten aikasarjat sekä visakohtainen vertailu.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchStatisticsData({ manual: true })}
          disabled={isRefreshing || isInitialLoading}
          className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-[#2A374B] bg-[#182130] px-3.5 py-2 text-xs font-medium text-white transition hover:border-[#1d90f4] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FontAwesomeIcon
            icon={faRotateRight}
            className={`text-xs text-[#38bdf8] ${isRefreshing ? 'fa-spin' : ''}`}
          />
          <span>{isRefreshing ? 'Päivitetään...' : 'Päivitä'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TrendLineChartCard
          title="Rekisteröidyt käyttäjät"
          subtitle="Uusien käyttäjätilien kertyminen valitulta aikaväliltä"
          unitLabel="uutta"
          icon={faUsers}
          gradientId="statsUsersGradient"
          records={usersData}
          isInitialLoading={isInitialLoading}
          onErrorToast={addToast}
        />

        <TrendLineChartCard
          title="Suoritukset"
          subtitle="Tehtyjen tietovisasuoritusten kehitys valitulta aikaväliltä"
          unitLabel="suoritusta"
          icon={faClipboardList}
          gradientId="statsAttemptsGradient"
          records={attemptsData}
          isInitialLoading={isInitialLoading}
          onErrorToast={addToast}
        />
      </div>

      <section className="flex max-h-[500px] flex-col rounded-[16px] border border-[#2A374B] bg-[#1E2839] p-6 shadow-2xl">
        <div className="mb-4 flex flex-col justify-between gap-3 border-b border-[#2A374B]/70 pb-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="m-0 text-base font-semibold text-white">
              Visakohtainen tarkkuus ja suoritukset
            </h2>
            <p className="mt-0.5 text-xs text-[#718096]">
              Vertaa tietovisojen suoritusten määrää ja keskimääräistä onnistumisprosenttia
            </p>
          </div>

          <div className="relative">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs text-[#718096]"
            />
            <input
              type="text"
              value={quizSearch}
              onChange={(e) => setQuizSearch(e.target.value)}
              placeholder="Suodata tietovisa..."
              className="w-56 rounded-lg border border-[#2A374B] bg-[#182130] py-1.5 pr-3 pl-8 text-xs text-white placeholder-[#718096] outline-none focus:border-[#1d90f4]"
            />
          </div>
        </div>

        <div className={`flex flex-col gap-3 overflow-y-auto ${themedScrollClass}`}>
          {isInitialLoading ? (
            <div className="rounded-xl border border-[#2A374B] bg-[#131B27]/80 p-4 text-center text-xs text-[#38bdf8]">
              Lasketaan visakohtaisia tilastoja...
            </div>
          ) : quizBreakdown.length === 0 ? (
            <div className="rounded-xl border border-[#2A374B] bg-[#131B27]/80 p-4 text-center text-xs text-[#718096]">
              Ei tietovisoja näytettäväksi.
            </div>
          ) : (
            quizBreakdown.map((item) => {
              const widthPercent =
                item.avgAccuracy !== null ? Math.max(0, Math.min(100, item.avgAccuracy)) : 0

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-[#2A374B] bg-[#131B27]/80 p-4"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-white">{item.name}</span>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-[#718096]">
                        {item.attemptsCount} suoritusta · {item.questionCount} kysymyksiä
                      </span>
                      <span className="font-semibold text-[#38bdf8]">
                        {item.avgAccuracy !== null ? `${item.avgAccuracy.toFixed(1)}%` : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#182130]">
                    <div
                      className="h-full rounded-full bg-[#38bdf8] transition-all duration-500"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}