import { useState, type SubmitEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faKey,
  faBell,
  faTriangleExclamation,
  faTrashCan,
  faEye,
  faEyeSlash,
} from '@fortawesome/free-solid-svg-icons'
import Toast from '../../components/Toast'

export default function ProfileSettingsPage() {
  const navigate = useNavigate()
  const [pushNotifications, setPushNotifications] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const handlePasswordSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPasswordSaved(true)
    e.currentTarget.reset()
    setTimeout(() => setPasswordSaved(false), 3000)
  }

  const handleDeleteAccount = () => {
    if (deleteConfirmText.toLowerCase() === 'poista') {
      setShowDeleteModal(false)
      alert('Tili poistettu onnistuneesti.')
      navigate({ to: '/' })
    }
  }

  return (
    <main className="relative mx-auto w-full max-w-[1350px] p-8 overflow-hidden">
      <Toast show={passwordSaved} message="Salasana vaihdettu onnistuneesti!" />
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Asetukset</h1>
          <p className="mt-1 text-xs text-[#718096]">
            Hallinnoi tilisi kirjautumistietoja, ilmoituskanavia ja tilin tilaa.
          </p>
        </div>
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="flex flex-col rounded-xl border border-[#2A374B] bg-[#1E2839] p-6 shadow-xl">
            <div className="flex items-center gap-2.5 border-b border-[#2A374B] pb-3 mb-5">
              <div className="flex h-8 w-8 items-center justify-center text-[#38bdf8]">
                <FontAwesomeIcon icon={faKey} className="text-base" />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-wider text-white">
                  Vaihda salasana
                </h2>
                <p className="text-xs text-[#718096]">
                  Valitse vahva ja turvallinen salasana.
                </p>
              </div>
            </div>
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#718096]">
                  Nykyinen salasana
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    placeholder="Syötä nykyinen salasana"
                    className="w-full rounded-md border border-[#2A374B] bg-[#131B27] px-3.5 py-2.5 pr-10 text-sm text-white outline-none transition focus:border-[#1d90f4]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#718096] hover:text-white cursor-pointer"
                  >
                    <FontAwesomeIcon icon={showCurrentPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#718096]">
                  Uusi salasana
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Kirjoita uusi salasana"
                    className="w-full rounded-md border border-[#2A374B] bg-[#131B27] px-3.5 py-2.5 pr-10 text-sm text-white outline-none transition focus:border-[#1d90f4]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#718096] hover:text-white cursor-pointer"
                  >
                    <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#718096]">
                  Vahvista uusi salasana
                </label>
                <input
                  type="password"
                  required
                  placeholder="Kirjoita uusi salasana uudelleen"
                  className="w-full rounded-md border border-[#2A374B] bg-[#131B27] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-[#1d90f4]"
                />
              </div>
              <div className="mt-3 flex items-center justify-end pt-4">
                <button
                  type="submit"
                  className="rounded-sm bg-[#1d90f4] px-5 py-2 text-xs font-bold text-white transition hover:bg-[#3ba0f6] active:scale-95 cursor-pointer"
                >
                  Päivitä salasana
                </button>
              </div>
            </form>
          </section>
          <div className="flex flex-col gap-6">
            <section className="flex flex-col rounded-xl border border-[#2A374B] bg-[#1E2839] p-6 shadow-xl">
              <div className="flex items-center gap-2.5 border-b border-[#2A374B] pb-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center text-[#38bdf8]">
                  <FontAwesomeIcon icon={faBell} className="text-base" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-wider text-white">
                    Ilmoitukset
                  </h2>
                  <p className="text-xs text-[#718096]">
                    Valitse miten ja milloin haluat ilmoituksia
                  </p>
                </div>
              </div>
              <div className="flex flex-col divide-y divide-[#2A374B]/50">
                <div className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <div className="text-xs font-semibold text-white">Ilmoitus 1</div>
                    <div className="text-xs text-[#718096]">
                      Kuvaus
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPushNotifications(!pushNotifications)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200 ease-in-out ${
                      pushNotifications
                        ? 'border-[#1d90f4] bg-[#1d90f4]'
                        : 'border-[#2A374B] bg-[#131B27]'
                    }`}
                    aria-label="Kytke push-ilmoitukset"
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                        pushNotifications ? 'translate-x-4' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <div className="text-xs font-semibold text-white">Ilmoitus 2</div>
                    <div className="text-xs text-[#718096]">
                      Kuvaus
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200 ease-in-out ${
                      emailNotifications
                        ? 'border-[#1d90f4] bg-[#1d90f4]'
                        : 'border-[#2A374B] bg-[#131B27]'
                    }`}
                    aria-label="Kytke sähköposti-ilmoitukset"
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                        emailNotifications ? 'translate-x-4' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </section>
            <section className="flex flex-col rounded-xl border border-rose-500/30 bg-[#1E2839] p-6 shadow-xl">
              <div className="flex items-center gap-2.5 border-b border-rose-500/20 pb-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center text-rose-400">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="text-md" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-wider text-rose-400">
                    Tilin poistaminen
                  </h2>
                  <p className="text-xs text-[#718096]">
                    Pysyvät toimenpiteet käyttäjätilillesi
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-white">Poista tili pysyvästi</div>
                  <div className="text-xs text-[#718096]">
                    Kaikki loistotestin tulokset ja suoritustiedot poistetaan.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center gap-2 rounded-sm bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-md transition hover:bg-rose-500 cursor-pointer shrink-0"
                >
                  <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
                  <span>Poista tili</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-rose-500/40 bg-[#1E2839] p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-xl" />
              <h3 className="text-base font-bold text-white">Haluatko varmasti poistaa tilisi?</h3>
            </div>
            <p className="text-xs text-[#8B9BB4] leading-relaxed mb-4">
              Tätä toimintoa ei voi peruuttaa. Kaikki oppimistietosi ja loistotestien suorituksesi poistetaan lopullisesti.
            </p>
            <div className="mb-5">
              <label className="block text-xs text-[#8B9BB4] mb-1.5">
                Kirjoita <strong className="text-white">POISTA</strong> vahvistaaksesi poiston:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="POISTA"
                className="w-full rounded-md border border-[#2A374B] bg-[#131B27] px-3.5 py-2.5 text-sm text-white outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText('')
                }}
                className="rounded-sm border border-[#2A374B] bg-[#131B27] px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-[#253347] cursor-pointer"
              >
                Peruuta
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText.toLowerCase() !== 'poista'}
                className="rounded-sm bg-rose-600 px-5 py-2 text-xs font-bold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-rose-600 cursor-pointer"
              >
                Vahvista poisto
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}