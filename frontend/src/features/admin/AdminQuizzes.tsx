import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faClipboardList,
  faRotateRight,
  faMagnifyingGlass,
  faCheckCircle,
  faCircleQuestion,
  faTriangleExclamation,
  faChartLine,
  faLayerGroup,
} from '@fortawesome/free-solid-svg-icons'
import ToastContainer from '../../components/Toast'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { getApiErrorMessage } from '../../api/errors'
import { getAccessToken } from '../../api/config'

interface ToastMessage {
  id: number
  message: string
  color: string
  icon: IconDefinition
  duration: number
}

interface QuizOptionRecord {
  id: string
  text?: string | null
  option_text?: string | null
  is_correct: boolean
}

interface QuizQuestionRecord {
  id: string
  prompt?: string | null
  question_text?: string | null
  text?: string | null
  options?: QuizOptionRecord[]
}

interface QuizRecord {
  id: string
  name?: string | null
  description?: string | null
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
  quiz_id?: string | null
  score?: number | null
  max_score?: number | null
  responses?: QuizResponseRecord[]
}

const getQuestionTitle = (q: QuizQuestionRecord, index: number): string =>
  q.prompt || q.question_text || q.text || `Kysymys ${index + 1}`

const getOptionLabel = (opt: QuizOptionRecord, index: number): string =>
  opt.text || opt.option_text || `Vaihtoehto ${index + 1}`

function useCountUp(endValue: number, duration: number = 900, triggerKey: number = 0) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number | null = null
    let animationFrameId: number

    const updateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)

      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setCount(easeOutQuart * endValue)

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCount)
      }
    }

    animationFrameId = requestAnimationFrame(updateCount)

    return () => cancelAnimationFrame(animationFrameId)
  }, [endValue, duration, triggerKey])

  return count
}

function QuizSummaryCard({
  label,
  rawValue,
  isFloat = false,
  suffix = '',
  isLoading,
  animationKey,
  icon,
}: {
  label: string
  rawValue: number
  isFloat?: boolean
  suffix?: string
  isLoading: boolean
  animationKey: number
  icon: IconDefinition
}) {
  const animated = useCountUp(isLoading ? 0 : rawValue, 900, animationKey)

  const formattedValue = isLoading
    ? '...'
    : isFloat
      ? `${animated.toFixed(1)}${suffix}`
      : `${Math.round(animated).toLocaleString('fi-FI')}${suffix}`

  return (
    <div className="flex items-center justify-between rounded-[14px] border border-[#2A374B] bg-[#1E2839] p-4 shadow-xl transition hover:border-[#1d90f4]/50">
      <div>
        <span className="text-xs text-[#718096]">{label}</span>
        <div className="mt-1 text-xl font-bold text-white">{formattedValue}</div>
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1d90f4]/15 text-[#38bdf8]">
        <FontAwesomeIcon icon={icon} />
      </div>
    </div>
  )
}

const themedScrollClass =
  'pr-1.5 [scrollbar-width:thin] [scrollbar-color:#2A374B_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#131B27]/60 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border [&::-webkit-scrollbar-thumb]:border-[#1E2839] [&::-webkit-scrollbar-thumb]:bg-[#2A374B] hover:[&::-webkit-scrollbar-thumb]:bg-[#38bdf8]/60'

export default function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState<QuizRecord[]>([])
  const [attempts, setAttempts] = useState<QuizAttemptRecord[]>([])
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({})

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

  const loadQuizzesData = useCallback(
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

      try {
        const [quizzesRes, attemptsRes] = await Promise.all([
          fetch(`${baseUrl}/quizzes`, { headers }).catch(() => null),
          fetch(`${baseUrl}/quiz-attempts`, { headers }).catch(() => null),
        ])

        if (!checkMounted()) return

        const rawQuizzes: QuizRecord[] = quizzesRes?.ok ? await quizzesRes.json() : []
        const rawAttempts: QuizAttemptRecord[] = attemptsRes?.ok ? await attemptsRes.json() : []

        const enrichedQuizzes = await Promise.all(
          (Array.isArray(rawQuizzes) ? rawQuizzes : []).map(async (quiz) => {
            const hasQuestionsWithOptions =
              Array.isArray(quiz.questions) &&
              quiz.questions.every((q) => Array.isArray(q.options))
            if (hasQuestionsWithOptions) return quiz

            try {
              const detailRes = await fetch(`${baseUrl}/quizzes/${quiz.id}`, { headers })
              if (detailRes.ok) {
                const detail = (await detailRes.json()) as QuizRecord
                return { ...quiz, ...detail }
              }
            } catch {
            }
            return quiz
          })
        )

        if (!checkMounted()) return

        const safeQuizzes = Array.isArray(enrichedQuizzes) ? enrichedQuizzes : []
        setQuizzes(safeQuizzes)
        setAttempts(Array.isArray(rawAttempts) ? rawAttempts : [])
        setSelectedQuizId((prev) => {
          if (prev && safeQuizzes.some((q) => q.id === prev)) return prev
          return safeQuizzes[0]?.id ?? null
        })

        setAnimationKey((k) => k + 1)
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
    void loadQuizzesData({ isMounted: () => isMounted })
    return () => {
      isMounted = false
    }
  }, [loadQuizzesData])

  const quizzesById = useMemo(() => {
    const map: Record<string, QuizRecord> = {}
    for (const q of quizzes) {
      if (q.id) map[q.id] = q
    }
    return map
  }, [quizzes])

  const optionsCorrectness: Record<string, boolean> = useMemo(() => {
    const map: Record<string, boolean> = {}
    for (const quiz of quizzes) {
      for (const q of quiz.questions ?? []) {
        for (const opt of q.options ?? []) {
          if (opt.id) map[opt.id] = Boolean(opt.is_correct)
        }
      }
    }
    return map
  }, [quizzes])

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

  const quizStatsById = useMemo(() => {
    const statsMap: Record<string, { attemptsCount: number; avgAccuracy: number | null }> = {}

    for (const quiz of quizzes) {
      const quizAttempts = attempts.filter((a) => a.quiz_id === quiz.id)
      const qCount = Array.isArray(quiz.questions) ? quiz.questions.length : 0
      const accuracies = quizAttempts
        .map((att) => getAttemptAccuracy(att, qCount))
        .filter((v): v is number => typeof v === 'number')

      statsMap[quiz.id] = {
        attemptsCount: quizAttempts.length,
        avgAccuracy:
          accuracies.length > 0
            ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length
            : null,
      }
    }

    return statsMap
  }, [quizzes, attempts, getAttemptAccuracy])

  const overallAccuracy = useMemo(() => {
    const allAttemptAccuracies = attempts
      .map((att) => {
        const qCount = att.quiz_id
          ? Array.isArray(quizzesById[att.quiz_id]?.questions)
            ? quizzesById[att.quiz_id].questions!.length
            : 0
          : 0
        return getAttemptAccuracy(att, qCount)
      })
      .filter((v): v is number => typeof v === 'number')

    if (allAttemptAccuracies.length === 0) return 0
    return allAttemptAccuracies.reduce((a, b) => a + b, 0) / allAttemptAccuracies.length
  }, [attempts, quizzesById, getAttemptAccuracy])

  const filteredQuizzes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return quizzes
    return quizzes.filter((quiz) => (quiz.name || '').toLowerCase().includes(q))
  }, [quizzes, searchQuery])

  const selectedQuiz = useMemo(
    () => filteredQuizzes.find((q) => q.id === selectedQuizId) ?? filteredQuizzes[0] ?? null,
    [filteredQuizzes, selectedQuizId]
  )

  const totalQuestionsCount = useMemo(
    () =>
      quizzes.reduce(
        (sum, quiz) => sum + (Array.isArray(quiz.questions) ? quiz.questions.length : 0),
        0
      ),
    [quizzes]
  )

  const scrollToQuestion = (questionId: string) => {
    const el = questionRefs.current[questionId]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }

  const selectedQuestions = selectedQuiz?.questions ?? []

  return (
    <div className="relative flex flex-col gap-6 p-8">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <FontAwesomeIcon icon={faClipboardList} className="text-xl text-[#38bdf8]" />
            <h1 className="text-2xl font-bold text-white">Tietovisat</h1>
          </div>
          <p className="mt-1 text-xs text-[#718096]">
            Tarkastele tietovisojen kysymykset, vastausvaihtoehdot ja suoritusten tarkkuus.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadQuizzesData({ manual: true })}
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <QuizSummaryCard
          label="Tietovisat yhteensä"
          rawValue={quizzes.length}
          isLoading={isInitialLoading}
          animationKey={animationKey}
          icon={faLayerGroup}
        />

        <QuizSummaryCard
          label="Kysymyksiä yhteensä"
          rawValue={totalQuestionsCount}
          isLoading={isInitialLoading}
          animationKey={animationKey}
          icon={faCircleQuestion}
        />

        <QuizSummaryCard
          label="Keskimääräinen tarkkuus"
          rawValue={overallAccuracy}
          isFloat
          suffix="%"
          isLoading={isInitialLoading}
          animationKey={animationKey}
          icon={faChartLine}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="flex max-h-[680px] flex-col rounded-[16px] border border-[#2A374B] bg-[#1E2839] p-5 shadow-2xl lg:col-span-1">
          <div className="relative mb-4 shrink-0">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs text-[#718096]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hae tietovisaa..."
              className="w-full rounded-lg border border-[#2A374B] bg-[#182130] py-2 pr-3 pl-8 text-xs text-white placeholder-[#718096] outline-none focus:border-[#1d90f4]"
            />
          </div>

          <div className={`flex flex-col gap-2.5 overflow-y-auto ${themedScrollClass}`}>
            {isInitialLoading ? (
              <div className="rounded-xl border border-[#2A374B] bg-[#131B27]/80 p-4 text-center text-xs text-[#38bdf8]">
                Ladataan tietovisoja...
              </div>
            ) : filteredQuizzes.length === 0 ? (
              <div className="rounded-xl border border-[#2A374B] bg-[#131B27]/80 p-4 text-center text-xs text-[#718096]">
                Tietovisoja ei löytynyt.
              </div>
            ) : (
              filteredQuizzes.map((quiz) => {
                const isSelected = selectedQuiz?.id === quiz.id
                const qCount = Array.isArray(quiz.questions) ? quiz.questions.length : 0
                const st = quizStatsById[quiz.id] ?? { attemptsCount: 0, avgAccuracy: null }

                return (
                  <button
                    key={quiz.id}
                    type="button"
                    onClick={() => setSelectedQuizId(quiz.id)}
                    className={`flex w-full cursor-pointer flex-col gap-1.5 rounded-xl border p-3.5 text-left transition ${
                      isSelected
                        ? 'border-[#1d90f4] bg-[#182130]'
                        : 'border-[#2A374B] bg-[#131B27]/70 hover:border-[#1d90f4]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-semibold text-white">
                        {quiz.name || 'Nimetön tietovisa'}
                      </span>
                      <span className="shrink-0 rounded-md border border-[#2A374B] bg-[#1E2839] px-2 py-0.5 text-[10px] text-[#38bdf8]">
                        {qCount} kys.
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#718096]">
                      <span>{st.attemptsCount} suoritusta</span>
                      <span>
                        {st.avgAccuracy !== null ? `${st.avgAccuracy.toFixed(0)}% tarkkuus` : '—'}
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </section>

        <section className="flex max-h-[680px] flex-col rounded-[16px] border border-[#2A374B] bg-[#1E2839] p-6 shadow-2xl lg:col-span-2">
          {!selectedQuiz ? (
            <div className="flex h-60 items-center justify-center rounded-xl border border-[#2A374B] bg-[#131B27]/60 text-xs text-[#718096]">
              Valitse tietovisa vasemmalta tarkastellaksesi kysymyksiä.
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <div className="shrink-0 border-b border-[#2A374B]/70 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="m-0 text-base font-semibold text-white">
                    {selectedQuiz.name || 'Nimetön tietovisa'}
                  </h2>
                  <span className="text-[11px] text-[#718096]">
                    {selectedQuestions.length} kysymystä
                  </span>
                </div>

                {selectedQuiz.description && (
                  <p className="mt-1 text-xs text-[#718096]">{selectedQuiz.description}</p>
                )}

                {selectedQuestions.length > 1 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selectedQuestions.map((q, idx) => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => scrollToQuestion(q.id)}
                        className="cursor-pointer rounded-md border border-[#2A374B] bg-[#182130] px-2 py-1 text-[10px] font-medium text-[#94a3b8] transition hover:border-[#1d90f4] hover:text-white"
                      >
                        #{idx + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedQuestions.length === 0 ? (
                <div className="rounded-xl border border-[#2A374B] bg-[#131B27]/60 p-4 text-xs text-[#718096]">
                  Tässä tietovisassa ei ole kysymyksiä tai kysymyksiä ei palautettu.
                </div>
              ) : (
                <div className={`flex flex-col gap-3 overflow-y-auto ${themedScrollClass}`}>
                  {selectedQuestions.map((q, qIdx) => (
                    <div
                      key={q.id}
                      ref={(el) => {
                        questionRefs.current[q.id] = el
                      }}
                      className="rounded-xl border border-[#2A374B] bg-[#131B27]/80 p-4"
                    >
                      <div className="mb-2.5 text-xs font-semibold text-white">
                        {qIdx + 1}. {getQuestionTitle(q, qIdx)}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        {(q.options ?? []).map((opt, oIdx) => (
                          <div
                            key={opt.id}
                            className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                              opt.is_correct
                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                                : 'border-[#2A374B]/70 bg-[#182130]/70 text-[#94a3b8]'
                            }`}
                          >
                            <span>{getOptionLabel(opt, oIdx)}</span>
                            {opt.is_correct && (
                              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                                <FontAwesomeIcon icon={faCheckCircle} />
                                <span>Oikea</span>
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}