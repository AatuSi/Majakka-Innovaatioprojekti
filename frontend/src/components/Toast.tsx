import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import { useEffect, useState, useRef } from 'react'

interface ToastItem {
  id: number
  message: string
  color: string
  icon: IconDefinition
  duration?: number // Viive sekunteina (esim. 5-10s)
}

interface ToastContainerProps {
  toasts: ToastItem[]
  onClose: (id: number) => void
}

export default function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-20 right-8 z-50 flex flex-col gap-3 pointer-events-none items-end">
      {toasts.map((toast) => (
        <SingleToast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  )
}

function SingleToast({
  toast,
  onClose,
}: {
  toast: ToastItem
  onClose: (id: number) => void
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  // Tallennetaan onClose useRefiin, jotta ajastin ei nollaannu kun parent-komponentti renderöityy uudelleen
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    // 1. Käynnistetään sisääntuloanimaatio (fade-in)
    const showTimer = setTimeout(() => {
      setIsVisible(true)
    }, 20)

    const totalDuration = (toast.duration || 5) * 1000

    // 2. Käynnistetään ulostulo (fade out vasemmalta oikealle) 300ms ennen poistoa
    const exitTimer = setTimeout(() => {
      setIsExiting(true)
    }, totalDuration - 300)

    // 3. Poistetaan ilmoitus pinosta kun duration on kokonaan kulunut
    const removeTimer = setTimeout(() => {
      onCloseRef.current(toast.id)
    }, totalDuration)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(exitTimer)
      clearTimeout(removeTimer)
    }
  }, [toast.id, toast.duration])

  const handleManualClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onCloseRef.current(toast.id)
    }, 300)
  }

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 rounded-xl border bg-[#1E2839] px-4 py-3 shadow-2xl text-xs text-white transition-all duration-300 ease-out ${
        isExiting
          ? 'opacity-0 translate-x-12 scale-95' // Fade out vasemmalta OIKEALLE
          : isVisible
          ? 'opacity-100 translate-x-0 scale-100' // Valmis / paikallaan
          : 'opacity-0 translate-x-12 scale-95' // Alkutila: tulee oikealta vasemmalle
      }`}
      style={{
        borderColor: `${toast.color}66`,
      }}
    >
      <div
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: `${toast.color}33`,
          color: toast.color,
        }}
      >
        <FontAwesomeIcon icon={toast.icon} />
      </div>

      <span className="pr-2">{toast.message}</span>

      <button
        type="button"
        onClick={handleManualClose}
        className="ml-auto text-[#718096] hover:text-white transition cursor-pointer p-1"
        aria-label="Sulje ilmoitus"
      >
        <FontAwesomeIcon icon={faTimes} className="text-xs" />
      </button>
    </div>
  )
}