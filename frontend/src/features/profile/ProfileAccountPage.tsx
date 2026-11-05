import { useRef, useState } from 'react'
import type { ChangeEvent, SubmitEvent } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUser,
  faClock,
  faTrophy,
  faClipboardList,
  faIdCard,
  faXmark,
  faGraduationCap,
  faUpload,
} from '@fortawesome/free-solid-svg-icons'
import Toast from '../../components/Toast'
import { selectAvatarIcon, selectUploadedAvatar, uploadAvatar, useAvatar } from './avatarStore'
import ProfileAvatar from './ProfileAvatar'

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
    <main className="relative mx-auto grid w-full max-w-[1350px] grid-cols-1 gap-6 p-8 lg:grid-cols-[1fr_340px] overflow-hidden">
      <Toast show={profileSaved} message="Tiedot tallennettu onnistuneesti!" />
      <div className="flex flex-col gap-6">
        <section className="flex flex-col overflow-hidden rounded-[14px] border border-[#2A374B] bg-[#1E2839] shadow-2xl">
          <div className="h-[120px] w-full border-b border-[#2A374B] bg-[#101927]" />
          <div className="px-6 pb-6">
            <div className="mb-4 flex items-end justify-between">
              <div className="-mt-[38px] flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-full border-[3px] border-[#1E2839] bg-[#131B27] text-2xl text-[#38bdf8] shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                <ProfileAvatar />
              </div>
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                className="mt-3 inline-flex items-center gap-2 rounded-md border border-[#1d90f4] bg-[#1d90f4] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#3ba0f6] cursor-pointer"
              >
                <span>Muokkaa kuvaketta</span>
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
          <form onSubmit={handleProfileSubmit} className="flex flex-col">
            <div className="flex items-center gap-2.5 border-b border-[#2A374B] pb-3 mb-5">
              <FontAwesomeIcon icon={faIdCard} className="text-[#38bdf8] text-sm" />
              <h3 className="m-0 text-base font-semibold text-white">
                Henkilötiedot
              </h3>
            </div>
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
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="submit"
                className={`bg-[#1d90f4] px-5 py-2.5 text-xs font-semibold text-white rounded-sm transition hover:bg-[#3ba0f6] active:scale-95 cursor-pointer`}
              >
                Tallenna henkilötiedot
              </button>
            </div>
          </form>
        </section>
      </div>

      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-[#2A374B] bg-[#1E2839] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2A374B] pb-3 mb-4">
              <h3 className="text-base font-bold text-white">Valitse profiilikuvake</h3>
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="text-[#718096] hover:text-white cursor-pointer"
              >
                <FontAwesomeIcon icon={faXmark} className="text-lg" />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-3 mb-4">
              {availableIcons.map((icon, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    selectAvatarIcon(icon)
                    setShowAvatarModal(false)
                  }}
                  className={`flex h-14 w-14 items-center justify-center rounded-xl border transition cursor-pointer ${
                    selectedIcon === icon
                      ? 'border-[#1d90f4] bg-[#1d90f4]/20 text-[#38bdf8]'
                      : 'border-[#2A374B] bg-[#131B27] text-slate-300 hover:border-slate-500'
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
                  className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border transition cursor-pointer ${
                    selectedIcon === null
                      ? 'border-[#1d90f4]'
                      : 'border-[#2A374B] hover:border-slate-500'
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#2A374B] bg-[#131B27] px-4 py-2.5 text-xs font-semibold text-white transition hover:border-[#1d90f4] hover:bg-[#1d90f4]/10 cursor-pointer"
            >
              <FontAwesomeIcon icon={faUpload} />
              <span>Lataa oma kuva</span>
            </button>
          </div>
        </div>
      )}
    </main>
  )
}