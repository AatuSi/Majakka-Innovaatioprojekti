import { useState, useEffect } from 'react'
import { useSearch, useNavigate } from '@tanstack/react-router'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTrashCan,
  faStar as faStarSolid,
  faCheckDouble,
  faEnvelopeOpen,
} from '@fortawesome/free-solid-svg-icons'
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons'
import { getDisplayName, useAuthUser } from '../../components/authUserStore'
import { useNotificationStore } from './notificationStore'
import ProfileAvatar from './ProfileAvatar'
import { card, eyebrow, sectionIntro, sectionTitle } from './profileStyles'

export default function ProfileNotificationPage() {
  const { notifications, setNotifications } = useNotificationStore()
  const authUser = useAuthUser()
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

  const tabClass = (active: boolean) =>
    `relative flex items-center gap-2 py-3 text-sm transition-colors cursor-pointer after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#1D90F4] after:transition-transform after:duration-300 ${
      active
        ? 'text-[#1D90F4] after:scale-x-100'
        : 'text-[#9fb0c7] after:scale-x-0 hover:text-white'
    }`

  return (
    <div className="flex flex-col gap-8">
      <div>
        <span className={eyebrow}>Viestit</span>
        <h2 className={`mt-1 ${sectionTitle}`}>Ilmoitukset</h2>
        <p className={sectionIntro}>Pysy ajan tasalla tärkeistä viesteistä ja tapahtumista.</p>
      </div>

      <div className={`${card} grid min-h-[600px] grid-cols-1 overflow-hidden lg:grid-cols-[400px_1fr]`}>
        {/* message list */}
        <div className="flex flex-col border-b border-[#2A3548] bg-[#0F1724]/70 lg:border-r lg:border-b-0">
          <div className="flex items-center justify-between border-b border-[#2A3548] px-5 py-4">
            <label className="flex items-center gap-3 text-sm text-[#9fb0c7] cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="h-4 w-4 accent-[#1D90F4] cursor-pointer"
                aria-label="Valitse kaikki"
              />
              {notifications.length} ilmoitusta
            </label>
            <div className="flex items-center gap-1 text-[#9fb0c7]">
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[#1D90F4]/10 hover:text-[#1D90F4] cursor-pointer"
                title="Merkitse kaikki luetuiksi"
                aria-label="Merkitse kaikki luetuiksi"
              >
                <FontAwesomeIcon icon={faCheckDouble} className="text-sm" />
              </button>
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-rose-500/10 hover:text-rose-400 cursor-pointer"
                title="Poista valitut"
                aria-label="Poista valitut"
              >
                <FontAwesomeIcon icon={faTrashCan} className="text-sm" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6 border-b border-[#2A3548] px-5">
            <button type="button" onClick={() => setSelectedTab('all')} className={tabClass(selectedTab === 'all')}>
              <span>Kaikki</span>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1D90F4] px-1 text-[11px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('favorite')}
              className={tabClass(selectedTab === 'favorite')}
            >
              <span>Suosikit</span>
              <span className="text-xs text-[#718096]">{favoriteCount}</span>
            </button>
          </div>

          <div className="flex max-h-[520px] flex-col divide-y divide-[#2A3548]/50 overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-sm font-light text-[#9fb0c7]">
                {selectedTab === 'favorite' ? 'Ei suosikkeja.' : 'Ei ilmoituksia.'}
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = msg.id === selectedMessageId
                return (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg.id)}
                    className={`relative flex cursor-pointer flex-col gap-1.5 px-5 py-4 transition-colors ${
                      isSelected
                        ? 'bg-[#1D90F4]/10 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-[#1D90F4]'
                        : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <input
                          type="checkbox"
                          checked={msg.selected}
                          onClick={(e) => toggleSelectOne(msg.id, e)}
                          onChange={() => {}}
                          className="h-4 w-4 shrink-0 accent-[#1D90F4] cursor-pointer"
                          aria-label={`Valitse: ${msg.title}`}
                        />
                        <span
                          aria-hidden="true"
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            msg.read ? 'bg-[#2A3548]' : 'bg-[#1D90F4] shadow-[0_0_8px_2px_rgba(29,144,244,0.6)]'
                          }`}
                        />
                        <span className={`truncate text-sm ${msg.read ? 'text-[#c3cddb]' : 'font-medium text-white'}`}>
                          {msg.title}
                        </span>
                      </div>
                      <span className="shrink-0 text-[11px] text-[#718096]">{msg.time}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 pl-12">
                      <p className="truncate text-xs font-light text-[#9fb0c7]">{msg.description}</p>
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(msg.id, e)}
                        className={`text-sm transition cursor-pointer ${
                          msg.favorite ? 'text-amber-300' : 'text-[#718096] hover:text-white'
                        }`}
                        aria-label="Merkitse suosikiksi"
                      >
                        <FontAwesomeIcon icon={msg.favorite ? faStarSolid : faStarRegular} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* reading pane */}
        <div className="flex flex-col p-6 sm:p-8">
          {selectedMessage ? (
            <article className="flex flex-col gap-6">
              <div className="flex items-start justify-between gap-4 border-b border-[#2A3548] pb-5">
                <div>
                  <time className="text-xs uppercase tracking-widest text-[#718096]">{selectedMessage.time}</time>
                  <h3 className="mt-1 text-2xl font-light text-[#1D90F4]">{selectedMessage.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={(e) => toggleFavorite(selectedMessage.id, e)}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#2A3548] transition cursor-pointer ${
                    selectedMessage.favorite
                      ? 'text-amber-300'
                      : 'text-[#718096] hover:border-[#1D90F4]/60 hover:text-white'
                  }`}
                  aria-label="Merkitse suosikiksi"
                >
                  <FontAwesomeIcon icon={selectedMessage.favorite ? faStarSolid : faStarRegular} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#2A3548] bg-[#0F1724] text-sm text-[#38bdf8]">
                  <ProfileAvatar />
                </div>
                <div className="text-sm font-medium text-white">
                  {getDisplayName(authUser)}
                </div>
              </div>
              <p className="font-light leading-7 text-[#c3cddb]">{selectedMessage.description}</p>
            </article>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#2A3548] bg-[#0F1724] text-2xl text-[#2A3548]">
                <FontAwesomeIcon icon={faEnvelopeOpen} className="text-[#718096]" />
              </div>
              <p className="text-sm font-light text-[#9fb0c7]">Valitse luettava ilmoitus listasta.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
