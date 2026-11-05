import { useState, useRef, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUser,
  faGear,
  faRightFromBracket,
  faMagnifyingGlass,
  faChevronLeft,
  faChevronRight,
  faSquarePollVertical,
  faBell,
  faExclamation,
  faEnvelope,
} from '@fortawesome/free-solid-svg-icons'
import LighthouseMark from '#/components/LighthouseMark'
import { useNotificationStore } from './notificationStore'
import ProfileAvatar from './ProfileAvatar'

export default function ProfileLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const { notifications, setNotifications } = useNotificationStore()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()

  const navLinks = [
    { label: 'Profiili', icon: faUser, to: '/profile' },
    { label: 'Ilmoitukset', icon: faEnvelope, to: '/profile/notification' },
    { label: 'Tilastot', icon: faSquarePollVertical, to: '/profile/stats' },
    { label: 'Asetukset', icon: faGear, to: '/profile/settings' },
  ]

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  const handleNotificationClick = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
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
    <div className="flex min-h-screen w-full items-start bg-[#182130] font-['Inter',sans-serif] text-[#e2e8f0]">
      <div
        className={`sticky top-0 z-30 flex h-screen shrink-0 flex-col justify-between overflow-x-hidden border-r border-[#2A374B] bg-[#1E2839] transition-[width] duration-300 ease-in-out select-none ${
          collapsed ? 'w-[59px]' : 'w-[230px]'
        }`}
      >
        <div className="flex flex-col">
          <div className="flex h-16 shrink-0 items-center border-b border-[#2A374B] px-2">
            <div className="flex h-full w-full items-center justify-between overflow-hidden">
              <Link to="/" className="flex items-center text-white overflow-hidden">
                <div className="flex h-[42px] w-[42px] shrink-0 aspect-square items-center justify-center rounded-lg border border-[#1d90f4]/40 bg-[#1d90f4]/20 text-[#38bdf8]">
                  <LighthouseMark />
                </div>
                <span
                  className={`block whitespace-nowrap text-sm font-bold tracking-wide transition-[max-width,opacity,margin] duration-300 ease-in-out overflow-hidden ${
                    collapsed
                      ? 'max-w-0 opacity-0 ml-0'
                      : 'max-w-[140px] opacity-100 ml-2.5'
                  }`}
                >
                  Majakka
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#718096] transition-[max-width,opacity,margin] duration-300 ease-in-out hover:bg-white/5 hover:text-white cursor-pointer ${
                  collapsed
                    ? 'max-w-0 opacity-0 pointer-events-none -mr-4'
                    : 'max-w-[28px] opacity-100 mr-1'
                }`}
                title="Kutista valikko"
                aria-label="Kutista valikko"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
              </button>
            </div>
          </div>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-2">
            {navLinks.map((item) => {
              const isActive =
                item.to === '/profile'
                  ? location.pathname === '/profile' || location.pathname === '/profile/'
                  : location.pathname === item.to

              return (
                <li key={item.label} className="w-full">
                  <Link
                    to={item.to}
                    className={`flex h-[42px] w-full items-center rounded-lg border transition-colors duration-150 overflow-hidden ${
                      isActive
                        ? 'border-[#1d90f4]/30 bg-[#1d90f4]/15 text-[#38bdf8]'
                        : 'border-transparent text-[#718096] hover:bg-white/5 hover:text-white'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="flex h-10 w-10 shrink-0 aspect-square items-center justify-center text-base">
                      <FontAwesomeIcon icon={item.icon} />
                    </span>
                    <span
                      className={`block whitespace-nowrap text-sm font-medium transition-[max-width,opacity,margin] duration-300 ease-in-out overflow-hidden ${
                        collapsed
                          ? 'max-w-0 opacity-0 ml-0'
                          : 'max-w-[150px] opacity-100 ml-1.5'
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
        <div className="border-t border-[#2A374B] p-2">
          <button
            type="button"
            className="flex h-[42px] w-full items-center rounded-lg border border-rose-500/25 bg-rose-500/10 text-rose-500 transition hover:bg-rose-500/20 cursor-pointer overflow-hidden"
            title={collapsed ? 'Kirjaudu ulos' : undefined}
          >
            <span className="flex h-10 w-10 shrink-0 aspect-square items-center justify-center text-base">
              <FontAwesomeIcon icon={faRightFromBracket} />
            </span>
            <span
              className={`block whitespace-nowrap text-sm font-semibold transition-[max-width,opacity,margin] duration-300 ease-in-out overflow-hidden ${
                collapsed
                  ? 'max-w-0 opacity-0 ml-0'
                  : 'max-w-[150px] opacity-100 ml-1.5'
              }`}
            >
              Kirjaudu ulos
            </span>
          </button>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#2A374B] bg-[#182130]/90 px-6 backdrop-blur-md">
          <div className="flex items-center gap-4">
            {collapsed && (
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#2A374B] bg-[#1E2839] text-[#718096] shadow-sm transition hover:border-[#1d90f4] hover:bg-[#253347] hover:text-white cursor-pointer"
                title="Laajenna valikko"
                aria-label="Laajenna valikko"
              >
                <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
              </button>
            )}
            <div className="relative w-72">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs text-[#718096]">
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </span>
              <input
                type="text"
                placeholder="Hae..."
                className="w-full rounded-lg border border-[#2A374B] bg-[#131B27] py-2 pr-4 pl-9 text-xs text-white outline-none transition focus:border-[#1d90f4]"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#2A374B] bg-[#1E2839] text-[#8B9BB4] transition hover:border-[#1d90f4] hover:text-white cursor-pointer"
                aria-label="Ilmoitukset"
              >
                <FontAwesomeIcon icon={faBell} className="text-xs" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-md">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-[#2A374B] bg-[#1E2839] shadow-2xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[#2A374B] px-4 py-3 bg-[#16202E]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Ilmoitukset</span>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-[#1d90f4]/20 px-2 py-0.5 text-[10px] font-semibold text-[#38bdf8] border border-[#1d90f4]/30">
                          {unreadCount} uutta
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-[11px] font-medium text-[#38bdf8] hover:underline cursor-pointer"
                      >
                        Merkitse luetuksi
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#2A374B]/50">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-[#718096]">
                        Ei ilmoituksia.
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleNotificationClick(item.id)}
                          className="flex items-start gap-3 px-4 py-3 text-xs bg-transparent transition-colors hover:bg-white/[0.03] cursor-pointer"
                        >
                          <div className="mt-0.5 shrink-0 text-[#38bdf8]">
                            <FontAwesomeIcon icon={faBell} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-white">{item.title}</span>
                              {!item.read && (
                                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shrink-0">
                                  <FontAwesomeIcon icon={faExclamation} />
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 text-[#8B9BB4] leading-relaxed">
                              {item.description}
                            </div>
                            <time className="mt-1 block text-[10px] text-[#718096]">
                              {item.time}
                            </time>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-[#1d90f4] bg-[#131B27] text-xs text-[#38bdf8]">
                <ProfileAvatar />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white">Firstname Lastname</span>
              </div>
            </div>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  )
}