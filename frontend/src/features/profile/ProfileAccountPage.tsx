import { useRef, useState } from 'react'
import type { ChangeEvent, SubmitEvent } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faClock,
  faTrophy,
  faClipboardList,
  faXmark,
  faUpload,
  faPen,
} from '@fortawesome/free-solid-svg-icons'
import Toast from '../../components/Toast'
import { getDisplayName, updateAuthUser, useAuthUser } from '../../components/authUserStore'
import { getApiErrorMessage } from '../../api/errors'
import { updateUser } from '../../client'
import { summarizeAttempts, useAttemptHistory } from './attemptHistory'
import { avatarIcons, selectAvatarIcon, selectUploadedAvatar, uploadAvatar, useAvatar } from './avatarStore'
import type { AvatarIconName } from './avatarStore'
import ProfileAvatar from './ProfileAvatar'
import {
  card,
  eyebrow,
  iconBadge,
  input,
  insetPanel,
  label,
  modalBackdrop,
  modalPanel,
  primaryButton,
  secondaryButton,
  sectionIntro,
  sectionTitle,
} from './profileStyles'

const availableIcons = Object.keys(avatarIcons) as AvatarIconName[]

function formatPracticeTime(totalSeconds: number) {
  return totalSeconds < 3600
    ? `${Math.round(totalSeconds / 60)} min`
    : `${Math.round(totalSeconds / 3600)} h`
}

export default function ProfileAccountPage() {
  const authUser = useAuthUser()
  const joinedAt = authUser
    ? new Date(authUser.created_at).toLocaleDateString('fi-FI', { month: 'long', year: 'numeric' })
    : ''
  const [profileSaved, setProfileSaved] = useState(false)
  const { selectedIcon, uploadedImage } = useAvatar()
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const { history, loading: historyLoading } = useAttemptHistory()
  const summary = summarizeAttempts(history)
  const statValue = (value: string) => (historyLoading ? '–' : value)

  const statsData = [
    { icon: faClipboardList, value: statValue(`${summary.completed}`), label: 'Suoritusta' },
    { icon: faClock, value: statValue(formatPracticeTime(summary.totalSeconds)), label: 'Simulaattoriaikaa' },
    { icon: faTrophy, value: statValue(`${summary.accuracy}%`), label: 'Tarkkuusaste' },
  ]

  const handleProfileSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!authUser || savingProfile) return

    const form = new FormData(e.currentTarget)
    const field = (name: string) => String(form.get(name) ?? '').trim()

    setSavingProfile(true)
    setProfileError(null)

    const result = await updateUser({
      path: { user_id: authUser.id },
      body: {
        first_name: field('firstName'),
        last_name: field('lastName'),
        email: field('email'),
      },
    })

    setSavingProfile(false)

    if (result.error) {
      setProfileError(
        getApiErrorMessage(result, {
          byDetail: { 'Email already exists': 'Sähköpostiosoite on jo käytössä.' },
        }),
      )
      return
    }

    updateAuthUser(result.data)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 3000)
  }

  const handleIconSelect = async (name: AvatarIconName) => {
    setShowAvatarModal(false)
    if (!authUser) return

    setAvatarError(null)
    const result = await updateUser({
      path: { user_id: authUser.id },
      body: { avatar_icon: name },
    })

    if (result.error) {
      setAvatarError(getApiErrorMessage(result))
      return
    }

    selectAvatarIcon(avatarIcons[name])
    updateAuthUser(result.data)
  }

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file?.type.startsWith('image/')) return

    uploadAvatar(file)
    setShowAvatarModal(false)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
      <Toast show={profileSaved} message="Tiedot tallennettu onnistuneesti!" />

      {/* avatar and overview */}
      <section className={`${card} flex flex-col items-center self-start p-8 text-center`}>
        <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-[#2A3548] bg-[#0F1724] text-4xl text-[#38bdf8] shadow-[0_0_35px_rgba(29,144,244,0.25)]">
          <ProfileAvatar />
        </div>

        <h2 className="mt-5 text-xl font-light text-white">{getDisplayName(authUser)}</h2>
        <span className="mt-2 rounded-full border border-[#1D90F4]/30 bg-[#1D90F4]/10 px-3 py-0.5 text-[11px] uppercase tracking-widest text-[#38bdf8]">
          {authUser?.role === 'admin' ? 'Ylläpitäjä' : 'Opiskelija'}
        </span>
        <p className="mt-3 text-sm font-light text-[#9fb0c7]">
          Metropolia AMK • Liittynyt {joinedAt}
        </p>

        <button
          type="button"
          onClick={() => setShowAvatarModal(true)}
          className={`${secondaryButton} mt-6 w-full`}
        >
          <FontAwesomeIcon icon={faPen} className="text-xs" />
          Muokkaa kuvaketta
        </button>
        {avatarError && (
          <p role="alert" className="mt-3 text-sm text-rose-300">
            {avatarError}
          </p>
        )}
      </section>

      <div className="flex flex-col gap-6">
        {/* stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {statsData.map((stat) => (
            <div
              key={stat.label}
              className={`${card} flex items-center gap-4 p-5 transition hover:border-[#1D90F4]/50`}
            >
              <div className={iconBadge}>
                <FontAwesomeIcon icon={stat.icon} fixedWidth />
              </div>
              <div>
                <div className="text-2xl font-light text-white">{stat.value}</div>
                <div className="text-xs text-[#9fb0c7]">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* personal details */}
        <section className={`${card} p-6 sm:p-8`}>
          {/* The key refills the fields when the saved details change. */}
          <form
            key={`${authUser?.first_name}|${authUser?.last_name}|${authUser?.email}`}
            onSubmit={handleProfileSubmit}
            className="flex flex-col"
          >
            <span className={eyebrow}>Tili</span>
            <h3 className={`mt-1 ${sectionTitle}`}>Henkilötiedot</h3>
            <p className={sectionIntro}>Nimesi ja sähköpostiosoitteesi näkyvät profiilissasi.</p>

            <div className={`${insetPanel} mt-6 grid grid-cols-1 gap-5 p-5 sm:grid-cols-2`}>
              <div className="space-y-2">
                <label htmlFor="profile-firstName" className={label}>
                  Etunimi
                </label>
                <input id="profile-firstName" name="firstName" type="text" autoComplete="given-name" maxLength={100} defaultValue={authUser?.first_name ?? ''} required className={input} />
              </div>
              <div className="space-y-2">
                <label htmlFor="profile-lastName" className={label}>
                  Sukunimi
                </label>
                <input id="profile-lastName" name="lastName" type="text" autoComplete="family-name" maxLength={100} defaultValue={authUser?.last_name ?? ''} required className={input} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="profile-email" className={label}>
                  Sähköpostiosoite
                </label>
                <input id="profile-email" name="email" type="email" autoComplete="email" maxLength={320} defaultValue={authUser?.email ?? ''} required className={input} />
              </div>
            </div>

            {profileError && (
              <p role="alert" className="mt-4 text-sm text-rose-300">
                {profileError}
              </p>
            )}

            <div className="mt-6 flex justify-end">
              <button type="submit" disabled={savingProfile} className={primaryButton}>
                {savingProfile ? 'Tallennetaan...' : 'Tallenna henkilötiedot'}
              </button>
            </div>
          </form>
        </section>
      </div>

      {showAvatarModal && (
        <div className={modalBackdrop}>
          <div className={modalPanel} role="dialog" aria-modal="true" aria-labelledby="avatar-modal-title">
            <div className="flex items-start justify-between">
              <div>
                <span className={eyebrow}>Profiilikuva</span>
                <h3 id="avatar-modal-title" className="mt-1 text-2xl font-light text-white">
                  Valitse kuvake
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="text-[#718096] transition hover:text-white cursor-pointer"
                aria-label="Sulje"
              >
                <FontAwesomeIcon icon={faXmark} className="text-lg" />
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {availableIcons.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => void handleIconSelect(name)}
                  className={`flex h-16 w-16 items-center justify-center rounded-full border-2 transition cursor-pointer ${
                    selectedIcon === avatarIcons[name]
                      ? 'border-[#1D90F4] bg-[#1D90F4]/15 text-[#38bdf8] shadow-[0_0_20px_rgba(29,144,244,0.35)]'
                      : 'border-[#2A3548] bg-[#182130] text-[#c3cddb] hover:border-[#1D90F4]/60'
                  }`}
                >
                  <FontAwesomeIcon icon={avatarIcons[name]} className="text-xl" />
                </button>
              ))}
              {uploadedImage && (
                <button
                  type="button"
                  onClick={() => {
                    selectUploadedAvatar()
                    setShowAvatarModal(false)
                  }}
                  aria-label="Käytä omaa kuvaa"
                  className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 transition cursor-pointer ${
                    selectedIcon === null
                      ? 'border-[#1D90F4] shadow-[0_0_20px_rgba(29,144,244,0.35)]'
                      : 'border-[#2A3548] hover:border-[#1D90F4]/60'
                  }`}
                >
                  <img src={uploadedImage} alt="" className="h-full w-full object-cover" />
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`${secondaryButton} mt-6 w-full`}
            >
              <FontAwesomeIcon icon={faUpload} />
              <span>Lataa oma kuva</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
