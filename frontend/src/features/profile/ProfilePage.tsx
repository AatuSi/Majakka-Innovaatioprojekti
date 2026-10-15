import { useState, type SubmitEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUser,
  faGear,
  faRightFromBracket,
  faMagnifyingGlass,
  faChevronLeft,
  faChevronRight,
  faClock,
  faTrophy,
  faBell,
  faSquarePollVertical,
  faDisplay,
  faClipboardList,
} from '@fortawesome/free-solid-svg-icons'
import LighthouseMark from '#/components/LighthouseMark'

const statsData = [
  { icon: faClipboardList, value: '18/24', label: 'Loistotestiä suoritettu' },
  { icon: faClock, value: '9 h', label: 'Simulaattoriaikaa' },
  { icon: faTrophy, value: '94%', label: 'Tarkkuusaste' },
]

const notificationsData = [
  {
    id: '1',
    icon: faBell,
    text: 'Suoritit moduulin arvosanalla 100%',
    time: '2 tuntia sitten',
  },
  {
    id: '2',
    icon: faBell,
    text: 'Suoritit moduulin arvosanalla 100%',
    time: 'Eilen',
  },
  {
    id: '3',
    icon: faBell,
    text: 'Suoritit moduulin arvosanalla 100%',
    time: '3 päivää sitten',
  },
]

const cutCorner = '[clip-path:polygon(0_0,calc(100%-10px)_0,100%_10px,100%_100%,0_100%)]'

export default function ProfilePage() {
  const [collapsed, setCollapsed] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 4000)
  }

  return (
    <div className="flex min-h-screen w-full items-start bg-[#182130] font-['Inter',sans-serif] text-[#e2e8f0]">
      <div
        className={`sticky top-0 z-30 flex h-screen shrink-0 flex-col justify-between overflow-y-auto overflow-x-hidden border-r border-[#2A374B] bg-[#1E2839] transition-[width] duration-300 ease-in-out select-none ${
          collapsed ? 'w-[68px]' : 'w-[230px]'
        }`}
      >
        <div className="flex flex-col">
          <div className="flex h-16 shrink-0 items-center border-b border-[#2A374B]">
            <div className={`flex w-full items-center ${collapsed ? 'justify-center' : 'justify-between px-3.5'}`}>
              <Link to="/" className="flex items-center gap-2.5 overflow-hidden text-white">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#1d90f4]/40 bg-[#1d90f4]/20 text-[#38bdf8]">
                  <LighthouseMark />
                </div>
                {!collapsed && (
                  <span className="whitespace-nowrap text-sm font-bold tracking-wide">
                    Majakka
                  </span>
                )}
              </Link>

              {!collapsed && (
                <button
                  type="button"
                  onClick={() => setCollapsed(true)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#718096] transition hover:bg-white/5 hover:text-white cursor-pointer"
                  title="Kutista valikko"
                  aria-label="Kutista valikko"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                </button>
              )}
            </div>
          </div>

          <ul className="m-0 flex list-none flex-col gap-1.5 p-2">
            {[
              { label: 'Profiili', icon: faUser, to: '/', active: true },
              { label: 'Dashboard', icon: faDisplay, to: '/' },
              { label: 'Tilastot', icon: faSquarePollVertical, to: '/' },
              { label: 'Asetukset', icon: faGear, to: '/' },
            ].map((item) => (
              <li key={item.label} className="flex justify-center">
                <Link
                  to={item.to}
                  className={`flex items-center rounded-md border transition-colors ${
                    collapsed
                      ? 'h-10 w-10 justify-center p-0'
                      : 'h-10 w-full justify-start px-2'
                  } ${
                    item.active
                      ? 'border-[#1d90f4]/30 bg-[#1d90f4]/15 text-[#38bdf8]'
                      : 'border-transparent text-[#718096] hover:bg-white/5 hover:text-white'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center text-sm">
                    <FontAwesomeIcon icon={item.icon} fixedWidth />
                  </span>

                  {!collapsed && (
                    <span className="ml-1 truncate whitespace-nowrap text-sm font-medium">
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-[#2A374B] p-2 flex justify-center">
          <button
            type="button"
            className={`flex items-center rounded-lg border border-rose-500/25 bg-rose-500/10 text-rose-500 transition hover:bg-rose-500/20 cursor-pointer ${
              collapsed
                ? 'h-10 w-10 justify-center p-0'
                : 'h-10 w-full justify-start px-2'
            }`}
            title={collapsed ? 'Kirjaudu ulos' : undefined}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center text-sm">
              <FontAwesomeIcon icon={faRightFromBracket} fixedWidth />
            </span>
            {!collapsed && (
              <span className="ml-1 truncate whitespace-nowrap text-sm font-semibold">
                Kirjaudu ulos
              </span>
            )}
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

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-[#1d90f4] bg-[#131B27] text-xs font-bold text-white">
              <p>FL</p>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white">Firstname Lastname</span>
            </div>
          </div>
        </header>

        <main className="mx-auto grid w-full max-w-[1350px] grid-cols-1 gap-6 p-8 lg:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-6">
            <section className="flex flex-col overflow-hidden rounded-[14px] border border-[#2A374B] bg-[#1E2839] shadow-2xl">
              <div className="h-[120px] w-full border-b border-[#2A374B] bg-[#101927]" />
              <div className="px-6 pb-6">
                <div className="mb-4 flex items-end justify-between">
                  <div className="-mt-[38px] flex h-[76px] w-[76px] items-center justify-center rounded-full border-[3px] border-[#1E2839] bg-[#131B27] text-2xl text-[#38bdf8] shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                    <FontAwesomeIcon icon={faUser} />
                  </div>
                  <button
                    type="button"
                    className="mt-3 rounded-md border border-[#1d90f4] bg-[#1d90f4] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                  >
                    Muokkaa kuvaketta
                  </button>
                </div>

                <div>
                  <h2 className="m-0 flex items-center gap-2 text-xl font-bold text-white">
                    Firstname Lastname
                    <span className="rounded border border-[#38bdf8]/30 bg-[#38bdf8]/15 px-1.5 py-0.5 text-[10px] text-[#38bdf8]">
                      OPISKELIJA
                    </span>
                  </h2>
                  <p className="mt-1 text-xs text-[#718096]">
                    Metropolia AMK • Liittynyt Syyskuu 2026
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                  {statsData.map((stat) => (
                    <div
                      key={stat.label}
                      className="flex items-center gap-3 rounded-xl border border-[#2A374B] bg-[#131B27] p-3.5"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1d90f4]/15 text-[#38bdf8]">
                        <FontAwesomeIcon icon={stat.icon} fixedWidth />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-white">{stat.value}</div>
                        <div className="text-[11px] text-[#718096]">{stat.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-[14px] border border-[#2A374B] bg-[#1E2839] p-6 shadow-2xl">
              <form onSubmit={handleSubmit} className="flex flex-col">
                <h3 className="m-0 mb-4 border-b border-[#2A374B] pb-2.5 text-base font-semibold text-white">
                  Henkilötiedot
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#718096]">
                      Etunimi
                    </label>
                    <input
                      type="text"
                      defaultValue="Firstname"
                      required
                      className="rounded-md border border-[#2A374B] bg-[#131B27] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-[#1d90f4]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#718096]">
                      Sukunimi
                    </label>
                    <input
                      type="text"
                      defaultValue="Lastname"
                      required
                      className="rounded-md border border-[#2A374B] bg-[#131B27] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-[#1d90f4]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#718096]">
                      Sähköpostiosoite
                    </label>
                    <input
                      type="email"
                      defaultValue="email@osoite.fi"
                      required
                      className="rounded-md border border-[#2A374B] bg-[#131B27] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-[#1d90f4]"
                    />
                  </div>
                </div>

                <h3 className="m-0 mt-7 mb-4 border-b border-[#2A374B] pb-2.5 text-base font-semibold text-white">
                  Vaihda salasana
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#718096]">
                      Nykyinen salasana
                    </label>
                    <input
                      type="password"
                      placeholder="Nykyinen salasana"
                      className="rounded-md border border-[#2A374B] bg-[#131B27] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-[#1d90f4]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#718096]">
                      Uusi salasana
                    </label>
                    <input
                      type="password"
                      placeholder="Uusi salasana"
                      className="rounded-md border border-[#2A374B] bg-[#131B27] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-[#1d90f4]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#718096]">
                      Vahvista salasana
                    </label>
                    <input
                      type="password"
                      placeholder="Vahvista salasana"
                      className="rounded-md border border-[#2A374B] bg-[#131B27] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-[#1d90f4]"
                    />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-4">
                  {saved && (
                    <span className="text-xs text-emerald-400">
                      Muutokset tallennettu onnistuneesti!
                    </span>
                  )}
                  <button
                    type="submit"
                    className={`${cutCorner} bg-[#1d90f4] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#1d90f4]/20 transition hover:bg-[#3ba0f6] active:scale-95 cursor-pointer`}
                  >
                    Tallenna muutokset
                  </button>
                </div>
              </form>
            </section>
          </div>

          <div>
            <section className="flex flex-col gap-4 rounded-[14px] border border-[#2A374B] bg-[#1E2839] p-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#2A374B] pb-3">
                <h3 className="m-0 text-sm font-semibold text-white">Ilmoitukset</h3>
                <span className="rounded-full border border-rose-500/30 bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-400">
                  3 uutta
                </span>
              </div>

              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {notificationsData.map((item) => (
                  <li
                    key={item.id}
                    className="flex gap-3 rounded-xl border border-[#2A374B] bg-[#131B27] p-3 text-xs"
                  >
                    <span className="mt-0.5 text-[#38bdf8]">
                      <FontAwesomeIcon icon={item.icon} />
                    </span>
                    <div>
                      <p className="m-0 leading-relaxed text-slate-200">
                        {item.text}
                      </p>
                      <time className="mt-1 block text-[10px] text-[#718096]">
                        {item.time}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}