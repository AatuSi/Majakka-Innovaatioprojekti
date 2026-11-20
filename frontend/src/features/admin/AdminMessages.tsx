import { useState, useEffect, useMemo, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEnvelope,
  faRotateRight,
  faMagnifyingGlass,
  faTriangleExclamation,
  faUser,
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

interface ContactMessageApiRecord {
  id: string | number
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  topic?: string | null
  message?: string | null
  created_at?: string | null
}

interface MessageItem {
  id: string
  fullName: string
  email: string
  subject: string
  body: string
  createdAt?: string | null
}

const formatMessageTime = (iso?: string | null): string => {
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

const themedScrollClass =
  'pr-1.5 [scrollbar-width:thin] [scrollbar-color:#2A374B_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#131B27]/60 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border [&::-webkit-scrollbar-thumb]:border-[#1E2839] [&::-webkit-scrollbar-thumb]:bg-[#2A374B] hover:[&::-webkit-scrollbar-thumb]:bg-[#38bdf8]/60'

export default function AdminMessages() {
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
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

  const fetchMessagesData = useCallback(
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
        const res = await fetch(`${baseUrl}/contact`, {
          method: 'GET',
          headers,
        })
        if (!checkMounted()) return

        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Kirjautuminen vaaditaan tai istunto on vanhentunut (401).')
          }
          if (res.status === 403) {
            throw new Error('Viestien lukeminen vaatii ylläpitäjän oikeudet (403).')
          }
          if (res.status === 405) {
            throw new Error('Virheellinen HTTP-metodi /contact-reitille (405).')
          }
          throw new Error(`Yhteydenottoviestien haku epäonnistui (HTTP ${res.status}).`)
        }

        const rawData = (await res.json()) as unknown
        const rawList: ContactMessageApiRecord[] = Array.isArray(rawData)
          ? (rawData as ContactMessageApiRecord[])
          : []

        const normalized: MessageItem[] = rawList.map((m, idx) => {
          const combinedName = [m.first_name, m.last_name].filter(Boolean).join(' ').trim()
          const topicText = (m.topic || '').trim()

          return {
            id: String(m.id ?? `contact-${idx}`),
            fullName: combinedName || 'Tuntematon lähettäjä',
            email: (m.email || '').trim() || '—',
            subject: topicText || 'Palautetta simulaattorista',
            body: m.message || '',
            createdAt: m.created_at,
          }
        })

        setMessages(normalized)
        setSelectedMessageId((prev) =>
          prev && normalized.some((item) => item.id === prev) ? prev : null
        )

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
        const mapped = getApiErrorMessage(err)
        const fallback = err instanceof Error && err.message ? err.message : mapped
        addToast(mapped === 'Jokin meni vikaan. Yritä uudelleen.' ? fallback : mapped)
      }
    },
    [addToast]
  )

  useEffect(() => {
    let isMounted = true
    const handler = setTimeout(() => {
      void fetchMessagesData({ isMounted: () => isMounted })
    }, 250)

    return () => {
      isMounted = false
      clearTimeout(handler)
    }
  }, [fetchMessagesData])

  const filteredMessages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return messages
    return messages.filter(
      (msg) =>
        msg.subject.toLowerCase().includes(q) ||
        msg.fullName.toLowerCase().includes(q) ||
        msg.email.toLowerCase().includes(q) ||
        msg.body.toLowerCase().includes(q)
    )
  }, [messages, searchQuery])

  const selectedMessage = useMemo(
    () => messages.find((m) => m.id === selectedMessageId) ?? null,
    [messages, selectedMessageId]
  )

  return (
    <div className="relative flex flex-col gap-6 p-8">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <FontAwesomeIcon icon={faEnvelope} className="text-xl text-[#38bdf8]" />
            <h1 className="text-2xl font-bold text-white">Yhteydenotot</h1>
          </div>
          <p className="mt-1 text-xs text-[#718096]">
            Yhteydenottolomakkeelta saapuneet viestit ja palautteet.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchMessagesData({ manual: true })}
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="flex max-h-[660px] flex-col rounded-[16px] border border-[#2A374B] bg-[#1E2839] p-5 shadow-2xl lg:col-span-1">
          <div className="relative mb-4 shrink-0">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs text-[#718096]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hae otsikolla, nimellä tai sisällöllä..."
              className="w-full rounded-lg border border-[#2A374B] bg-[#182130] py-2 pr-3 pl-8 text-xs text-white placeholder-[#718096] outline-none focus:border-[#1d90f4]"
            />
          </div>

          <div className={`flex flex-col gap-2.5 overflow-y-auto ${themedScrollClass}`}>
            {isInitialLoading ? (
              <div className="rounded-xl border border-[#2A374B] bg-[#131B27]/80 p-4 text-center text-xs text-[#38bdf8]">
                Ladataan yhteydenottoja...
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="rounded-xl border border-[#2A374B] bg-[#131B27]/80 p-4 text-center text-xs text-[#718096]">
                Ei viestejä näytettäväksi.
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id
                return (
                  <button
                    key={msg.id}
                    type="button"
                    onClick={() => setSelectedMessageId(msg.id)}
                    className={`flex w-full cursor-pointer flex-col gap-1.5 rounded-xl border p-3.5 text-left transition ${
                      isSelected
                        ? 'border-[#1d90f4] bg-[#182130]'
                        : 'border-[#2A374B] bg-[#131B27]/70 hover:border-[#1d90f4]/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="line-clamp-1 text-xs font-semibold text-white">
                        {msg.subject}
                      </span>
                      <span className="shrink-0 text-[10px] text-[#718096]">
                        {formatMessageTime(msg.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#38bdf8]">
                      <FontAwesomeIcon icon={faUser} className="text-[10px]" />
                      <span className="truncate">{msg.fullName}</span>
                    </div>

                    <div className="line-clamp-1 text-[11px] text-[#718096]">
                      {msg.body || 'Ei lisätekstiä'}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </section>

        <section className="flex max-h-[660px] flex-col rounded-[16px] border border-[#2A374B] bg-[#1E2839] p-6 shadow-2xl lg:col-span-2">
          {!selectedMessage ? (
            <div className="flex min-h-[320px] flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#2A374B] bg-[#131B27]/50 p-6 text-center">
              <p className="text-xs font-medium text-slate-300">
                Valitse viesti vasemmalta listasta
              </p>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col justify-between gap-6">
              <div className="flex min-h-0 flex-1 flex-col gap-4">
                <div className="border-b border-[#2A374B]/70 pb-4">
                  <h2 className="m-0 text-lg font-semibold text-white">
                    {selectedMessage.subject}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2.5 text-xs text-[#718096]">
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-200">
                      <FontAwesomeIcon icon={faUser} className="text-[11px] text-[#38bdf8]" />
                      {selectedMessage.fullName}
                    </span>
                    <span>·</span>
                    <span className="text-[11px] text-[#94a3b8]">
                      {selectedMessage.email}
                    </span>
                  </div>
                </div>

                <div
                  className={`min-h-0 flex-1 overflow-y-auto rounded-xl border border-[#2A374B] bg-[#131B27]/80 p-5 text-xs leading-relaxed whitespace-pre-wrap text-slate-200 ${themedScrollClass}`}
                >
                  {selectedMessage.body || 'Viestissä ei ole leipätekstiä.'}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#2A374B]/50 pt-3 text-[11px] text-[#718096]">
                <span>Lähetetty: {formatMessageTime(selectedMessage.createdAt)}</span>
                <span className="text-[10px]">ID: {selectedMessage.id}</span>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}