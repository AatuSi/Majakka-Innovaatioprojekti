import { useState, useRef, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUser,
  faGear,
  faRightFromBracket,
  faSquarePollVertical,
  faBell,
  faEnvelope,
} from '@fortawesome/free-solid-svg-icons'
import { useNotificationStore } from './notificationStore'
import ProfileAvatar from './ProfileAvatar'
import { eyebrow, gridStyle } from './profileStyles'

const navLinks = [
  { label: 'Profiili', icon: faUser, to: '/profile' },
  { label: 'Ilmoitukset', icon: faEnvelope, to: '/profile/notification' },
  { label: 'Tilastot', icon: faSquarePollVertical, to: '/profile/stats' },
  { label: 'Asetukset', icon: faGear, to: '/profile/settings' },
] as const

// Same animated underline as the main navigation in the site header.
const tabBase =
  "relative inline-flex items-center gap-2 whitespace-nowrap pb-3 pt-1 text-base transition-colors duration-300 motion-reduce:transition-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:bg-[#1D90F4] after:transition-transform after:duration-300 after:ease-out motion-reduce:after:transition-none hover:text-[#1D90F4] hover:after:scale-x-100"
const tabActive = 'text-[#1D90F4] after:scale-x-100'
const tabInactive = 'text-[#c3cddb] after:scale-x-0'

export default function ProfileLayout() {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const { notifications, setNotifications } = useNotificationStore()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  const handleNotificationClick = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    )
    setNotificationsOpen(false)
    navigate({ to: '/profile/notification', search: { id } })
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div
      className="relative flex-1 bg-[#182130] font-['Inter',sans-serif] text-[#E3E3E3]"
      style={gridStyle}
    >
      {/* profile banner */}
      <section className="border-b border-[#2A3548]/80">
        <div className="mx-auto max-w-6xl px-6 pt-12 lg:pt-16">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#1D90F4] bg-[#0F1724] text-3xl text-[#38bdf8] shadow-lg shadow-[#1D90F4]/20">
                <ProfileAvatar />
              </div>
              <div>
                <span className={eyebrow}>Oma profiili</span>
                <h1 className="mt-1 text-3xl font-light text-white sm:text-4xl">
                  Firstname Lastname
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-[#2A3548] bg-[#0F1724] text-[#c3cddb] transition hover:border-[#1D90F4]/60 hover:text-white cursor-pointer"
                  aria-label="Ilmoitukset"
                  aria-expanded={notificationsOpen}
                >
                  <FontAwesomeIcon icon={faBell} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1D90F4] px-1 text-[11px] font-bold text-white shadow-md shadow-[#1D90F4]/40">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 z-40 mt-3 w-80 overflow-hidden rounded-xl border border-[#2A3548] bg-[#0F1724]/95 shadow-2xl backdrop-blur-xl">
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
                          className="text-xs font-medium text-[#1D90F4] underline-offset-4 hover:underline cursor-pointer"
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
                            className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#1D90F4]/5 cursor-pointer"
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

              <button
                type="button"
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 text-sm font-medium text-rose-400 transition hover:bg-rose-500/20 cursor-pointer"
              >
                <FontAwesomeIcon icon={faRightFromBracket} />
                <span>Kirjaudu ulos</span>
              </button>
            </div>
          </div>

          <nav aria-label="Profiilin valikko" className="mt-10 -mb-px overflow-x-auto">
            <ul className="flex items-center gap-8">
              {navLinks.map((item) => {
                const isActive =
                  item.to === '/profile'
                    ? location.pathname === '/profile' || location.pathname === '/profile/'
                    : location.pathname === item.to

                return (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      aria-current={isActive ? 'page' : undefined}
                      className={`${tabBase} ${isActive ? tabActive : tabInactive}`}
                    >
                      <FontAwesomeIcon icon={item.icon} className="text-sm" />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-12">
        <Outlet />
      </div>
    </div>
  )
}
