import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUsers,
  faClipboardList,
  faChartLine,
  faLayerGroup,
  faTriangleExclamation,
  faCalendarDays,
  faFilter,
  faAward,
  faUserPlus,
  faRotateRight,
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
  username?: string | null
  first_name?: string | null
  last_name?: string | null
  role?: string | null
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
  created_at?: string | null
  questions?: QuizQuestionRecord[]
}

interface QuizResponseRecord {
  id: string
  question_id: string
  selected_option_id: string
}

interface QuizAttemptRecord {
  id: string
  user_id?: string | null
  quiz_id?: string | null
  score?: number | null
  max_score?: number | null
  completed_at?: string | null
  created_at?: string | null
  responses?: QuizResponseRecord[]
}

interface ActivityEventItem {
  id: string
  type: 'attempt' | 'user' | 'quiz'
  title: string
  subtitle: string
  badge?: string
  timestampMs: number
  timeLabel: string
  icon: IconDefinition
  iconClass: string
}

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatEventTimestamp = (iso?: string | null): { ms: number; label: string } => {
  if (!iso) return { ms: 0, label: '—' }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { ms: 0, label: '—' }
  return {
    ms: d.getTime(),
    label: d.toLocaleString('fi-FI', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}

const formatRoleLabel = (role?: string | null): string => {
  if (role === 'admin') return 'Ylläpitäjä'
  if (role === 'teacher') return 'Opettaja'
  return 'Opiskelija'
}

function useQuickCountUp(endValue: number, duration: number = 700, startPercentage: number = 0.8) {
  const [count, setCount] = useState(endValue * startPercentage)

  useEffect(() => {
    const startValue = endValue * startPercentage
    let startTime: number | null = null
    let animationFrameId: number

    const updateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)

      const easeOutQuad = 1 - (1 - progress) * (1 - progress)
      const current = startValue + (endValue - startValue) * easeOutQuad
      setCount(current)

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCount)
      }
    }

    animationFrameId = requestAnimationFrame(updateCount)

    return () => cancelAnimationFrame(animationFrameId)
  }, [endValue, duration, startPercentage])

  return count
}

function AnimatedStatCard({
  stat,
  isLoading,
}: {
  stat: {
    label: string
    rawValue: number
    isFloat?: boolean
    unit?: string
    change: string
    icon: IconDefinition
  }
  isLoading: boolean
}) {
  const animatedValue = useQuickCountUp(stat.rawValue, 700, 0.3)

  const formattedValue = isLoading
    ? '...'
    : stat.isFloat
      ? animatedValue.toFixed(1) + (stat.unit || '')
      : Math.round(animatedValue).toLocaleString('fi-FI') + (stat.unit || '')

  return (
    <div className="flex flex-col justify-between rounded-[14px] border border-[#2A374B] bg-[#1E2839] p-5 shadow-2xl transition hover:border-[#1d90f4]/50">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#718096]">{stat.label}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1d90f4]/15 text-[#38bdf8]">
          <FontAwesomeIcon icon={stat.icon} />
        </div>
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold text-white">{formattedValue}</div>
        <div className="mt-1 text-xs font-medium text-emerald-400">{stat.change}</div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'tests' | 'users'>('tests')

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

  const [dbMetrics, setDbMetrics] = useState({
    totalUsers: 0,
    totalQuizAttempts: 0,
    avgAccuracy: 0,
    totalQuizzes: 0,
  })
  const [usersRawData, setUsersRawData] = useState<UserRecord[]>([])
  const [quizzesRawData, setQuizzesRawData] = useState<QuizRecord[]>([])
  const [attemptsRawData, setAttemptsRawData] = useState<QuizAttemptRecord[]>([])
  const [optionsCorrectnessMap, setOptionsCorrectnessMap] = useState<Record<string, boolean>>({})
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

  const fetchDashboardData = useCallback(
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
        const rawQuizzesList = quizzesRes?.ok
          ? ((await quizzesRes.json()) as QuizRecord[])
          : []
        const rawAttemptsList = attemptsRes?.ok
          ? ((await attemptsRes.json()) as QuizAttemptRecord[])
          : []

        const quizzesList = Array.isArray(rawQuizzesList)
          ? await enrichQuizzes(rawQuizzesList)
          : []
        const attemptsList = Array.isArray(rawAttemptsList)
          ? await enrichAttempts(rawAttemptsList)
          : []

        if (!checkMounted()) return

        const quizzesById: Record<string, QuizRecord> = {}
        const optionsCorrectnessById: Record<string, boolean> = {}

        for (const quiz of quizzesList) {
          if (quiz.id) quizzesById[quiz.id] = quiz
          for (const q of quiz.questions ?? []) {
            for (const opt of q.options ?? []) {
              if (opt.id) optionsCorrectnessById[opt.id] = Boolean(opt.is_correct)
            }
          }
        }

        const accuracyPercentages: number[] = []
        for (const attempt of attemptsList) {
          if (
            typeof attempt.score === 'number' &&
            typeof attempt.max_score === 'number' &&
            attempt.max_score > 0
          ) {
            accuracyPercentages.push((attempt.score / attempt.max_score) * 100)
            continue
          }

          const responses = Array.isArray(attempt.responses) ? attempt.responses : []
          const matchedQuiz = attempt.quiz_id ? quizzesById[attempt.quiz_id] : undefined
          const totalQuestions = Array.isArray(matchedQuiz?.questions)
            ? matchedQuiz.questions.length
            : 0
          const denominator = totalQuestions > 0 ? totalQuestions : responses.length

          if (denominator > 0) {
            const correctCount = responses.reduce(
              (acc, r) =>
                optionsCorrectnessById[r.selected_option_id] === true ? acc + 1 : acc,
              0
            )
            accuracyPercentages.push((correctCount / denominator) * 100)
          }
        }

        const avgAccuracy =
          accuracyPercentages.length > 0
            ? accuracyPercentages.reduce((sum, val) => sum + val, 0) / accuracyPercentages.length
            : 0

        setOptionsCorrectnessMap(optionsCorrectnessById)
        setUsersRawData(usersList)
        setQuizzesRawData(quizzesList)
        setAttemptsRawData(attemptsList)
        setDbMetrics({
          totalUsers: usersList.length,
          totalQuizAttempts: attemptsList.length,
          avgAccuracy,
          totalQuizzes: quizzesList.length,
        })

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
      void fetchDashboardData({ isMounted: () => isMounted })
    }, 250)

    return () => {
      isMounted = false
      clearTimeout(handler)
    }
  }, [fetchDashboardData])

  const recentEvents = useMemo<ActivityEventItem[]>(() => {
    const usersById: Record<string, UserRecord> = {}
    for (const u of usersRawData) {
      if (u.id) usersById[u.id] = u
    }

    const quizzesById: Record<string, QuizRecord> = {}
    for (const q of quizzesRawData) {
      if (q.id) quizzesById[q.id] = q
    }

    const events: ActivityEventItem[] = []

    for (const attempt of attemptsRawData) {
      const user = attempt.user_id ? usersById[attempt.user_id] : undefined
      const quiz = attempt.quiz_id ? quizzesById[attempt.quiz_id] : undefined
      const actorName =
        user?.username ||
        [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
        (attempt.user_id ? `Käyttäjä (${attempt.user_id.slice(0, 6)}...)` : 'Tuntematon käyttäjä')
      const quizName = quiz?.name || 'Nimetön tietovisa'

      const responses = Array.isArray(attempt.responses) ? attempt.responses : []
      const qCount = Array.isArray(quiz?.questions) ? quiz.questions.length : 0
      let scoreBadge: string | undefined
      if (typeof attempt.score === 'number') {
        scoreBadge =
          typeof attempt.max_score === 'number'
            ? `${attempt.score}/${attempt.max_score}`
            : `${attempt.score} p`
      } else if (responses.length > 0 || qCount > 0) {
        const correct = responses.reduce(
          (acc, r) => (optionsCorrectnessMap[r.selected_option_id] === true ? acc + 1 : acc),
          0
        )
        const denom = qCount > 0 ? qCount : responses.length
        scoreBadge = `${correct}/${denom}`
      }

      const ts = formatEventTimestamp(attempt.completed_at || attempt.created_at)
      events.push({
        id: `attempt-${attempt.id}`,
        type: 'attempt',
        title: `${actorName} suoritti testin`,
        subtitle: quizName,
        badge: scoreBadge,
        timestampMs: ts.ms,
        timeLabel: ts.label,
        icon: faAward,
        iconClass: 'bg-emerald-500/15 text-emerald-400',
      })
    }

    for (const user of usersRawData) {
      const displayUser =
        user.username ||
        [user.first_name, user.last_name].filter(Boolean).join(' ') ||
        `Käyttäjä (${user.id.slice(0, 6)}...)`
      const ts = formatEventTimestamp(user.created_at)
      events.push({
        id: `user-${user.id}`,
        type: 'user',
        title: `Uusi käyttäjä rekisteröityi`,
        subtitle: displayUser,
        badge: formatRoleLabel(user.role),
        timestampMs: ts.ms,
        timeLabel: ts.label,
        icon: faUserPlus,
        iconClass: 'bg-[#1d90f4]/15 text-[#38bdf8]',
      })
    }

    for (const quiz of quizzesRawData) {
      const ts = formatEventTimestamp(quiz.created_at)
      const qCount = Array.isArray(quiz.questions) ? quiz.questions.length : 0
      events.push({
        id: `quiz-${quiz.id}`,
        type: 'quiz',
        title: `Tietovisa luotu`,
        subtitle: quiz.name || 'Nimetön tietovisa',
        badge: `${qCount} kysymystä`,
        timestampMs: ts.ms,
        timeLabel: ts.label,
        icon: faClipboardList,
        iconClass: 'bg-violet-500/15 text-violet-300',
      })
    }

    return events.sort((a, b) => b.timestampMs - a.timestampMs).slice(0, 5)
  }, [attemptsRawData, usersRawData, quizzesRawData, optionsCorrectnessMap])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const datesRef = useRef({ startDate, endDate })
  useEffect(() => {
    datesRef.current = { startDate, endDate }
  }, [startDate, endDate])

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
      addToast('Alkupäivämäärä ei voi olla tulevaisuudessa.')
      return
    }
    setStartDate(val)
    if (endDate < val) {
      addToast('Loppupäivämäärä ei voi olla aikaisempi kuin alkupäivämäärä.')
    }
  }

  const handleEndDateChange = (val: string) => {
    if (val > todayStr) {
      addToast('Loppupäivämäärä ei voi olla tulevaisuudessa.')
      setEndDate(todayStr)
      return
    }
    setEndDate(val)
    if (val < startDate) {
      addToast('Loppupäivämäärä ei voi olla aikaisempi kuin alkupäivämäärä.')
    }
  }

  const safeEndDate =
    endDate > todayStr ? todayStr : endDate < startDate ? startDate : endDate

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
    const sourceList: { dateStr?: string | null }[] =
      activeTab === 'tests'
        ? attemptsRawData.map((a) => ({ dateStr: a.completed_at || a.created_at }))
        : usersRawData.map((u) => ({ dateStr: u.created_at }))

    const counts: Record<string, number> = {}
    for (const item of sourceList) {
      if (!item.dateStr) continue
      const parsed = new Date(item.dateStr)
      if (Number.isNaN(parsed.getTime())) continue
      const key = formatLocalDate(parsed)
      counts[key] = (counts[key] ?? 0) + 1
    }
    return counts
  }, [activeTab, attemptsRawData, usersRawData])

  const rawPoints = Array.from({ length: pointsCount }).map((_, i) => {
    const currentMs =
      startMs + (isSingleDay ? 0 : (i / (pointsCount - 1 || 1)) * (endMs - startMs))
    const d = new Date(currentMs)
    const dayKey = formatLocalDate(d)
    const dayCount = countsByDayKey[dayKey] ?? 0

    return {
      timestamp: currentMs,
      fullDateStr: `${d.getDate()}. ${d.toLocaleDateString('fi-FI', { month: 'long' })} ${d.getFullYear()}`,
      count: dayCount,
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
    const ticks = []

    for (let i = 0; i < tickCount; i++) {
      const currentMs = startMs + (i / (tickCount - 1)) * (endMs - startMs)
      const d = new Date(currentMs)
      const month = finnishMonthsShort[d.getMonth()]
      const year = d.getFullYear()
      const day = d.getDate()

      const label = totalDays <= 45 ? `${day}. ${month}` : `${month} ${year}`
      ticks.push(label)
    }
    return ticks
  }

  const axisTicks = getAxisTicks()

  const stats = [
    {
      label: 'Rekisteröidyt käyttäjät',
      rawValue: dbMetrics.totalUsers,
      change: 'Kaikki tilit',
      icon: faUsers,
    },
    {
      label: 'Tehdyt testit',
      rawValue: dbMetrics.totalQuizAttempts,
      change: 'Kertyneet suoritukset',
      icon: faClipboardList,
    },
    {
      label: 'Tietovisat',
      rawValue: dbMetrics.totalQuizzes,
      change: 'Julkaistut testit',
      icon: faLayerGroup,
    },
    {
      label: 'Keskimääräinen tarkkuus',
      rawValue: dbMetrics.avgAccuracy,
      isFloat: true,
      unit: '%',
      change: 'Oikeat vastaukset suorituksista',
      icon: faChartLine,
    },
  ]

  return (
    <div className="relative flex flex-col gap-6 p-8">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <FontAwesomeIcon icon={faChartLine} className="text-xl text-[#38bdf8]" />
            <h1 className="text-2xl font-bold text-white">Hallintapaneeli</h1>
          </div>
          <p className="mt-1 text-xs text-[#718096]">
            Yhteenveto rakenteesta ja sisällöstä.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchDashboardData({ manual: true })}
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <AnimatedStatCard key={index} stat={stat} isLoading={isInitialLoading} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="flex flex-col rounded-[16px] border border-[#2A374B] bg-[#1E2839] p-6 shadow-2xl lg:col-span-2">
          <div className="mb-5 flex flex-col justify-between gap-4 border-b border-[#2A374B]/70 pb-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="m-0 text-base font-semibold tracking-wide text-white">
                Aktiivisuustrendi
              </h2>
              <p className="mt-0.5 text-xs text-[#718096]">
                Seuraa kehitystä valitulta aikaväliltä
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex w-fit items-center rounded-lg border border-[#2A374B] bg-[#182130] p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('tests')}
                  className={`flex cursor-pointer items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                    activeTab === 'tests'
                      ? 'bg-[#1d90f4] text-white shadow'
                      : 'text-[#718096] hover:text-white'
                  }`}
                >
                  <FontAwesomeIcon icon={faClipboardList} className="text-[11px]" />
                  <span>Suoritetut testit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className={`flex cursor-pointer items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                    activeTab === 'users'
                      ? 'bg-[#1d90f4] text-white shadow'
                      : 'text-[#718096] hover:text-white'
                  }`}
                >
                  <FontAwesomeIcon icon={faUsers} className="text-[11px]" />
                  <span>Uudet käyttäjät</span>
                </button>
              </div>

              <div className="relative" ref={filterRef}>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen((prev) => !prev)}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#2A374B] bg-[#182130] px-3.5 py-2 text-xs font-medium text-white transition hover:border-[#1d90f4]"
                >
                  <FontAwesomeIcon icon={faCalendarDays} className="text-[#38bdf8]" />
                  <span>{durationLabel}</span>
                  <FontAwesomeIcon
                    icon={faFilter}
                    className="ml-0.5 text-[10px] text-[#718096]"
                  />
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
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-akselin taustaviivat täydellä 100% leveydellä */}
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

                {/* Y-akselin numerot vasemmassa reunassa */}
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
                        fill="url(#lineGradient)"
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
                        fill="url(#lineGradient)"
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
                      {currentData[activePointIndex].count.toLocaleString('fi-FI')}{' '}
                      {activeTab === 'tests' ? 'suoritusta' : 'uutta'}
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

        <section className="flex h-full flex-col justify-between rounded-[16px] border border-[#2A374B] bg-[#1E2839] p-6 shadow-2xl">
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-[#2A374B]/70 pb-4">
              <h2 className="m-0 text-base font-semibold text-white">Viimeisimmät tapahtumat</h2>
            </div>
            <div className="flex flex-col gap-2.5">
              {isInitialLoading ? (
                <div className="rounded-xl border border-[#2A374B] bg-[#131B27]/80 p-4 text-center text-xs text-[#38bdf8]">
                  Ladataan tapahtumia...
                </div>
              ) : recentEvents.length === 0 ? (
                <div className="rounded-xl border border-[#2A374B] bg-[#131B27]/80 p-4 text-center text-xs text-[#718096]">
                  Ei tapahtumia vielä.
                </div>
              ) : (
                recentEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#2A374B] bg-[#131B27]/80 p-2.5 text-xs transition hover:border-[#1d90f4]/40"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${ev.iconClass}`}
                      >
                        <FontAwesomeIcon icon={ev.icon} className="text-[11px]" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-white">{ev.title}</div>
                        <div className="truncate text-[11px] text-[#718096]">{ev.subtitle}</div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-0.5">
                      {ev.badge && (
                        <span className="rounded-md border border-[#2A374B] bg-[#182130] px-2 py-0.5 text-[10px] font-semibold text-[#38bdf8]">
                          {ev.badge}
                        </span>
                      )}
                      <span className="text-[10px] text-[#718096]">{ev.timeLabel}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}