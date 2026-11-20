import { useState, useEffect, useMemo, useRef, type SubmitEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faDatabase,
  faUsers,
  faLightbulb,
  faClipboardList,
  faAward,
  faMagnifyingGlass,
  faTrash,
  faPenToSquare,
  faPlus,
  faRotateRight,
  faTriangleExclamation,
  faCircleCheck,
  faXmark,
  faChevronDown,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import ToastContainer from '../../components/Toast'
import { getApiErrorMessage } from '../../api/errors'
import { getAccessToken } from '../../api/config'
import { logoutUser } from '../../components/authUserStore'
import { listUsers, updateUser } from '../../client'

type TableTab = 'users' | 'iala_lights' | 'quizzes' | 'quiz_attempts'
type UserRole = 'admin' | 'teacher' | 'user'

const normalizeUserRole = (role: unknown): UserRole => {
  if (role === 'admin' || role === 'teacher' || role === 'user') {
    return role
  }
  return 'user'
}

const formatUserRole = (role: UserRole): string => {
  if (role === 'admin') return 'Ylläpitäjä'
  if (role === 'teacher') return 'Opettaja'
  return 'Opiskelija'
}

const getUserRoleBadgeClass = (role: UserRole): string => {
  if (role === 'admin') {
    return 'border border-[#315B4A]/30 bg-[#8FE3B5]/15 text-[#8FE3B5]'
  }
  if (role === 'teacher') {
    return 'border border-[#4A3C6B] bg-[#352B50] text-[#B99AFF]'
  }
  return 'border border-[#2D527A] bg-[#203A5C] text-[#6EB6FF]'
}

interface ToastMessage {
  id: number
  message: string
  color: string
  icon: IconDefinition
  duration: number
}

interface UserRow {
  id: string
  username: string
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  role: UserRole
  created_at: string
}

interface EditUserForm {
  id: string
  username: string
  first_name: string
  last_name: string
  email: string
  role: UserRole
}

interface IalaLightRow {
  id: string
  name: string
  category: string
  rhythm: string
  description: string | null
  config: Record<string, unknown>
  created_at: string
}

interface LightForm {
  id?: string
  name: string
  category: string
  rhythm: string
  description: string
  configText: string
}

interface QuizOptionApi {
  id: string
  question_id?: string
  option_text: string | null
  is_correct: boolean
  position: number
  iala_light_id?: string | null
}

interface QuizQuestionApi {
  id: string
  quiz_id?: string
  question_text: string | null
  explanation?: string | null
  hint?: string | null
  position: number
  iala_light_id?: string | null
  options?: QuizOptionApi[]
}

interface QuizRow {
  id: string
  name: string | null
  created_at: string
  questions?: QuizQuestionApi[]
}

interface QuizResponseApi {
  id: string
  attempt_id?: string
  question_id: string
  selected_option_id: string
}

interface QuizAttemptRow {
  id: string
  user_id?: string | null
  quiz_id?: string | null
  username?: string | null
  quiz_name?: string | null
  score?: number | null
  max_score?: number | null
  passed?: boolean | null
  completed_at?: string | null
  created_at?: string | null
  responses?: QuizResponseApi[]
}

interface QuizOptionForm {
  id?: string
  option_text: string
  is_correct: boolean
  position: number
  iala_light_id: string
}

interface QuizQuestionForm {
  id?: string
  question_text: string
  explanation: string
  hint: string
  position: number
  iala_light_id: string
  options: QuizOptionForm[]
}

interface QuizForm {
  id?: string
  name: string
  questions: QuizQuestionForm[]
  deletedQuestionIds: string[]
  deletedOptionIds: string[]
}

const enforceSingleCorrectOption = (options: QuizOptionForm[]): QuizOptionForm[] => {
  if (options.length === 0) return []
  const firstCorrectIndex = options.findIndex((opt) => opt.is_correct)
  const activeCorrectIndex = firstCorrectIndex >= 0 ? firstCorrectIndex : 0
  return options.map((opt, idx) => ({
    ...opt,
    is_correct: idx === activeCorrectIndex,
  }))
}

const formatTimestamp = (iso?: string | null): string => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('fi-FI', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const extractHttpErrorDetail = async (
  res: Response,
  fallback: string,
): Promise<string> => {
  try {
    const data = (await res.clone().json()) as {
      detail?: unknown
      message?: unknown
    }
    if (typeof data.detail === 'string' && data.detail.trim()) {
      return `${fallback} (${res.status}): ${data.detail}`
    }
    if (Array.isArray(data.detail) && data.detail.length > 0) {
      const first = data.detail[0] as { msg?: string; loc?: unknown[] }
      const locStr = Array.isArray(first?.loc) ? first.loc.join('.') : ''
      const msgStr = first?.msg ?? JSON.stringify(data.detail)
      return `${fallback} (${res.status}): ${locStr ? `${locStr} – ` : ''}${msgStr}`
    }
    if (typeof data.message === 'string' && data.message.trim()) {
      return `${fallback} (${res.status}): ${data.message}`
    }
  } catch {
    try {
      const text = await res.text()
      if (text.trim()) {
        return `${fallback} (${res.status}): ${text.trim()}`
      }
    } catch {}
  }
  return `${fallback} (${res.status})`
}

function useQuickCountUp(
  endValue: number,
  duration: number = 700,
  startPercentage: number = 0.8,
) {
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

function AnimatedTableCard({
  card,
  isSelected,
  isLoading,
  onSelect,
}: {
  card: {
    key: TableTab
    tableName: string
    label: string
    count: number
    icon: IconDefinition
  }
  isSelected: boolean
  isLoading: boolean
  onSelect: () => void
}) {
  const animatedCount = useQuickCountUp(card.count, 700, 0.3)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex cursor-pointer flex-col justify-between rounded-[14px] border p-5 text-left shadow-2xl transition ${
        isSelected
          ? 'border-[#1d90f4] bg-[#1E2839] ring-1 ring-[#1d90f4]/40'
          : 'border-[#2A374B] bg-[#1E2839]/70 hover:border-[#1d90f4]/50'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-[#718096]">
            {card.label}
          </span>
          <div className="mt-0.5 font-mono text-[10px] text-[#38bdf8]">
            {card.tableName}
          </div>
        </div>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            isSelected
              ? 'bg-[#1d90f4] text-white'
              : 'bg-[#1d90f4]/15 text-[#38bdf8]'
          }`}
        >
          <FontAwesomeIcon icon={card.icon} />
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-2xl font-bold text-white">
          {isLoading
            ? '...'
            : Math.round(animatedCount).toLocaleString('fi-FI')}
        </span>
        <span className="text-[11px] text-[#718096]">tietuetta</span>
      </div>
    </button>
  )
}

export default function AdminDatabase() {
  const navigate = useNavigate()
  const hasLoadedTables = useRef(false)
  const quizScrollBodyRef = useRef<HTMLDivElement | null>(null)
  const shouldScrollToNewQuestion = useRef(false)

  const [activeTable, setActiveTable] = useState<TableTab>('users')
  const [searchQuery, setSearchQuery] = useState('')
  const [subFilter, setSubFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  const [users, setUsers] = useState<UserRow[]>([])
  const [ialaLights, setIalaLights] = useState<IalaLightRow[]>([])
  const [quizzes, setQuizzes] = useState<QuizRow[]>([])
  const [quizAttempts, setQuizAttempts] = useState<QuizAttemptRow[]>([])

  const [editingUser, setEditingUser] = useState<EditUserForm | null>(null)
  const [isSavingUser, setIsSavingUser] = useState(false)

  const [lightModalForm, setLightModalForm] = useState<LightForm | null>(null)
  const [isSavingLight, setIsSavingLight] = useState(false)

  const [quizModalForm, setQuizModalForm] = useState<QuizForm | null>(null)
  const [isSavingQuiz, setIsSavingQuiz] = useState(false)
  const [quizModalError, setQuizModalError] = useState<string | null>(null)

  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = (msg: string, type: 'warning' | 'success' = 'warning') => {
    setToasts((prev) => {
      if (prev.some((toast) => toast.message === msg)) return prev

      return [
        ...prev,
        {
          id: Date.now() + Math.random(),
          message: msg,
          color: type === 'success' ? '#10b981' : '#f59e0b',
          icon: type === 'success' ? faCircleCheck : faTriangleExclamation,
          duration: 5,
        },
      ]
    })
  }

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const getAuthHeaders = () => {
    const token = getAccessToken()
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }

  const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

  const enrichQuizzesWithQuestions = async (
    rawQuizzes: QuizRow[],
    headers: Record<string, string>,
  ): Promise<QuizRow[]> => {
    return Promise.all(
      rawQuizzes.map(async (quiz) => {
        const hasFullOptions =
          Array.isArray(quiz.questions) &&
          quiz.questions.every((q) => Array.isArray(q.options))

        if (hasFullOptions) {
          return quiz
        }

        try {
          const detailRes = await fetch(`${baseUrl}/quizzes/${quiz.id}`, {
            headers,
          })
          if (detailRes.ok) {
            const detail = (await detailRes.json()) as QuizRow
            if (Array.isArray(detail.questions)) {
              const questionsWithOptions = await Promise.all(
                detail.questions.map(async (q) => {
                  if (Array.isArray(q.options)) return q
                  try {
                    const optRes = await fetch(
                      `${baseUrl}/quiz-questions/${q.id}/options`,
                      {
                        headers,
                      },
                    )
                    if (optRes.ok) {
                      const opts = (await optRes.json()) as QuizOptionApi[]
                      return { ...q, options: Array.isArray(opts) ? opts : [] }
                    }
                  } catch {}
                  return q
                }),
              )
              return { ...quiz, ...detail, questions: questionsWithOptions }
            }
          }

          const qRes = await fetch(`${baseUrl}/quizzes/${quiz.id}/questions`, {
            headers,
          })
          if (qRes.ok) {
            const qs = (await qRes.json()) as QuizQuestionApi[]
            const questionsWithOptions = await Promise.all(
              (Array.isArray(qs) ? qs : []).map(async (q) => {
                if (Array.isArray(q.options)) return q
                try {
                  const optRes = await fetch(
                    `${baseUrl}/quiz-questions/${q.id}/options`,
                    {
                      headers,
                    },
                  )
                  if (optRes.ok) {
                    const opts = (await optRes.json()) as QuizOptionApi[]
                    return { ...q, options: Array.isArray(opts) ? opts : [] }
                  }
                } catch {}
                return q
              }),
            )
            return { ...quiz, questions: questionsWithOptions }
          }
        } catch {}
        return quiz
      }),
    )
  }

  const enrichAttemptsWithResponses = async (
    rawAttempts: QuizAttemptRow[],
    headers: Record<string, string>,
  ): Promise<QuizAttemptRow[]> => {
    return Promise.all(
      rawAttempts.map(async (attempt) => {
        if (Array.isArray(attempt.responses)) {
          return attempt
        }
        try {
          const res = await fetch(
            `${baseUrl}/quiz-attempts/${attempt.id}/responses`,
            {
              headers,
            },
          )
          if (res.ok) {
            const responses = (await res.json()) as QuizResponseApi[]
            return {
              ...attempt,
              responses: Array.isArray(responses) ? responses : [],
            }
          }
        } catch {}
        return attempt
      }),
    )
  }

  const fetchAllTables = async () => {
    setIsLoading(true)
    const headers = getAuthHeaders()

    try {
      const [usersResult, lightsRes, quizzesRes, attemptsRes] =
        await Promise.all([
          listUsers().catch(() => null),
          fetch(`${baseUrl}/iala-lights`, { headers }).catch(() => null),
          fetch(`${baseUrl}/quizzes`, { headers }).catch(() => null),
          fetch(`${baseUrl}/quiz-attempts`, { headers }).catch(() => null),
        ])

      if (usersResult?.data && Array.isArray(usersResult.data)) {
        setUsers(
          usersResult.data.map((u) => ({
            ...(u as UserRow),
            role: normalizeUserRole((u as { role?: unknown }).role),
          })),
        )
      }

      if (lightsRes?.ok) {
        const data = await lightsRes.json()
        setIalaLights(Array.isArray(data) ? data : [])
      }

      if (quizzesRes?.ok) {
        const data = await quizzesRes.json()
        const list = Array.isArray(data) ? (data as QuizRow[]) : []
        const enriched = await enrichQuizzesWithQuestions(list, headers)
        setQuizzes(enriched)
      }

      if (attemptsRes?.ok) {
        const data = await attemptsRes.json()
        const list = Array.isArray(data) ? (data as QuizAttemptRow[]) : []
        const enrichedAttemptsList = await enrichAttemptsWithResponses(
          list,
          headers,
        )
        setQuizAttempts(enrichedAttemptsList)
      }

      const any401 =
        usersResult?.response?.status === 401 ||
        [lightsRes, quizzesRes, attemptsRes].some((r) => r && r.status === 401)

      if (any401) {
        addToast('Istunto on vanhentunut (401). Kirjaudu uudelleen sisään.')
        logoutUser()
        void navigate({ to: '/login' })
      }
    } catch (err) {
      addToast(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (hasLoadedTables.current) return
    hasLoadedTables.current = true
    void fetchAllTables()
  }, [])

  useEffect(() => {
    if (!shouldScrollToNewQuestion.current) return
    shouldScrollToNewQuestion.current = false
    requestAnimationFrame(() => {
      const container = quizScrollBodyRef.current
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        })
      }
    })
  }, [quizModalForm?.questions.length])

  const handleTabChange = (tab: TableTab) => {
    setActiveTable(tab)
    setSearchQuery('')
    setSubFilter('all')
  }

  const usersById = useMemo(() => {
    const map = new Map<string, UserRow>()
    for (const u of users) {
      if (u.id) map.set(u.id, u)
    }
    return map
  }, [users])

  const quizzesById = useMemo(() => {
    const map = new Map<string, QuizRow>()
    for (const q of quizzes) {
      if (q.id) map.set(q.id, q)
    }
    return map
  }, [quizzes])

  const optionsCorrectnessById = useMemo(() => {
    const map = new Map<string, boolean>()
    for (const quiz of quizzes) {
      for (const question of quiz.questions ?? []) {
        for (const option of question.options ?? []) {
          if (option.id) {
            map.set(option.id, Boolean(option.is_correct))
          }
        }
      }
    }
    return map
  }, [quizzes])

  const attemptsCountByQuizId = useMemo(() => {
    const counts = new Map<string, number>()
    for (const attempt of quizAttempts) {
      if (!attempt.quiz_id) continue
      counts.set(attempt.quiz_id, (counts.get(attempt.quiz_id) ?? 0) + 1)
    }
    return counts
  }, [quizAttempts])

  const enrichedAttempts = useMemo(() => {
    return quizAttempts.map((attempt) => {
      const matchedUser = attempt.user_id
        ? usersById.get(attempt.user_id)
        : undefined
      const matchedQuiz = attempt.quiz_id
        ? quizzesById.get(attempt.quiz_id)
        : undefined

      const userRole: UserRole | null = matchedUser
        ? normalizeUserRole(matchedUser.role)
        : attempt.user_id
          ? 'user'
          : null

      const userRoleLabel = userRole ? formatUserRole(userRole) : null

      const userLabel =
        matchedUser?.username ||
        attempt.username ||
        [matchedUser?.first_name, matchedUser?.last_name]
          .filter(Boolean)
          .join(' ') ||
        matchedUser?.email ||
        (attempt.user_id
          ? `Käyttäjä (${attempt.user_id.slice(0, 8)}...)`
          : 'Tuntematon käyttäjä')

      const userSubLabel =
        [matchedUser?.first_name, matchedUser?.last_name]
          .filter(Boolean)
          .join(' ') ||
        matchedUser?.email ||
        null

      const quizLabel =
        matchedQuiz?.name ||
        attempt.quiz_name ||
        (attempt.quiz_id
          ? `Testi (${attempt.quiz_id.slice(0, 8)}...)`
          : 'Nimetön testi')

      const timestamp = attempt.completed_at || attempt.created_at || ''

      const responses = Array.isArray(attempt.responses)
        ? attempt.responses
        : []
      const quizQuestionsCount = Array.isArray(matchedQuiz?.questions)
        ? matchedQuiz.questions.length
        : 0

      let scoreDisplay = '—'
      if (typeof attempt.score === 'number') {
        scoreDisplay =
          typeof attempt.max_score === 'number'
            ? `${attempt.score} / ${attempt.max_score}`
            : `${attempt.score}`
      } else if (responses.length > 0 || quizQuestionsCount > 0) {
        const correctCount = responses.reduce((acc, resp) => {
          return optionsCorrectnessById.get(resp.selected_option_id) === true
            ? acc + 1
            : acc
        }, 0)
        const denominator =
          quizQuestionsCount > 0 ? quizQuestionsCount : responses.length
        scoreDisplay = `${correctCount} / ${denominator}`
      }

      return {
        ...attempt,
        userRole,
        userRoleLabel,
        userLabel,
        userSubLabel,
        quizLabel,
        timestamp,
        scoreDisplay,
      }
    })
  }, [quizAttempts, usersById, quizzesById, optionsCorrectnessById])

  const openEditUserModal = (user: UserRow) => {
    setEditingUser({
      id: user.id,
      username: user.username,
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      email: user.email ?? '',
      role: normalizeUserRole(user.role),
    })
  }

  const handleSaveUserEdit = async (e: SubmitEvent) => {
    e.preventDefault()
    if (!editingUser) return

    const trimmedUsername = editingUser.username.trim()
    if (!trimmedUsername) {
      addToast('Käyttäjätunnus ei voi olla tyhjä.')
      return
    }

    setIsSavingUser(true)
    try {
      const result = await updateUser({
        path: { user_id: editingUser.id },
        body: {
          username: trimmedUsername,
          role: editingUser.role,
          first_name: editingUser.first_name.trim() || null,
          last_name: editingUser.last_name.trim() || null,
          email: editingUser.email.trim() || null,
        },
      })

      if (!result.response?.ok) {
        throw result
      }

      const updatedFromApi = result.data as Partial<UserRow> | undefined
      const resolvedRole = normalizeUserRole(
        updatedFromApi?.role ?? editingUser.role,
      )

      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                username: trimmedUsername,
                ...(updatedFromApi ?? {}),
                role: resolvedRole,
              }
            : u,
        ),
      )

      addToast(`Käyttäjän ${trimmedUsername} tiedot päivitetty.`, 'success')
      setEditingUser(null)
    } catch (err) {
      addToast(getApiErrorMessage(err))
    } finally {
      setIsSavingUser(false)
    }
  }

  const openNewLightModal = () => {
    setLightModalForm({
      name: '',
      category: subFilter !== 'all' ? subFilter : '',
      rhythm: '',
      description: '',
      configText: '{\n  "color": "red",\n  "period": 4\n}',
    })
  }

  const openEditLightModal = (light: IalaLightRow) => {
    setLightModalForm({
      id: light.id,
      name: light.name,
      category: light.category,
      rhythm: light.rhythm,
      description: light.description ?? '',
      configText: JSON.stringify(light.config ?? {}, null, 2),
    })
  }

  const handleSaveLight = async (e: SubmitEvent) => {
    e.preventDefault()
    if (!lightModalForm) return

    const trimmedName = lightModalForm.name.trim()
    const trimmedCategory = lightModalForm.category.trim()
    const trimmedRhythm = lightModalForm.rhythm.trim()

    if (!trimmedName || !trimmedCategory || !trimmedRhythm) {
      addToast('Täytä ainakin nimi, kategoria ja rytmi.')
      return
    }

    let parsedConfig: Record<string, unknown> = {}
    const rawConfig = lightModalForm.configText.trim()
    if (rawConfig) {
      try {
        const parsed: unknown = JSON.parse(rawConfig)
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          addToast('Config (JSONB) -kentän tulee olla JSON-objekti, esim. {}.')
          return
        }
        parsedConfig = parsed as Record<string, unknown>
      } catch {
        addToast('Config (JSONB) ei ole kelvollista JSON-muotoa.')
        return
      }
    }

    const isEditing = Boolean(lightModalForm.id)
    setIsSavingLight(true)

    try {
      const payload = {
        name: trimmedName,
        category: trimmedCategory,
        rhythm: trimmedRhythm,
        description: lightModalForm.description.trim() || null,
        config: parsedConfig,
      }

      const url = isEditing
        ? `${baseUrl}/iala-lights/${lightModalForm.id}`
        : `${baseUrl}/iala-lights`

      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error(
          await extractHttpErrorDetail(
            res,
            isEditing
              ? 'Loiston päivitys epäonnistui'
              : 'Loiston lisäys epäonnistui',
          ),
        )
      }

      const saved = (await res
        .json()
        .catch(() => null)) as Partial<IalaLightRow> | null

      if (isEditing && lightModalForm.id) {
        setIalaLights((prev) =>
          prev.map((item) =>
            item.id === lightModalForm.id
              ? {
                  ...item,
                  ...payload,
                  ...(saved ?? {}),
                }
              : item,
          ),
        )
        addToast(`IALA-loisto "${trimmedName}" päivitetty.`, 'success')
      } else {
        const newRow: IalaLightRow = {
          id: saved?.id ?? `${Date.now()}`,
          name: saved?.name ?? payload.name,
          category: saved?.category ?? payload.category,
          rhythm: saved?.rhythm ?? payload.rhythm,
          description: saved?.description ?? payload.description,
          config: saved?.config ?? payload.config,
          created_at: saved?.created_at ?? new Date().toISOString(),
        }
        setIalaLights((prev) => [newRow, ...prev])
        addToast(`IALA-loisto "${newRow.name}" lisätty.`, 'success')
      }

      setLightModalForm(null)
    } catch (err) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : getApiErrorMessage(err)
      addToast(msg)
    } finally {
      setIsSavingLight(false)
    }
  }

  const mapQuestionsToForm = (
    questions: QuizQuestionApi[] | undefined,
  ): QuizQuestionForm[] => {
    if (!Array.isArray(questions)) return []
    return [...questions]
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((q, qIdx) => {
        const mappedOptions = [...(q.options ?? [])]
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
          .map((opt, oIdx) => ({
            id: opt.id,
            option_text: opt.option_text ?? '',
            is_correct: Boolean(opt.is_correct),
            position: opt.position ?? oIdx + 1,
            iala_light_id: opt.iala_light_id ?? '',
          }))

        return {
          id: q.id,
          question_text: q.question_text ?? '',
          explanation: q.explanation ?? '',
          hint: q.hint ?? '',
          position: q.position ?? qIdx + 1,
          iala_light_id: q.iala_light_id ?? '',
          options: enforceSingleCorrectOption(mappedOptions),
        }
      })
  }

  const openNewQuizModal = () => {
    setQuizModalError(null)
    setQuizModalForm({
      name: '',
      questions: [
        {
          question_text: '',
          explanation: '',
          hint: '',
          position: 1,
          iala_light_id: '',
          options: enforceSingleCorrectOption([
            {
              option_text: '',
              is_correct: true,
              position: 1,
              iala_light_id: '',
            },
            {
              option_text: '',
              is_correct: false,
              position: 2,
              iala_light_id: '',
            },
          ]),
        },
      ],
      deletedQuestionIds: [],
      deletedOptionIds: [],
    })
  }

  const openEditQuizModal = async (quiz: QuizRow) => {
    setQuizModalError(null)
    let detail: QuizRow = quiz
    try {
      const res = await fetch(`${baseUrl}/quizzes/${quiz.id}`, {
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const fullData = (await res.json()) as QuizRow
        detail = { ...quiz, ...fullData }
      }
    } catch {}

    setQuizModalForm({
      id: detail.id,
      name: detail.name ?? '',
      questions: mapQuestionsToForm(detail.questions),
      deletedQuestionIds: [],
      deletedOptionIds: [],
    })
  }

  const reportQuizValidationError = (msg: string) => {
    setQuizModalError(msg)
    addToast(msg)
  }

  const addQuizQuestion = () => {
    setQuizModalError(null)
    shouldScrollToNewQuestion.current = true
    setQuizModalForm((prev) => {
      if (!prev) return null
      const nextPos = prev.questions.length + 1
      return {
        ...prev,
        questions: [
          ...prev.questions,
          {
            question_text: '',
            explanation: '',
            hint: '',
            position: nextPos,
            iala_light_id: '',
            options: enforceSingleCorrectOption([
              {
                option_text: '',
                is_correct: true,
                position: 1,
                iala_light_id: '',
              },
              {
                option_text: '',
                is_correct: false,
                position: 2,
                iala_light_id: '',
              },
            ]),
          },
        ],
      }
    })
  }

  const removeQuizQuestion = (qIndex: number) => {
    setQuizModalError(null)
    setQuizModalForm((prev) => {
      if (!prev) return null
      const target = prev.questions[qIndex]
      const removedOptIds = (target?.options ?? [])
        .map((o) => o.id)
        .filter((id): id is string => Boolean(id))

      return {
        ...prev,
        questions: prev.questions
          .filter((_, idx) => idx !== qIndex)
          .map((q, idx) => ({ ...q, position: idx + 1 })),
        deletedQuestionIds: target?.id
          ? [...prev.deletedQuestionIds, target.id]
          : prev.deletedQuestionIds,
        deletedOptionIds: [...prev.deletedOptionIds, ...removedOptIds],
      }
    })
  }

  const updateQuizQuestionField = (
    qIndex: number,
    patch: Partial<QuizQuestionForm>,
  ) => {
    setQuizModalError(null)
    setQuizModalForm((prev) => {
      if (!prev) return null
      return {
        ...prev,
        questions: prev.questions.map((q, idx) =>
          idx === qIndex ? { ...q, ...patch } : q,
        ),
      }
    })
  }

  const addQuizOption = (qIndex: number) => {
    setQuizModalError(null)
    setQuizModalForm((prev) => {
      if (!prev) return null
      return {
        ...prev,
        questions: prev.questions.map((q, idx) => {
          if (idx !== qIndex) return q
          const nextOptions = [
            ...q.options,
            {
              option_text: '',
              is_correct: q.options.length === 0,
              position: q.options.length + 1,
              iala_light_id: '',
            },
          ]
          return {
            ...q,
            options: enforceSingleCorrectOption(nextOptions),
          }
        }),
      }
    })
  }

  const removeQuizOption = (qIndex: number, oIndex: number) => {
    setQuizModalError(null)
    setQuizModalForm((prev) => {
      if (!prev) return null
      const removedOptId = prev.questions[qIndex]?.options[oIndex]?.id
      return {
        ...prev,
        questions: prev.questions.map((q, idx) => {
          if (idx !== qIndex) return q
          const remaining = q.options
            .filter((_, i) => i !== oIndex)
            .map((opt, i) => ({ ...opt, position: i + 1 }))
          return {
            ...q,
            options: enforceSingleCorrectOption(remaining),
          }
        }),
        deletedOptionIds: removedOptId
          ? [...prev.deletedOptionIds, removedOptId]
          : prev.deletedOptionIds,
      }
    })
  }

  const setSingleCorrectQuizOption = (qIndex: number, oIndex: number) => {
    setQuizModalError(null)
    setQuizModalForm((prev) => {
      if (!prev) return null
      return {
        ...prev,
        questions: prev.questions.map((q, idx) => {
          if (idx !== qIndex) return q
          return {
            ...q,
            options: q.options.map((opt, i) => ({
              ...opt,
              is_correct: i === oIndex,
            })),
          }
        }),
      }
    })
  }

  const updateQuizOptionField = (
    qIndex: number,
    oIndex: number,
    patch: Partial<QuizOptionForm>,
  ) => {
    setQuizModalError(null)
    setQuizModalForm((prev) => {
      if (!prev) return null
      return {
        ...prev,
        questions: prev.questions.map((q, idx) => {
          if (idx !== qIndex) return q
          const updatedOptions = q.options.map((opt, i) =>
            i === oIndex ? { ...opt, ...patch } : opt,
          )
          return {
            ...q,
            options:
              patch.is_correct === true
                ? updatedOptions.map((opt, i) => ({
                    ...opt,
                    is_correct: i === oIndex,
                  }))
                : enforceSingleCorrectOption(updatedOptions),
          }
        }),
      }
    })
  }

  const handleSaveQuiz = async (e: SubmitEvent) => {
    e.preventDefault()
    if (!quizModalForm) return

    setQuizModalError(null)

    const trimmedName = quizModalForm.name.trim()
    if (!trimmedName) {
      reportQuizValidationError('Anna tietovisalle nimi (yläkentässä).')
      return
    }

    for (let i = 0; i < quizModalForm.questions.length; i++) {
      const q = quizModalForm.questions[i]
      if (!q.question_text.trim()) {
        reportQuizValidationError(
          `Kysymykseltä #${i + 1} puuttuu kysymysteksti.`,
        )
        return
      }
      if (q.options.length === 0) {
        reportQuizValidationError(
          `Kysymyksellä #${i + 1} tulee olla vähintään yksi vastausvaihtoehto.`,
        )
        return
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].option_text.trim()) {
          reportQuizValidationError(
            `Kysymyksen #${i + 1} vaihtoehdolta #${j + 1} puuttuu teksti.`,
          )
          return
        }
      }
      const correctCount = q.options.filter((opt) => opt.is_correct).length
      if (correctCount !== 1) {
        reportQuizValidationError(
          `Kysymyksellä #${i + 1} täytyy olla täsmälleen yksi oikea vastaus.`,
        )
        return
      }
    }

    const isEditing = Boolean(quizModalForm.id)
    setIsSavingQuiz(true)

    try {
      const headers = getAuthHeaders()

      if (!isEditing) {
        const questionsPayload = quizModalForm.questions.map((q, qIdx) => {
          const normalizedOpts = enforceSingleCorrectOption(q.options)
          return {
            question_text: q.question_text.trim(),
            explanation: q.explanation.trim() || null,
            hint: q.hint.trim() || null,
            position: Number.isFinite(q.position) ? q.position : qIdx + 1,
            iala_light_id: q.iala_light_id.trim() || null,
            options: normalizedOpts.map((opt, oIdx) => ({
              option_text: opt.option_text.trim(),
              is_correct: Boolean(opt.is_correct),
              position: Number.isFinite(opt.position) ? opt.position : oIdx + 1,
              iala_light_id: opt.iala_light_id.trim() || null,
            })),
          }
        })

        const res = await fetch(`${baseUrl}/quizzes`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: trimmedName,
            ...(questionsPayload.length > 0
              ? { questions: questionsPayload }
              : {}),
          }),
        })

        if (!res.ok) {
          throw new Error(
            await extractHttpErrorDetail(res, 'Tietovisan lisäys epäonnistui'),
          )
        }

        const saved = (await res.json().catch(() => null)) as QuizRow | null
        const newRow: QuizRow = {
          id: saved?.id ?? `${Date.now()}`,
          name: saved?.name ?? trimmedName,
          created_at: saved?.created_at ?? new Date().toISOString(),
          questions: saved?.questions ?? [],
        }
        setQuizzes((prev) => [newRow, ...prev])
        addToast(`Tietovisa "${newRow.name}" lisätty.`, 'success')
        setQuizModalForm(null)
        return
      }

      const quizId = quizModalForm.id!

      const quizUpdateRes = await fetch(`${baseUrl}/quizzes/${quizId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ name: trimmedName }),
      })

      if (!quizUpdateRes.ok) {
        throw new Error(
          await extractHttpErrorDetail(
            quizUpdateRes,
            'Tietovisan päivitys epäonnistui',
          ),
        )
      }

      for (const optId of quizModalForm.deletedOptionIds) {
        const delOptRes = await fetch(
          `${baseUrl}/quiz-question-options/${optId}`,
          {
            method: 'DELETE',
            headers,
          },
        )
        if (!delOptRes.ok && delOptRes.status !== 404) {
          throw new Error(
            await extractHttpErrorDetail(
              delOptRes,
              'Vastausvaihtoehdon poisto epäonnistui',
            ),
          )
        }
      }

      for (const qId of quizModalForm.deletedQuestionIds) {
        const delQRes = await fetch(`${baseUrl}/quiz-questions/${qId}`, {
          method: 'DELETE',
          headers,
        })
        if (!delQRes.ok && delQRes.status !== 404) {
          throw new Error(
            await extractHttpErrorDetail(
              delQRes,
              'Kysymyksen poisto epäonnistui',
            ),
          )
        }
      }

      for (let qIdx = 0; qIdx < quizModalForm.questions.length; qIdx++) {
        const q = quizModalForm.questions[qIdx]
        const normalizedOpts = enforceSingleCorrectOption(q.options)
        const qPayload = {
          question_text: q.question_text.trim(),
          explanation: q.explanation.trim() || null,
          hint: q.hint.trim() || null,
          position: Number.isFinite(q.position) ? q.position : qIdx + 1,
          iala_light_id: q.iala_light_id.trim() || null,
        }

        if (!q.id) {
          const createQRes = await fetch(
            `${baseUrl}/quizzes/${quizId}/questions`,
            {
              method: 'POST',
              headers,
              body: JSON.stringify({
                ...qPayload,
                options: normalizedOpts.map((opt, oIdx) => ({
                  option_text: opt.option_text.trim(),
                  is_correct: Boolean(opt.is_correct),
                  position: Number.isFinite(opt.position)
                    ? opt.position
                    : oIdx + 1,
                  iala_light_id: opt.iala_light_id.trim() || null,
                })),
              }),
            },
          )
          if (!createQRes.ok) {
            throw new Error(
              await extractHttpErrorDetail(
                createQRes,
                'Kysymyksen lisäys epäonnistui',
              ),
            )
          }
        } else {
          const updQRes = await fetch(`${baseUrl}/quiz-questions/${q.id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(qPayload),
          })
          if (!updQRes.ok) {
            throw new Error(
              await extractHttpErrorDetail(
                updQRes,
                'Kysymyksen päivitys epäonnistui',
              ),
            )
          }

          for (let oIdx = 0; oIdx < normalizedOpts.length; oIdx++) {
            const opt = normalizedOpts[oIdx]
            const optPayload = {
              option_text: opt.option_text.trim(),
              is_correct: Boolean(opt.is_correct),
              position: Number.isFinite(opt.position) ? opt.position : oIdx + 1,
              iala_light_id: opt.iala_light_id.trim() || null,
            }

            if (!opt.id) {
              const createOptRes = await fetch(
                `${baseUrl}/quiz-questions/${q.id}/options`,
                {
                  method: 'POST',
                  headers,
                  body: JSON.stringify(optPayload),
                },
              )
              if (!createOptRes.ok) {
                throw new Error(
                  await extractHttpErrorDetail(
                    createOptRes,
                    'Vastausvaihtoehdon lisäys epäonnistui',
                  ),
                )
              }
            } else {
              const updOptRes = await fetch(
                `${baseUrl}/quiz-question-options/${opt.id}`,
                {
                  method: 'PUT',
                  headers,
                  body: JSON.stringify(optPayload),
                },
              )
              if (!updOptRes.ok) {
                throw new Error(
                  await extractHttpErrorDetail(
                    updOptRes,
                    'Vastausvaihtoehdon päivitys epäonnistui',
                  ),
                )
              }
            }
          }
        }
      }

      const refreshedQuizRes = await fetch(`${baseUrl}/quizzes/${quizId}`, {
        headers,
      })
      const refreshedQuiz = refreshedQuizRes.ok
        ? ((await refreshedQuizRes.json()) as QuizRow)
        : null

      setQuizzes((prev) =>
        prev.map((item) =>
          item.id === quizId
            ? {
                ...item,
                name: trimmedName,
                ...(refreshedQuiz ?? {}),
              }
            : item,
        ),
      )

      addToast(`Tietovisa "${trimmedName}" päivitetty.`, 'success')
      setQuizModalForm(null)
    } catch (err) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : getApiErrorMessage(err)
      setQuizModalError(msg)
      addToast(msg)
    } finally {
      setIsSavingQuiz(false)
    }
  }

  const handleDeleteRecord = async (
    endpoint: string,
    id: string,
    label: string,
  ) => {
    if (!window.confirm(`Haluatko varmasti poistaa tietueen "${label}"?`))
      return

    try {
      const res = await fetch(`${baseUrl}/${endpoint}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        throw new Error(`Poisto epäonnistui (${res.status})`)
      }

      if (endpoint === 'users')
        setUsers((prev) => prev.filter((item) => item.id !== id))
      if (endpoint === 'iala-lights')
        setIalaLights((prev) => prev.filter((item) => item.id !== id))
      if (endpoint === 'quizzes') {
        setQuizzes((prev) => prev.filter((item) => item.id !== id))
        setQuizAttempts((prev) => prev.filter((item) => item.quiz_id !== id))
      }
      if (endpoint === 'quiz-attempts') {
        setQuizAttempts((prev) => prev.filter((item) => item.id !== id))
      }

      addToast(`Tietue "${label}" poistettu.`, 'success')
    } catch (err) {
      addToast(getApiErrorMessage(err))
    }
  }

  const lightCategories = useMemo(() => {
    const cats = new Set(ialaLights.map((l) => l.category).filter(Boolean))
    return Array.from(cats)
  }, [ialaLights])

  const categoryOptions = useMemo(() => {
    const set = new Set(lightCategories)
    if (lightModalForm?.category.trim()) {
      set.add(lightModalForm.category.trim())
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fi'))
  }, [lightCategories, lightModalForm?.category])

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = subFilter === 'all' || u.role === subFilter
      const q = searchQuery.toLowerCase()
      const fullName =
        `${u.first_name ?? ''} ${u.last_name ?? ''}`.toLowerCase()
      const matchesSearch =
        u.username.toLowerCase().includes(q) ||
        fullName.includes(q) ||
        (u.email ?? '').toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
      return matchesRole && matchesSearch
    })
  }, [users, subFilter, searchQuery])

  const filteredLights = useMemo(() => {
    return ialaLights.filter((l) => {
      const matchesCat = subFilter === 'all' || l.category === subFilter
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        l.name.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        l.rhythm.toLowerCase().includes(q) ||
        (l.description ?? '').toLowerCase().includes(q)
      return matchesCat && matchesSearch
    })
  }, [ialaLights, subFilter, searchQuery])

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter(
      (q) =>
        (q.name ?? 'Nimetön visa')
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        q.id.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [quizzes, searchQuery])

  const filteredAttempts = useMemo(() => {
    return enrichedAttempts.filter((a) => {
      const matchesQuiz = subFilter === 'all' || a.quiz_id === subFilter
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        a.userLabel.toLowerCase().includes(q) ||
        (a.userSubLabel ?? '').toLowerCase().includes(q) ||
        (a.userRoleLabel ?? '').toLowerCase().includes(q) ||
        a.quizLabel.toLowerCase().includes(q) ||
        (a.user_id ?? '').toLowerCase().includes(q)
      return matchesQuiz && matchesSearch
    })
  }, [enrichedAttempts, subFilter, searchQuery])

  const tableCards: {
    key: TableTab
    tableName: string
    label: string
    count: number
    icon: IconDefinition
  }[] = [
    {
      key: 'users',
      tableName: 'users',
      label: 'Rekisteröidyt käyttäjät',
      count: users.length,
      icon: faUsers,
    },
    {
      key: 'iala_lights',
      tableName: 'iala_lights',
      label: 'IALA-loistot',
      count: ialaLights.length,
      icon: faLightbulb,
    },
    {
      key: 'quizzes',
      tableName: 'quizzes',
      label: 'Tietovisat',
      count: quizzes.length,
      icon: faClipboardList,
    },
    {
      key: 'quiz_attempts',
      tableName: 'quiz_attempts',
      label: 'Suoritetut',
      count: quizAttempts.length,
      icon: faAward,
    },
  ]

  return (
    <div className="relative flex flex-col gap-6 p-8">
      <div className="pointer-events-none fixed top-6 right-6 z-[70] flex max-w-md flex-col gap-2 [&>*]:pointer-events-auto">
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <FontAwesomeIcon
              icon={faDatabase}
              className="text-xl text-[#38bdf8]"
            />
            <h1 className="text-2xl font-bold text-white">Tietokanta</h1>
          </div>
          <p className="mt-1 text-xs text-[#718096]">
            Selaa ja hallitse PostgreSQL-tietokannan tauluja.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchAllTables()}
          disabled={isLoading}
          className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-[#2A374B] bg-[#1E2839] px-4 py-2 text-xs font-medium text-white transition hover:border-[#1d90f4] disabled:opacity-50"
        >
          <FontAwesomeIcon
            icon={faRotateRight}
            className={
              isLoading ? 'animate-spin text-[#38bdf8]' : 'text-[#38bdf8]'
            }
          />
          <span>Päivitä taulut</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tableCards.map((card) => (
          <AnimatedTableCard
            key={card.key}
            card={card}
            isSelected={activeTable === card.key}
            isLoading={isLoading}
            onSelect={() => handleTabChange(card.key)}
          />
        ))}
      </div>

      <section className="flex flex-col rounded-[16px] border border-[#2A374B] bg-[#1E2839] p-6 shadow-2xl">
        <div className="mb-5 flex flex-col justify-between gap-4 border-b border-[#2A374B]/70 pb-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="m-0 text-base font-semibold text-white">
              Taulu (
              <span className="font-mono text-[#38bdf8]">{activeTable}</span>)
            </h2>
            <p className="mt-0.5 text-xs text-[#718096]">
              {activeTable === 'quiz_attempts'
                ? 'Näet tästä, ketkä käyttäjät ovat suorittaneet mitäkin testejä ja milloin.'
                : 'Suodata tietueita hakusanalla tai tarkastele yksittäisen rivin kenttiä.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {activeTable === 'users' && (
              <div className="relative inline-flex items-center">
                <select
                  value={subFilter}
                  onChange={(e) => setSubFilter(e.target.value)}
                  className="cursor-pointer appearance-none rounded-lg border border-[#2A374B] bg-[#182130] py-2 pl-3 pr-7 text-xs font-medium text-white outline-none transition focus:border-[#1d90f4]"
                >
                  <option value="all">Kaikki roolit</option>
                  <option value="admin">Ylläpitäjä</option>
                  <option value="teacher">Opettaja</option>
                  <option value="user">Opiskelija</option>
                </select>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className="pointer-events-none absolute right-2.5 text-[11px] text-slate-300"
                />
              </div>
            )}

            {activeTable === 'quiz_attempts' && (
              <div className="relative inline-flex items-center">
                <select
                  value={subFilter}
                  onChange={(e) => setSubFilter(e.target.value)}
                  className="cursor-pointer appearance-none rounded-lg border border-[#2A374B] bg-[#182130] py-2 pl-3 pr-7 text-xs font-medium text-white outline-none transition focus:border-[#1d90f4]"
                >
                  <option value="all">Kaikki testit</option>
                  {quizzes.map((quiz) => (
                    <option key={quiz.id} value={quiz.id}>
                      {quiz.name || 'Nimetön tietovisa'}
                    </option>
                  ))}
                </select>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className="pointer-events-none absolute right-2.5 text-[11px] text-slate-300"
                />
              </div>
            )}

            {activeTable === 'iala_lights' && (
              <>
                <div className="relative inline-flex items-center">
                  <select
                    value={subFilter}
                    onChange={(e) => setSubFilter(e.target.value)}
                    className="cursor-pointer appearance-none rounded-lg border border-[#2A374B] bg-[#182130] py-2 pl-3 pr-7 text-xs font-medium text-white outline-none transition focus:border-[#1d90f4]"
                  >
                    <option value="all">Kaikki kategoriat</option>
                    {lightCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className="pointer-events-none absolute right-2.5 text-[11px] text-slate-300"
                  />
                </div>
                <button
                  type="button"
                  onClick={openNewLightModal}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#1d90f4] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-[#1d90f4]/90"
                >
                  <FontAwesomeIcon icon={faPlus} />
                  <span>Lisää loisto</span>
                </button>
              </>
            )}

            {activeTable === 'quizzes' && (
              <button
                type="button"
                onClick={openNewQuizModal}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#1d90f4] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-[#1d90f4]/90"
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>Lisää tietovisa</span>
              </button>
            )}

            <div className="relative">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#718096]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Hae taulusta..."
                className="w-64 rounded-lg border border-[#2A374B] bg-[#182130] py-2 pl-9 pr-3 text-xs text-white placeholder-[#718096] outline-none focus:border-[#1d90f4]"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#2A374B] bg-[#131B27]/70 [scrollbar-color:#2A374B_#131B27] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#2A374B] hover:[&::-webkit-scrollbar-thumb]:bg-[#3B4D68] [&::-webkit-scrollbar-track]:bg-[#131B27]">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center text-xs font-medium text-[#38bdf8]">
              Ladataan tietokannan rivejä...
            </div>
          ) : (
            <>
              {activeTable === 'users' && (
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#2A374B] bg-[#182130] text-[11px] uppercase text-[#718096]">
                      <th className="px-4 py-3">Käyttäjätunnus</th>
                      <th className="px-4 py-3">Nimi</th>
                      <th className="px-4 py-3">Sähköposti</th>
                      <th className="px-4 py-3">Rooli</th>
                      <th className="px-4 py-3">Luotu</th>
                      <th className="px-4 py-3 text-right">Toiminnot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A374B]/50 text-white">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-[#718096]"
                        >
                          Ei hakua vastaavia käyttäjiä.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const displayName =
                          [user.first_name, user.last_name]
                            .filter(Boolean)
                            .join(' ') || '—'
                        return (
                          <tr
                            key={user.id}
                            className="transition hover:bg-[#1E2839]/60"
                          >
                            <td className="px-4 py-3 font-medium">
                              {user.username}
                            </td>
                            <td className="px-4 py-3 text-slate-300">
                              {displayName}
                            </td>
                            <td className="px-4 py-3 text-[#38bdf8]">
                              {user.email || '—'}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ${getUserRoleBadgeClass(user.role)}`}
                              >
                                {formatUserRole(user.role)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[#718096]">
                              {formatTimestamp(user.created_at)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditUserModal(user)}
                                  className="cursor-pointer rounded-md border border-[#2A374B] bg-[#182130] px-2.5 py-1 text-[11px] text-white transition hover:border-[#1d90f4]"
                                  title="Muokkaa käyttäjää"
                                >
                                  <FontAwesomeIcon
                                    icon={faPenToSquare}
                                    className="mr-1 text-[#38bdf8]"
                                  />
                                  Muokkaa
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleDeleteRecord(
                                      'users',
                                      user.id,
                                      user.username,
                                    )
                                  }
                                  className="cursor-pointer rounded-md border border-red-500/20 bg-red-500/10 p-1.5 text-red-400 transition hover:bg-red-500/20"
                                  title="Poista käyttäjä"
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              )}

              {activeTable === 'iala_lights' && (
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#2A374B] bg-[#182130] text-[11px] uppercase text-[#718096]">
                      <th className="px-4 py-3">Loiston nimi</th>
                      <th className="px-4 py-3">Kategoria</th>
                      <th className="px-4 py-3">Rytmi</th>
                      <th className="px-4 py-3">Kuvaus</th>
                      <th className="px-4 py-3 text-right">Toiminnot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A374B]/50 text-white">
                    {filteredLights.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-[#718096]"
                        >
                          Ei IALA-loistoja löytynyt.
                        </td>
                      </tr>
                    ) : (
                      filteredLights.map((light) => (
                        <tr
                          key={light.id}
                          className="transition hover:bg-[#1E2839]/60"
                        >
                          <td className="px-4 py-3 font-medium">
                            {light.name}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-md border border-[#2A374B] bg-[#182130] px-2 py-0.5 text-[11px] text-[#38bdf8]">
                              {light.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-amber-300">
                            {light.rhythm}
                          </td>
                          <td className="max-w-xs truncate px-4 py-3 text-[#718096]">
                            {light.description || '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openEditLightModal(light)}
                                className="cursor-pointer rounded-md border border-[#2A374B] bg-[#182130] px-2.5 py-1 text-[11px] text-white transition hover:border-[#1d90f4]"
                                title="Muokkaa loistoa"
                              >
                                <FontAwesomeIcon
                                  icon={faPenToSquare}
                                  className="mr-1 text-[#38bdf8]"
                                />
                                Muokkaa
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void handleDeleteRecord(
                                    'iala-lights',
                                    light.id,
                                    light.name,
                                  )
                                }
                                className="cursor-pointer rounded-md border border-red-500/20 bg-red-500/10 p-1.5 text-red-400 transition hover:bg-red-500/20"
                                title="Poista loisto"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {activeTable === 'quizzes' && (
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#2A374B] bg-[#182130] text-[11px] uppercase text-[#718096]">
                      <th className="px-4 py-3">Tietovisan nimi</th>
                      <th className="px-4 py-3">Kysymykset</th>
                      <th className="px-4 py-3">Suoritukset</th>
                      <th className="px-4 py-3">Luotu</th>
                      <th className="px-4 py-3 text-right">Toiminnot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A374B]/50 text-white">
                    {filteredQuizzes.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-[#718096]"
                        >
                          Ei tietovisoja löytynyt.
                        </td>
                      </tr>
                    ) : (
                      filteredQuizzes.map((quiz) => {
                        const questionCount = Array.isArray(quiz.questions)
                          ? quiz.questions.length
                          : 0
                        const attemptCount =
                          attemptsCountByQuizId.get(quiz.id) ?? 0
                        return (
                          <tr
                            key={quiz.id}
                            className="transition hover:bg-[#1E2839]/60"
                          >
                            <td className="px-4 py-3 font-medium">
                              {quiz.name || 'Nimetön tietovisa'}
                            </td>
                            <td className="px-4 py-3 text-[#38bdf8]">
                              {questionCount.toLocaleString('fi-FI')}
                            </td>
                            <td className="px-4 py-3 text-slate-200">
                              {attemptCount.toLocaleString('fi-FI')}
                            </td>
                            <td className="px-4 py-3 text-[#718096]">
                              {formatTimestamp(quiz.created_at)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => void openEditQuizModal(quiz)}
                                  className="cursor-pointer rounded-md border border-[#2A374B] bg-[#182130] px-2.5 py-1 text-[11px] text-white transition hover:border-[#1d90f4]"
                                  title="Muokkaa tietovisaa"
                                >
                                  <FontAwesomeIcon
                                    icon={faPenToSquare}
                                    className="mr-1 text-[#38bdf8]"
                                  />
                                  Muokkaa
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleDeleteRecord(
                                      'quizzes',
                                      quiz.id,
                                      quiz.name || 'Tietovisa',
                                    )
                                  }
                                  className="cursor-pointer rounded-md border border-red-500/20 bg-red-500/10 p-1.5 text-red-400 transition hover:bg-red-500/20"
                                  title="Poista tietovisa"
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              )}

              {activeTable === 'quiz_attempts' && (
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#2A374B] bg-[#182130] text-[11px] uppercase text-[#718096]">
                      <th className="px-4 py-3">Suorittaja</th>
                      <th className="px-4 py-3">Rooli</th>
                      <th className="px-4 py-3">Suoritettu testi</th>
                      <th className="px-4 py-3">Tulos</th>
                      <th className="px-4 py-3">Suoritettu</th>
                      <th className="px-4 py-3 text-right">Toiminnot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A374B]/50 text-white">
                    {filteredAttempts.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-[#718096]"
                        >
                          Ei suoritettuja testejä löytynyt.
                        </td>
                      </tr>
                    ) : (
                      filteredAttempts.map((attempt) => (
                        <tr
                          key={attempt.id}
                          className="transition hover:bg-[#1E2839]/60"
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-white">
                              {attempt.userSubLabel}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {attempt.userRole && attempt.userRoleLabel ? (
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ${getUserRoleBadgeClass(attempt.userRole)}`}
                              >
                                {attempt.userRoleLabel}
                              </span>
                            ) : (
                              <span className="text-[#718096]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-[#38bdf8]">
                            {attempt.quizLabel}
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-200">
                            {attempt.scoreDisplay}
                          </td>
                          <td className="px-4 py-3 text-[#718096]">
                            {formatTimestamp(attempt.timestamp)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                void handleDeleteRecord(
                                  'quiz-attempts',
                                  attempt.id,
                                  `${attempt.userLabel} – ${attempt.quizLabel}`,
                                )
                              }
                              className="cursor-pointer rounded-md border border-red-500/20 bg-red-500/10 p-1.5 text-red-400 transition hover:bg-red-500/20"
                              title="Poista suoritus"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </section>

      {quizModalForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={(e) => void handleSaveQuiz(e)}
            className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#2A374B] bg-[#1E2839] shadow-2xl"
          >
            <div className="shrink-0 px-6 pt-6">
              <div className="flex items-start justify-between border-b border-[#2A374B]">
                <div>
                  <h3 className="text-base font-bold text-white">
                    {quizModalForm.id
                      ? 'Muokkaa tietovisaa'
                      : 'Lisää uusi tietovisa'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setQuizModalError(null)
                    setQuizModalForm(null)
                  }}
                  disabled={isSavingQuiz}
                  className="cursor-pointer rounded-lg p-1.5 text-[#718096] transition hover:text-white disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              {quizModalError && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3.5 py-2.5 text-xs text-amber-200">
                  <FontAwesomeIcon
                    icon={faTriangleExclamation}
                    className="mt-0.5 shrink-0 text-amber-400"
                  />
                  <span>{quizModalError}</span>
                </div>
              )}
            </div>

            <div
              ref={quizScrollBodyRef}
              className="mt-4 flex flex-1 flex-col gap-3.5 overflow-y-auto px-6 pb-2 text-xs [scrollbar-color:#2A374B_#131B27] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#2A374B] hover:[&::-webkit-scrollbar-thumb]:bg-[#3B4D68] [&::-webkit-scrollbar-track]:bg-[#131B27]"
            >
              <div>
                <label className="mb-1 block font-medium text-slate-300">
                  Tietovisan nimi *
                </label>
                <input
                  type="text"
                  value={quizModalForm.name}
                  onChange={(e) => {
                    setQuizModalError(null)
                    setQuizModalForm((prev) =>
                      prev ? { ...prev, name: e.target.value } : null,
                    )
                  }}
                  placeholder="esim. Kardinaalimerkit ja valotunnukset"
                  required
                  className="w-full rounded-md border border-[#2A374B] bg-[#182130] px-3 py-2 text-white placeholder-[#718096] outline-none focus:border-[#1d90f4]"
                />
              </div>

              <div className="border-t border-[#2A374B]/70 pt-3">
                <h4 className="m-0 text-xs font-semibold text-white">
                  Kysymykset ({quizModalForm.questions.length})
                </h4>
                <p className="mt-0.5 text-[11px] text-[#718096]">
                  Lisää ja muokkaa kysymyksiä, vinkkejä, selityksiä ja
                  vastausvaihtoehtoja. Jokaisella kysymyksellä on yksi oikea
                  vastaus.
                </p>
              </div>

              {quizModalForm.questions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#2A374B] bg-[#131B27]/50 p-4 text-center text-[11px] text-[#718096]">
                  Ei kysymyksiä. Käytä alareunan &ldquo;Lisää kysymys&rdquo;
                  -painiketta lisätäksesi kysymyksiä.
                </div>
              ) : (
                <div className="flex flex-col gap-3.5">
                  {quizModalForm.questions.map((question, qIndex) => (
                    <div
                      key={question.id ?? `new-q-${qIndex}`}
                      className="rounded-xl border border-[#2A374B] bg-[#131B27]/70 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-semibold text-[#38bdf8]">
                          Kysymys #{qIndex + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeQuizQuestion(qIndex)}
                          className="cursor-pointer rounded-md border border-red-500/20 bg-red-500/10 px-2 py-1 text-[11px] text-red-400 transition hover:bg-red-500/20"
                          title="Poista kysymys"
                        >
                          <FontAwesomeIcon icon={faTrash} className="mr-1" />
                          Poista
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                        <div className="sm:col-span-7">
                          <label className="mb-1 block text-[11px] font-medium text-slate-300">
                            Kysymysteksti *
                          </label>
                          <input
                            type="text"
                            value={question.question_text}
                            onChange={(e) =>
                              updateQuizQuestionField(qIndex, {
                                question_text: e.target.value,
                              })
                            }
                            placeholder="esim. Mikä väri paapuurimerkin IALA-A-alueella?"
                            required
                            className="w-full rounded-md border border-[#2A374B] bg-[#182130] px-3 py-2 text-white placeholder-[#718096] outline-none focus:border-[#1d90f4]"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-[11px] font-medium text-slate-300">
                            Järjestys
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={question.position}
                            onChange={(e) =>
                              updateQuizQuestionField(qIndex, {
                                position: Number(e.target.value) || 1,
                              })
                            }
                            className="w-full rounded-md border border-[#2A374B] bg-[#182130] px-2.5 py-2 text-white outline-none focus:border-[#1d90f4]"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="mb-1 block text-[11px] font-medium text-slate-300">
                            IALA-loisto
                          </label>
                          <div className="relative flex items-center">
                            <select
                              value={question.iala_light_id}
                              onChange={(e) =>
                                updateQuizQuestionField(qIndex, {
                                  iala_light_id: e.target.value,
                                })
                              }
                              className="w-full cursor-pointer appearance-none rounded-md border border-[#2A374B] bg-[#182130] py-2 pl-2.5 pr-7 text-[11px] text-white outline-none transition focus:border-[#1d90f4]"
                            >
                              <option value="">Ei loistoa</option>
                              {ialaLights.map((light) => (
                                <option key={light.id} value={light.id}>
                                  {light.name}
                                </option>
                              ))}
                            </select>
                            <FontAwesomeIcon
                              icon={faChevronDown}
                              className="pointer-events-none absolute right-2 text-[10px] text-slate-300"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-col gap-3">
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-slate-300">
                            Vinkki
                          </label>
                          <input
                            type="text"
                            value={question.hint}
                            onChange={(e) =>
                              updateQuizQuestionField(qIndex, {
                                hint: e.target.value,
                              })
                            }
                            placeholder="esim. IALA-alueet / Väylämerkin väri"
                            className="w-full rounded-md border border-[#2A374B] bg-[#182130] px-3 py-2 text-white placeholder-[#718096] outline-none focus:border-[#1d90f4]"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-slate-300">
                            Selitys
                          </label>
                          <textarea
                            rows={4}
                            value={question.explanation}
                            onChange={(e) =>
                              updateQuizQuestionField(qIndex, {
                                explanation: e.target.value,
                              })
                            }
                            placeholder="esim. IALA-A-alueella paapuurin (vasemman puolen) merkki on punainen tynnyripoiju punaisella valolla..."
                            className="max-h-48 w-full resize-y rounded-md border border-[#2A374B] bg-[#182130] px-3 py-2 leading-relaxed text-white placeholder-[#718096] outline-none focus:border-[#1d90f4] [scrollbar-color:#2A374B_#182130] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#2A374B] hover:[&::-webkit-scrollbar-thumb]:bg-[#3B4D68] [&::-webkit-scrollbar-track]:bg-[#182130]"
                          />
                        </div>
                      </div>

                      <div className="mt-3.5 border-t border-[#2A374B]/60 pt-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[11px] font-medium text-slate-300">
                            Vastausvaihtoehdot ({question.options.length})
                          </span>
                          <button
                            type="button"
                            onClick={() => addQuizOption(qIndex)}
                            className="flex cursor-pointer items-center gap-1 rounded-md border border-[#2A374B] bg-[#182130] px-2.5 py-1 text-[11px] text-slate-200 transition hover:border-[#1d90f4]"
                          >
                            <FontAwesomeIcon
                              icon={faPlus}
                              className="text-[#38bdf8]"
                            />
                            <span>Lisää vaihtoehto</span>
                          </button>
                        </div>

                        <div className="flex flex-col gap-2">
                          {question.options.map((opt, oIndex) => (
                            <div
                              key={opt.id ?? `new-opt-${qIndex}-${oIndex}`}
                              className="flex flex-wrap items-center gap-2 rounded-lg border border-[#2A374B]/70 bg-[#182130]/90 p-2"
                            >
                              <input
                                type="text"
                                value={opt.option_text}
                                onChange={(e) =>
                                  updateQuizOptionField(qIndex, oIndex, {
                                    option_text: e.target.value,
                                  })
                                }
                                placeholder={`Vaihtoehto ${oIndex + 1}`}
                                required
                                className="min-w-[160px] flex-1 rounded border border-[#2A374B] bg-[#131B27] px-2.5 py-1.5 text-xs text-white placeholder-[#718096] outline-none focus:border-[#1d90f4]"
                              />

                              <input
                                type="number"
                                min={1}
                                value={opt.position}
                                onChange={(e) =>
                                  updateQuizOptionField(qIndex, oIndex, {
                                    position: Number(e.target.value) || 1,
                                  })
                                }
                                title="Vaihtoehdon järjestysnumero"
                                className="w-16 rounded border border-[#2A374B] bg-[#131B27] px-2 py-1.5 text-xs text-white outline-none focus:border-[#1d90f4]"
                              />

                              <label className="flex cursor-pointer items-center gap-1.5 px-1.5 text-[11px] text-slate-200">
                                <input
                                  type="radio"
                                  name={`correct-option-${question.id ?? qIndex}`}
                                  checked={opt.is_correct}
                                  onChange={() =>
                                    setSingleCorrectQuizOption(qIndex, oIndex)
                                  }
                                  className="h-3.5 w-3.5 cursor-pointer accent-[#1d90f4]"
                                />
                                <span>Oikea</span>
                              </label>

                              <button
                                type="button"
                                onClick={() => removeQuizOption(qIndex, oIndex)}
                                className="cursor-pointer rounded border border-red-500/20 bg-red-500/10 p-1.5 text-red-400 transition hover:bg-red-500/20"
                                title="Poista vaihtoehto"
                              >
                                <FontAwesomeIcon
                                  icon={faTrash}
                                  className="text-[11px]"
                                />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center justify-between gap-2.5 border-t border-[#2A374B] px-6 py-4">
              <button
                type="button"
                onClick={addQuizQuestion}
                disabled={isSavingQuiz}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#2A374B] bg-[#182130] px-3.5 py-2 text-xs font-medium text-[#38bdf8] transition hover:border-[#1d90f4] disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>Lisää kysymys</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setQuizModalError(null)
                    setQuizModalForm(null)
                  }}
                  disabled={isSavingQuiz}
                  className="cursor-pointer rounded-lg border border-[#2A374B] bg-[#182130] px-4 py-2 text-xs font-medium text-slate-300 transition hover:text-white disabled:opacity-50"
                >
                  Peruuta
                </button>
                <button
                  type="submit"
                  disabled={isSavingQuiz}
                  className="cursor-pointer rounded-lg bg-[#1d90f4] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#1d90f4]/90 disabled:opacity-50"
                >
                  {isSavingQuiz
                    ? 'Tallennetaan...'
                    : quizModalForm.id
                      ? 'Tallenna muutokset'
                      : 'Tallenna tietovisa'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {lightModalForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => !isSavingLight && setLightModalForm(null)}
        >
          <form
            onSubmit={(e) => void handleSaveLight(e)}
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#2A374B] bg-[#1E2839] p-6 shadow-2xl [scrollbar-color:#2A374B_#131B27] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#2A374B] hover:[&::-webkit-scrollbar-thumb]:bg-[#3B4D68] [&::-webkit-scrollbar-track]:bg-[#131B27]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#2A374B] pb-2">
              <div>
                <h3 className="text-base font-bold text-white">
                  {lightModalForm.id
                    ? 'Muokkaa IALA-loistoa'
                    : 'Lisää uusi IALA-loisto'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLightModalForm(null)}
                disabled={isSavingLight}
                className="cursor-pointer rounded-lg p-1.5 text-[#718096] transition hover:text-white disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3.5 text-xs">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-medium text-slate-300">
                    Loiston nimi *
                  </label>
                  <input
                    type="text"
                    value={lightModalForm.name}
                    onChange={(e) =>
                      setLightModalForm((prev) =>
                        prev ? { ...prev, name: e.target.value } : null,
                      )
                    }
                    placeholder="esim. Karimerkki"
                    required
                    className="w-full rounded-md border border-[#2A374B] bg-[#182130] px-3 py-2 text-white placeholder-[#718096] outline-none focus:border-[#1d90f4]"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-slate-300">
                    Kategoria *
                  </label>
                  <input
                    type="text"
                    list="iala-light-category-options"
                    value={lightModalForm.category}
                    onChange={(e) =>
                      setLightModalForm((prev) =>
                        prev ? { ...prev, category: e.target.value } : null,
                      )
                    }
                    placeholder="Valitse tai kirjoita kategoria"
                    required
                    className="w-full rounded-md border border-[#2A374B] bg-[#182130] px-3 py-2 text-white placeholder-[#718096] outline-none focus:border-[#1d90f4]"
                  />
                  <datalist id="iala-light-category-options">
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-300">
                  Rytmi *
                </label>
                <input
                  type="text"
                  value={lightModalForm.rhythm}
                  onChange={(e) =>
                    setLightModalForm((prev) =>
                      prev ? { ...prev, rhythm: e.target.value } : null,
                    )
                  }
                  placeholder="esim. VQ(3) 5s"
                  required
                  className="w-full rounded-md border border-[#2A374B] bg-[#182130] px-3 py-2 font-mono text-white placeholder-[#718096] outline-none focus:border-[#1d90f4]"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-300">
                  Kuvaus
                </label>
                <textarea
                  rows={5}
                  value={lightModalForm.description}
                  onChange={(e) =>
                    setLightModalForm((prev) =>
                      prev ? { ...prev, description: e.target.value } : null,
                    )
                  }
                  placeholder="Lyhyt kuvaus merkin tai loiston merkityksestä..."
                  className="max-h-48 w-full resize-y rounded-md border border-[#2A374B] bg-[#182130] px-3 py-2 leading-relaxed text-white placeholder-[#718096] outline-none focus:border-[#1d90f4] [scrollbar-color:#2A374B_#182130] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#2A374B] hover:[&::-webkit-scrollbar-thumb]:bg-[#3B4D68] [&::-webkit-scrollbar-track]:bg-[#182130]"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-300">
                  Config (JSONB)
                </label>
                <textarea
                  rows={6}
                  value={lightModalForm.configText}
                  onChange={(e) =>
                    setLightModalForm((prev) =>
                      prev ? { ...prev, configText: e.target.value } : null,
                    )
                  }
                  className="max-h-60 w-full resize-y rounded-md border border-[#2A374B] bg-[#131B27] px-3 py-2 font-mono text-xs leading-relaxed text-[#38bdf8] outline-none focus:border-[#1d90f4] [scrollbar-color:#2A374B_#131B27] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#2A374B] hover:[&::-webkit-scrollbar-thumb]:bg-[#3B4D68] [&::-webkit-scrollbar-track]:bg-[#131B27]"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setLightModalForm(null)}
                disabled={isSavingLight}
                className="cursor-pointer rounded-lg border border-[#2A374B] bg-[#182130] px-4 py-2 text-xs font-medium text-slate-300 transition hover:text-white disabled:opacity-50"
              >
                Peruuta
              </button>
              <button
                type="submit"
                disabled={isSavingLight}
                className="cursor-pointer rounded-lg bg-[#1d90f4] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#1d90f4]/90 disabled:opacity-50"
              >
                {isSavingLight
                  ? 'Tallennetaan...'
                  : lightModalForm.id
                    ? 'Tallenna muutokset'
                    : 'Tallenna loisto'}
              </button>
            </div>
          </form>
        </div>
      )}

      {editingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => !isSavingUser && setEditingUser(null)}
        >
          <form
            onSubmit={(e) => void handleSaveUserEdit(e)}
            className="w-full max-w-md rounded-2xl border border-[#2A374B] bg-[#1E2839] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#2A374B] pb-2">
              <div>
                <h3 className="text-base font-bold text-white">
                  Muokkaa käyttäjää
                </h3>
                <p className="mt-0.5 font-mono text-[11px] text-[#718096]">
                  {editingUser.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                disabled={isSavingUser}
                className="cursor-pointer rounded-lg p-1.5 text-[#718096] transition hover:text-white disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3.5 text-xs">
              <div>
                <label className="mb-1 block font-medium text-slate-300">
                  Käyttäjätunnus
                </label>
                <input
                  type="text"
                  value={editingUser.username}
                  onChange={(e) =>
                    setEditingUser((prev) =>
                      prev ? { ...prev, username: e.target.value } : null,
                    )
                  }
                  required
                  className="w-full rounded-md border border-[#2A374B] bg-[#182130] px-3 py-2 text-white outline-none focus:border-[#1d90f4]"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-medium text-slate-300">
                    Etunimi
                  </label>
                  <input
                    type="text"
                    value={editingUser.first_name}
                    onChange={(e) =>
                      setEditingUser((prev) =>
                        prev ? { ...prev, first_name: e.target.value } : null,
                      )
                    }
                    className="w-full rounded-md border border-[#2A374B] bg-[#182130] px-3 py-2 text-white outline-none focus:border-[#1d90f4]"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-slate-300">
                    Sukunimi
                  </label>
                  <input
                    type="text"
                    value={editingUser.last_name}
                    onChange={(e) =>
                      setEditingUser((prev) =>
                        prev ? { ...prev, last_name: e.target.value } : null,
                      )
                    }
                    className="w-full rounded-md border border-[#2A374B] bg-[#182130] px-3 py-2 text-white outline-none focus:border-[#1d90f4]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-300">
                  Sähköpostiosoite
                </label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser((prev) =>
                      prev ? { ...prev, email: e.target.value } : null,
                    )
                  }
                  className="w-full rounded-md border border-[#2A374B] bg-[#182130] px-3 py-2 text-white outline-none focus:border-[#1d90f4]"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-slate-300">
                  Rooli
                </label>
                <div className="relative flex items-center">
                  <select
                    value={editingUser.role}
                    onChange={(e) =>
                      setEditingUser((prev) =>
                        prev
                          ? { ...prev, role: normalizeUserRole(e.target.value) }
                          : null,
                      )
                    }
                    className="w-full cursor-pointer appearance-none rounded-md border border-[#2A374B] bg-[#182130] py-2 pl-3 pr-8 text-white outline-none transition focus:border-[#1d90f4]"
                  >
                    <option value="user">Opiskelija</option>
                    <option value="teacher">Opettaja</option>
                    <option value="admin">Ylläpitäjä</option>
                  </select>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className="pointer-events-none absolute right-3 text-[11px] text-slate-300"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                disabled={isSavingUser}
                className="cursor-pointer rounded-lg border border-[#2A374B] bg-[#182130] px-4 py-2 text-xs font-medium text-slate-300 transition hover:text-white disabled:opacity-50"
              >
                Peruuta
              </button>
              <button
                type="submit"
                disabled={isSavingUser}
                className="cursor-pointer rounded-lg bg-[#1d90f4] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#1d90f4]/90 disabled:opacity-50"
              >
                {isSavingUser ? 'Tallennetaan...' : 'Tallenna muutokset'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}