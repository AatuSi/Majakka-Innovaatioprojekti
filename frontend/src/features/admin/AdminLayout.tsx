import { useEffect, useState } from 'react'
import { Link, notFound, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUser,
  faRightFromBracket,
  faMagnifyingGlass,
  faChevronLeft,
  faChevronRight,
  faSquarePollVertical,
  faDatabase,
  faChartColumn,
  faClipboardList,
  faEnvelope,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import LighthouseMark from '#/components/LighthouseMark'
import { getAccessToken } from '#/api/config'
import { logoutUser, useAuthUser } from '#/components/authUserStore'

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const authUser = useAuthUser()
  const [collapsed, setCollapsed] = useState(false)
  const [currentUser, setCurrentUser] = useState(authUser)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    setCurrentUser(authUser)

    const token = getAccessToken()
    const userId = authUser?.id
    if (!token || !userId) return

    const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
    void fetch(`${baseUrl}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) return
        const user = await response.json()
        setCurrentUser((previous) =>
          previous ? { ...previous, ...user } : user
        )
      })
      .catch(() => {})
  }, [authUser])

  useEffect(() => {
    if (!showLogoutConfirm) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowLogoutConfirm(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showLogoutConfirm])

  if (typeof window === 'undefined') {
    return null
  }

  if (
    !getAccessToken() || authUser?.role !== 'admin'
  ) {
    throw notFound()
  }

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true)
  }

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false)
  }

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false)
    logoutUser()
    void navigate({ to: '/', replace: true })
  }

  const displayName =
    [currentUser?.first_name, currentUser?.last_name].filter(Boolean).join(' ') ||
    currentUser?.username ||
    'Käyttäjä'

  const navLinks = [
    { label: 'Hallintapaneeli', icon: faChartColumn, to: '/admin' },
    { label: 'Tilastot', icon: faSquarePollVertical, to: '/admin/statistics' },
    { label: 'Tietokanta', icon: faDatabase, to: '/admin/database' },
    { label: 'Tietovisat', icon: faClipboardList, to: '/admin/quizzes' },
    { label: 'Yhteydenotot', icon: faEnvelope, to: '/admin/messages' },
  ]

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
            onClick={handleLogoutClick}
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
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-[#1d90f4] bg-[#131B27] text-xs text-[#38bdf8]">
                <FontAwesomeIcon icon={faUser} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white">{displayName}</span>
              </div>
            </div>
          </div>
        </header>
        <Outlet />
      </div>

      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={handleCancelLogout}
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-confirm-title"
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[#2A374B] bg-[#1E2839] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#2A374B] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-rose-500/25 bg-rose-500/10 text-rose-400">
                  <FontAwesomeIcon icon={faRightFromBracket} className="text-sm" />
                </div>
                <div>
                  <h3 id="logout-confirm-title" className="text-sm font-bold text-white">
                    Vahvista uloskirjautuminen
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelLogout}
                className="cursor-pointer rounded-lg p-1.5 text-[#718096] transition hover:bg-white/5 hover:text-white"
                aria-label="Sulje ikkuna"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-slate-300">
              Haluatko varmasti kirjautua ulos?
            </p>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCancelLogout}
                className="cursor-pointer rounded-lg border border-[#2A374B] bg-[#182130] px-4 py-2 text-xs font-medium text-slate-300 transition hover:text-white"
              >
                Peruuta
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="cursor-pointer rounded-lg border border-rose-500/30 bg-rose-500 px-4 py-2 text-xs font-medium text-white transition hover:bg-rose-600"
              >
                Kirjaudu ulos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}