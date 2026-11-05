import { useState, useEffect } from 'react'
import { useSearch, useNavigate } from '@tanstack/react-router'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBell,
  faTrashCan,
  faStar as faStarSolid,
  faCheckDouble,
  faEnvelopeOpen,
} from '@fortawesome/free-solid-svg-icons'
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons'
import { useNotificationStore } from './notificationStore'
import ProfileAvatar from './ProfileAvatar'

export default function ProfileNotificationPage() {
  const { notifications, setNotifications } = useNotificationStore()
  const [selectedTab, setSelectedTab] = useState<'all' | 'favorite'>('all')
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  )

  const searchParams = useSearch({ strict: false }) as { id?: string }
  const navigate = useNavigate()

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const notificationId = searchParams?.id || urlParams.get('id')

    if (notificationId) {
      setSelectedMessageId(notificationId)

      const targetMessage = notifications.find((m) => m.id === notificationId)
      if (targetMessage && !targetMessage.read) {
        setNotifications((prev) =>
          prev.map((m) => (m.id === notificationId ? { ...m, read: true } : m)),
        )
      }
    } else {
      setSelectedMessageId(null)
    }
  }, [searchParams, notifications, setNotifications])

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setNotifications(notifications.map((m) => ({ ...m, selected: checked })))
  }

  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setNotifications(
      notifications.map((m) =>
        m.id === id ? { ...m, selected: !m.selected } : m,
      ),
    )
  }

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setNotifications(
      notifications.map((m) =>
        m.id === id ? { ...m, favorite: !m.favorite } : m,
      ),
    )
  }

  const handleDeleteSelected = () => {
    setNotifications(notifications.filter((m) => !m.selected))
    if (
      selectedMessageId &&
      notifications.find((m) => m.id === selectedMessageId)?.selected
    ) {
      setSelectedMessageId(null)
      navigate({ to: '/profile/notification', search: {} })
    }
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((m) => ({ ...m, read: true })))
  }

  const filteredMessages = notifications.filter((m) => {
    if (selectedTab === 'favorite') {
      return m.favorite
    }
    return true
  })

  const selectedMessage = notifications.find((m) => m.id === selectedMessageId)

  const unreadCount = notifications.filter((m) => !m.read).length
  const favoriteCount = notifications.filter((m) => m.favorite).length
  const allSelected =
    notifications.length > 0 && notifications.every((m) => m.selected)

  const handleSelectMessage = (id: string) => {
    setSelectedMessageId(id)
    setNotifications(
      notifications.map((m) => (m.id === id ? { ...m, read: true } : m)),
    )
    navigate({ to: '/profile/notification', search: { id } })
  }

  return (
    <main className="mx-auto w-full max-w-[1350px] p-8">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-white">Ilmoitukset</h1>
          <p className="mt-1 text-xs text-[#718096]">Pysy ajan tasalla tärkeistä viesteistä ja tapahtumista.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] overflow-hidden rounded-xl border border-[#2A374B] bg-[#1E2839] shadow-2xl min-h-[600px]">
          <div className="flex flex-col border-r border-[#2A374B] bg-[#16202E]">
            <div className="flex items-center gap-2.5 border-b border-[#2A374B] p-4">
              <span className="text-[#38bdf8]">
                <FontAwesomeIcon icon={faBell} />
              </span>
              <h2 className="text-sm font-bold text-white">Ilmoitus</h2>
            </div>

            <div className="flex items-center justify-between border-b border-[#2A374B] px-4 py-3 bg-[#182130]">
              <span className="text-xs text-[#8B9BB4]">
                {notifications.length} Ilmoitusta
              </span>
              <div className="flex items-center gap-3 text-[#8B9BB4]">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="rounded border-[#2A374B] bg-[#131B27] accent-[#1d90f4] cursor-pointer"
                  aria-label="Valitse kaikki"
                />
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="hover:text-white cursor-pointer transition"
                  title="Merkitse kaikki luetuiksi"
                  aria-label="Merkitse kaikki luetuiksi"
                >
                  <FontAwesomeIcon icon={faCheckDouble} className="text-xs" />
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="hover:text-rose-400 cursor-pointer transition"
                  title="Poista valitut"
                  aria-label="Poista valitut"
                >
                  <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-6 border-b border-[#2A374B] px-4 text-xs font-semibold bg-[#16202E]">
              <button
                type="button"
                onClick={() => setSelectedTab('all')}
                className={`relative py-3 cursor-pointer transition-colors flex items-center gap-2 ${
                  selectedTab === 'all'
                    ? 'text-[#38bdf8]'
                    : 'text-[#8B9BB4] hover:text-white'
                }`}
              >
                {unreadCount > 0 && (
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
                <span>Kaikki</span>
                {selectedTab === 'all' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#38bdf8]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab('favorite')}
                className={`relative py-3 cursor-pointer transition-colors flex items-center gap-2 ${
                  selectedTab === 'favorite'
                    ? 'text-[#38bdf8]'
                    : 'text-[#8B9BB4] hover:text-white'
                }`}
              >
                <span>{favoriteCount} Suosikki</span>
                {selectedTab === 'favorite' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#38bdf8]" />
                )}
              </button>
            </div>

            <div className="flex flex-col divide-y divide-[#2A374B]/40 overflow-y-auto max-h-[520px]">
              {filteredMessages.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#718096]">
                  Ei suosikkia.
                </div>
              ) : (
                filteredMessages.map((msg) => {
                  const isSelected = msg.id === selectedMessageId
                  return (
                    <div
                      key={msg.id}
                      onClick={() => handleSelectMessage(msg.id)}
                      className={`flex flex-col gap-1 p-3.5 cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#1E2839]' : 'hover:bg-white/[0.02]'
                      } ${!msg.read ? 'bg-[#131B27]/40 font-semibold' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={msg.selected}
                            onClick={(e) => toggleSelectOne(msg.id, e)}
                            onChange={() => {}}
                            className="rounded border-[#2A374B] bg-[#131B27] accent-[#1d90f4] cursor-pointer"
                            aria-label={`Valitse: ${msg.title}`}
                          />
                          <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-[#131B27] text-[10px] text-[#38bdf8] border border-[#2A374B]">
                            <ProfileAvatar />
                          </div>
                          <span className="text-xs text-white">
                            Firstname Lastname
                          </span>
                        </div>
                        <span className="text-[10px] text-[#718096]">
                          {msg.time}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pl-7">
                        <p
                          className={`text-xs truncate pr-2 ${!msg.read ? 'text-white font-medium' : 'text-[#8B9BB4]'}`}
                        >
                          {msg.title} - {msg.description}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(msg.id, e)}
                          className={`text-xs transition ${
                            msg.favorite
                              ? 'text-amber-400'
                              : 'text-[#718096] hover:text-white'
                          } cursor-pointer`}
                          aria-label="Merkitse suosikiksi"
                        >
                          <FontAwesomeIcon
                            icon={msg.favorite ? faStarSolid : faStarRegular}
                          />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
          <div className="flex flex-col bg-[#1E2839] p-6">
            {selectedMessage ? (
              <div className="flex flex-col gap-6">
                <div className="flex items-start justify-between border-b border-[#2A374B] pb-4">
                  <h2 className="text-base font-bold text-white">
                    {selectedMessage.title}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-[#8B9BB4]">
                    <span>{selectedMessage.time}</span>
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(selectedMessage.id, e)}
                      className={`cursor-pointer ${selectedMessage.favorite ? 'text-amber-400' : 'text-[#718096] hover:text-white'}`}
                      aria-label="Merkitse suosikiksi"
                    >
                      <FontAwesomeIcon
                        icon={
                          selectedMessage.favorite ? faStarSolid : faStarRegular
                        }
                      />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#131B27] text-xs text-[#38bdf8] border border-[#2A374B]">
                    <ProfileAvatar />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Firstname Lastname {/* tähän tulee myöhemmin käyttäjän etunimi ja sukunimi, aluks se on vaa mockkina */}
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-[#C5D1E0] leading-relaxed">
                  {selectedMessage.description}
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-xs text-[#718096]">
                <FontAwesomeIcon
                  icon={faEnvelopeOpen}
                  className="text-2xl text-[#2A374B]"
                />
                <span>Valitse luettava kohde</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}