import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUser,
  faGear,
  faRightFromBracket,
  faSquarePollVertical,
  faEnvelope,
} from '@fortawesome/free-solid-svg-icons'
import { getAccessToken } from '#/api/config'
import { openAuthModal } from '#/components/authModalStore'
import { getFullName, logoutUser, updateAuthUser, useAuthUser } from '#/components/authUserStore'
import { getUser } from '#/client'
import ProfileAvatar from './ProfileAvatar'
import { eyebrow, gridStyle, primaryButton } from './profileStyles'

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
  const location = useLocation()
  const navigate = useNavigate()

  // Leave the profile first, so its logged-out view doesn't flash by.
  const handleLogout = async () => {
    await navigate({ to: '/' })
    logoutUser()
  }

  // The login state only exists in the browser, so the server render (and
  // the first browser render, which must match it) cannot know it yet. Wait
  // until then, so logged-in users don't see the logged-out view flash by.
  const authUser = useAuthUser()
  const [hydrated, setHydrated] = useState(false)

  // Opening the profile while logged out brings up the login modal. Once the
  // login succeeds, authUser is set and the profile shows itself.
  useEffect(() => {
    setHydrated(true)
    if (!getAccessToken()) openAuthModal('sign-in')
  }, [])

  // Checks the stored session against the backend when the profile opens and
  // picks up changes to the account. An expired token logs out by itself
  // through the 401 handling in authUserStore.
  const userId = authUser?.id
  useEffect(() => {
    if (!userId) return
    void getUser({ path: { user_id: userId } }).then((result) => {
      if (result.data) updateAuthUser(result.data)
    })
  }, [userId])

  if (!hydrated) {
    return <div className="flex-1 bg-[#182130]" style={gridStyle} />
  }

  if (!authUser) {
    return (
      <div
        className="relative flex flex-1 items-center justify-center bg-[#182130] px-6 py-24 font-['Inter',sans-serif] text-[#E3E3E3]"
        style={gridStyle}
      >
        <div className="max-w-md text-center">
          <span className={eyebrow}>Oma profiili</span>
          <h1 className="mt-2 text-3xl font-light text-white">Kirjaudu sisään</h1>
          <p className="mt-3 font-light text-[#9fb0c7]">
            Kirjaudu sisään nähdäksesi profiilisi, tilastosi ja asetuksesi.
          </p>
          <button
            type="button"
            onClick={() => openAuthModal('sign-in')}
            className={`${primaryButton} mt-8`}
          >
            Kirjaudu
          </button>
        </div>
      </div>
    )
  }

  const fullName = getFullName(authUser)

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
                {fullName && (
                  <h1 className="mt-1 text-3xl font-light text-white sm:text-4xl">
                    {fullName}
                  </h1>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void handleLogout()}
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
