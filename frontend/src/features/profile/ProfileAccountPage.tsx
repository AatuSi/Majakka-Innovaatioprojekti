import { useRef, useState } from 'react'
import type { ChangeEvent, SubmitEvent } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUser,
  faClock,
  faTrophy,
  faClipboardList,
  faXmark,
  faGraduationCap,
  faUpload,
  faPen,
} from '@fortawesome/free-solid-svg-icons'
import Toast from '../../components/Toast'
import { selectAvatarIcon, selectUploadedAvatar, uploadAvatar, useAvatar } from './avatarStore'
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

const mockQuizHistoryData = [
  { id: '1', score: 10, totalQuestions: 10, duration: 270 },
  { id: '2', score: 9, totalQuestions: 10, duration: 315 },
  { id: '3', score: 10, totalQuestions: 10, duration: 180 },
]

const availableIcons = [faUser, faGraduationCap]

export default function ProfileAccountPage() {
  const [profileSaved, setProfileSaved] = useState(false)
  const { selectedIcon, uploadedImage } = useAvatar()
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const completedCount = mockQuizHistoryData.length
  const totalPossibleTests = 24

  const totalSeconds = mockQuizHistoryData.reduce((acc, curr) => acc + curr.duration, 0)
  const totalHours = Math.round(totalSeconds / 3600)

  const totalScore = mockQuizHistoryData.reduce((acc, curr) => acc + curr.score, 0)
  const totalQuestions = mockQuizHistoryData.reduce((acc, curr) => acc + curr.totalQuestions, 0)
  const accuracyPercentage = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0

  const statsData = [
    { icon: faClipboardList, value: `${completedCount}/${totalPossibleTests}`, label: 'Loistotestiä suoritettu' },
    { icon: faClock, value: `${totalHours} h`, label: 'Simulaattoriaikaa' },
    { icon: faTrophy, value: `${accuracyPercentage}%`, label: 'Tarkkuusaste' },
  ]

  const handleProfileSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 3000)
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

        <h2 className="mt-5 text-xl font-light text-white">Firstname Lastname</h2>
        <span className="mt-2 rounded-full border border-[#1D90F4]/30 bg-[#1D90F4]/10 px-3 py-0.5 text-[11px] uppercase tracking-widest text-[#38bdf8]">
          Opiskelija
        </span>
        <p className="mt-3 text-sm font-light text-[#9fb0c7]">
          Metropolia AMK • Liittynyt Syyskuu 2026
        </p>

        <button
          type="button"
          onClick={() => setShowAvatarModal(true)}
          className={`${secondaryButton} mt-6 w-full`}
        >
          <FontAwesomeIcon icon={faPen} className="text-xs" />
          Muokkaa kuvaketta
        </button>
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
          <form onSubmit={handleProfileSubmit} className="flex flex-col">
            <span className={eyebrow}>Tili</span>
            <h3 className={`mt-1 ${sectionTitle}`}>Henkilötiedot</h3>
            <p className={sectionIntro}>Nimesi ja sähköpostiosoitteesi näkyvät profiilissasi.</p>

            <div className={`${insetPanel} mt-6 grid grid-cols-1 gap-5 p-5 sm:grid-cols-2`}>
              <div className="space-y-2">
                <label htmlFor="profile-firstName" className={label}>
                  Etunimi
                </label>
                <input id="profile-firstName" type="text" defaultValue="Firstname" required className={input} />
              </div>
              <div className="space-y-2">
                <label htmlFor="profile-lastName" className={label}>
                  Sukunimi
                </label>
                <input id="profile-lastName" type="text" defaultValue="Lastname" required className={input} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="profile-email" className={label}>
                  Sähköpostiosoite
                </label>
                <input id="profile-email" type="email" defaultValue="email@osoite.fi" required className={input} />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button type="submit" className={primaryButton}>
                Tallenna henkilötiedot
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
              {availableIcons.map((icon, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    selectAvatarIcon(icon)
                    setShowAvatarModal(false)
                  }}
                  className={`flex h-16 w-16 items-center justify-center rounded-full border-2 transition cursor-pointer ${
                    selectedIcon === icon
                      ? 'border-[#1D90F4] bg-[#1D90F4]/15 text-[#38bdf8] shadow-[0_0_20px_rgba(29,144,244,0.35)]'
                      : 'border-[#2A3548] bg-[#182130] text-[#c3cddb] hover:border-[#1D90F4]/60'
                  }`}
                >
                  <FontAwesomeIcon icon={icon} className="text-xl" />
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
