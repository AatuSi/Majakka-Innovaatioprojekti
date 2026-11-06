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
import {
  card,
  dangerButton,
  eyebrow,
  iconBadge,
  input,
  insetPanel,
  label,
  modalBackdrop,
  primaryButton,
  secondaryButton,
  sectionIntro,
  sectionTitle,
} from './profileStyles'

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


  const toggles = [
    {
      id: 'push',
      title: 'Ilmoitus 1',
      description: 'Kuvaus',
      checked: pushNotifications,
      onToggle: () => setPushNotifications(!pushNotifications),
      ariaLabel: 'Kytke push-ilmoitukset',
    },
    {
      id: 'email',
      title: 'Ilmoitus 2',
      description: 'Kuvaus',
      checked: emailNotifications,
      onToggle: () => setEmailNotifications(!emailNotifications),
      ariaLabel: 'Kytke sähköposti-ilmoitukset',
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      <Toast show={passwordSaved} message="Salasana vaihdettu onnistuneesti!" />
      <div>
        <span className={eyebrow}>Tili</span>
        <h2 className={`mt-1 ${sectionTitle}`}>Asetukset</h2>
        <p className={sectionIntro}>Hallinnoi tilisi kirjautumistietoja, ilmoituskanavia ja tilin tilaa.</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        {/* password */}
        <section className={`${card} p-6 sm:p-8`}>
          <div className="flex items-center gap-4">
            <div className={iconBadge}>
              <FontAwesomeIcon icon={faKey} />
            </div>
            <div>
              <h3 className="text-xl font-light text-white">Vaihda salasana</h3>
              <p className="text-sm font-light text-[#9fb0c7]">Valitse vahva ja turvallinen salasana.</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className={`${insetPanel} mt-6 flex flex-col gap-5 p-5`}>
            <div className="space-y-2">
              <label htmlFor="settings-current-password" className={label}>
                Nykyinen salasana
              </label>
              <div className="relative">
                <input
                  id="settings-current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  placeholder="Syötä nykyinen salasana"
                  className={`${input} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute top-1/2 right-4 -translate-y-1/2 text-sm text-[#718096] transition hover:text-white cursor-pointer"
                  aria-label={showCurrentPassword ? 'Piilota salasana' : 'Näytä salasana'}
                >
                  <FontAwesomeIcon icon={showCurrentPassword ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="settings-new-password" className={label}>
                Uusi salasana
              </label>
              <div className="relative">
                <input
                  id="settings-new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  placeholder="Kirjoita uusi salasana"
                  className={`${input} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute top-1/2 right-4 -translate-y-1/2 text-sm text-[#718096] transition hover:text-white cursor-pointer"
                  aria-label={showNewPassword ? 'Piilota salasana' : 'Näytä salasana'}
                >
                  <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="settings-confirm-password" className={label}>
                Vahvista uusi salasana
              </label>
              <input
                id="settings-confirm-password"
                type="password"
                required
                placeholder="Kirjoita uusi salasana uudelleen"
                className={input}
              />
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" className={primaryButton}>
                Päivitä salasana
              </button>
            </div>
          </form>
        </section>

        <div className="flex flex-col gap-6">
          {/* notification toggles */}
          <section className={`${card} p-6 sm:p-8`}>
            <div className="flex items-center gap-4">
              <div className={iconBadge}>
                <FontAwesomeIcon icon={faBell} />
              </div>
              <div>
                <h3 className="text-xl font-light text-white">Ilmoitukset</h3>
                <p className="text-sm font-light text-[#9fb0c7]">Valitse miten ja milloin haluat ilmoituksia</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {toggles.map((toggle) => (
                <div
                  key={toggle.id}
                  className={`${insetPanel} flex items-center justify-between gap-4 p-4 transition hover:border-[#1D90F4]/50`}
                >
                  <div>
                    <div className="text-sm font-medium text-white">{toggle.title}</div>
                    <div className="text-sm font-light text-[#9fb0c7]">{toggle.description}</div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={toggle.checked}
                    onClick={toggle.onToggle}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200 ease-in-out ${
                      toggle.checked
                        ? 'border-[#1D90F4] bg-[#1D90F4] shadow-[0_0_12px_rgba(29,144,244,0.45)]'
                        : 'border-[#2A3548] bg-[#0F1724]'
                    }`}
                    aria-label={toggle.ariaLabel}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                        toggle.checked ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* danger zone */}
          <section className="rounded-xl border border-rose-500/30 bg-[#1E2839]/80 p-6 shadow-2xl backdrop-blur-md sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400">
                <FontAwesomeIcon icon={faTriangleExclamation} />
              </div>
              <div>
                <h3 className="text-xl font-light text-rose-400">Tilin poistaminen</h3>
                <p className="text-sm font-light text-[#9fb0c7]">Pysyvät toimenpiteet käyttäjätilillesi</p>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-4 rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-medium text-white">Poista tili pysyvästi</div>
                <div className="text-sm font-light text-[#9fb0c7]">
                  Kaikki loistotestin tulokset ja suoritustiedot poistetaan.
                </div>
              </div>
              <button type="button" onClick={() => setShowDeleteModal(true)} className={`${dangerButton} shrink-0`}>
                <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
                <span>Poista tili</span>
              </button>
            </div>
          </section>
        </div>
      </div>

      {showDeleteModal && (
        <div className={modalBackdrop}>
          <div
            className="w-full max-w-md rounded-2xl border border-rose-500/40 bg-[#0F1724]/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400">
                <FontAwesomeIcon icon={faTriangleExclamation} />
              </div>
              <h3 id="delete-modal-title" className="text-xl font-light text-white">
                Haluatko varmasti poistaa tilisi?
              </h3>
            </div>
            <p className="mt-4 text-sm font-light leading-relaxed text-[#c3cddb]">
              Tätä toimintoa ei voi peruuttaa. Kaikki oppimistietosi ja loistotestien suorituksesi poistetaan lopullisesti.
            </p>
            <div className="mt-5 space-y-2">
              <label htmlFor="delete-confirm" className="block text-sm text-[#9fb0c7]">
                Kirjoita <strong className="text-white">POISTA</strong> vahvistaaksesi poiston:
              </label>
              <input
                id="delete-confirm"
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="POISTA"
                className="w-full rounded-lg border border-[#2A3548] bg-[#0F1724] px-4 py-3 text-sm text-white placeholder:text-[#718096] outline-none transition focus:border-rose-500 focus:ring-1 focus:ring-rose-500/40"
              />
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText('')
                }}
                className={secondaryButton}
              >
                Peruuta
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText.toLowerCase() !== 'poista'}
                className={dangerButton}
              >
                Vahvista poisto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
