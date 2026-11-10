import { useEffect, useState } from 'react'
import { deleteContactMessage, listContactMessages } from '../../client'
import type { ContactMessageResponse } from '../../client'
import { getApiErrorMessage } from '../../api/errors'
import { useAuthUser } from '../../components/authUserStore'

// Admin view of messages sent through the contact form: list newest first
// and delete handled ones. The backend rejects non-admins with 403.
export default function ContactMessagesPage() {
  const authUser = useAuthUser()
  const isAdmin = authUser?.role === 'admin'
  const [messages, setMessages] = useState<ContactMessageResponse[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Don't call the endpoint for users who would only get 401/403.
    if (!isAdmin) return

    async function loadMessages() {
      const result = await listContactMessages()

      if (result.error) {
        setError(getApiErrorMessage(result))
        return
      }

      setError(null)
      setMessages(result.data)
    }

    void loadMessages()
  }, [isAdmin])

  async function handleDelete(message: ContactMessageResponse) {
    if (!window.confirm(`Poistetaanko viesti: ${message.topic}?`)) return

    const result = await deleteContactMessage({
      path: { message_id: message.id },
    })

    if (result.error) {
      setError(getApiErrorMessage(result))
      return
    }

    // Drop it locally instead of reloading the whole list.
    setMessages((current) => current.filter((m) => m.id !== message.id))
  }

  return (
    <main className="flex-1 bg-navy-900 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
          Ylläpito
        </p>

        <h1 className="mt-4 font-serif text-4xl font-semibold">
          Yhteydenotot
        </h1>

        <p className="mt-4 text-slate-300">
          Yhteydenottolomakkeella lähetetyt viestit, uusin ensin.
        </p>

        {!isAdmin ? (
          <p className="mt-8 text-slate-300">
            Tämä sivu on vain ylläpitäjille.
          </p>
        ) : error ? (
          <p className="mt-8 text-red-300">{error}</p>
        ) : messages.length === 0 ? (
          <p className="mt-8 text-slate-300">Viestejä ei ole.</p>
        ) : (
          <ul className="mt-10 space-y-6">
            {messages.map((message) => (
              <li
                key={message.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-2xl font-semibold">
                      {message.topic}
                    </h2>
                    <p className="mt-1 text-sm text-slate-300">
                      {message.first_name} {message.last_name} ·{' '}
                      <a
                        href={`mailto:${message.email}`}
                        className="text-amber-300 hover:underline"
                      >
                        {message.email}
                      </a>{' '}
                      · {new Date(message.created_at).toLocaleString('fi-FI')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleDelete(message)}
                    className="rounded-full border border-red-400/60 px-4 py-1.5 text-sm font-semibold text-red-300 transition hover:bg-red-400/10"
                  >
                    Poista
                  </button>
                </div>

                <p className="mt-4 whitespace-pre-line text-slate-200">
                  {message.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
