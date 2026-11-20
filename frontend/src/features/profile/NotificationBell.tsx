import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell } from '@fortawesome/free-solid-svg-icons'
import { useNotificationStore } from './notificationStore'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { notifications, setNotifications } = useNotificationStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  const handleNotificationClick = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    )
    setOpen(false)
    navigate({ to: '/profile/notification', search: { id } })
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="sm:relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#2A3548] bg-[#0F1724] text-[#c3cddb] transition hover:border-[#1D90F4]/60 hover:text-white"
        aria-label="Ilmoitukset"
        aria-expanded={open}
      >
        <FontAwesomeIcon icon={faBell} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1D90F4] px-1 text-[11px] font-bold text-white shadow-md shadow-[#1D90F4]/40">
            {unreadCount}
          </span>
        )}
      </button>

      {/* On phones the bell is too far from the screen edge to anchor to. */}
      {open && (
        <div className="absolute inset-x-4 top-[5.5rem] z-40 overflow-hidden rounded-xl border border-[#2A3548] bg-[#0F1724] shadow-2xl sm:inset-x-auto sm:top-full sm:right-0 sm:mt-3 sm:w-80">
          <div className="flex items-center justify-between border-b border-[#2A3548] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">Ilmoitukset</span>
              {unreadCount > 0 && (
                <span className="rounded-full border border-[#1D90F4]/30 bg-[#1D90F4]/15 px-2 py-0.5 text-[11px] font-semibold text-[#38bdf8]">
                  {unreadCount} uutta
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="cursor-pointer text-xs font-medium text-[#1D90F4] underline-offset-4 hover:underline"
              >
                Merkitse luetuksi
              </button>
            )}
          </div>
          <div className="max-h-80 divide-y divide-[#2A3548]/60 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm font-light text-[#9fb0c7]">
                Ei ilmoituksia.
              </div>
            ) : (
              notifications.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => handleNotificationClick(item.id)}
                  className="flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#1D90F4]/5"
                >
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      item.read ? 'bg-[#2A3548]' : 'bg-[#1D90F4] shadow-[0_0_8px_2px_rgba(29,144,244,0.6)]'
                    }`}
                  />
                  <span className="flex-1">
                    <span className={`block text-sm ${item.read ? 'text-[#c3cddb]' : 'font-medium text-white'}`}>
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-xs font-light leading-relaxed text-[#9fb0c7]">
                      {item.description}
                    </span>
                    <time className="mt-1 block text-[11px] text-[#718096]">{item.time}</time>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
