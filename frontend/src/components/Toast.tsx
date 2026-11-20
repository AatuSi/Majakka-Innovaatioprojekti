import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons'
import { useEffect, useState, useRef } from 'react'

export interface ToastItem {
  id: number
  message: string
  color: string
  icon: IconDefinition
  duration?: number
}

export interface ToastContainerProps {
  toasts?: ToastItem[]
  onClose: (id: number) => void
}

export default function ToastContainer({
  toasts = [],
  onClose,
}: ToastContainerProps) {
  const safeToasts = Array.isArray(toasts) ? toasts : []

  return (
    <div className="fixed top-20 right-8 z-[70] flex flex-col gap-3 pointer-events-none items-end">
      {safeToasts.map((toast) => (
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

  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setIsVisible(true)
    }, 20)

    const totalDuration = (toast.duration || 5) * 1000

    const exitTimer = setTimeout(() => {
      setIsExiting(true)
    }, totalDuration - 300)

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
          ? 'opacity-0 translate-x-12 scale-95'
          : isVisible
            ? 'opacity-100 translate-x-0 scale-100'
            : 'opacity-0 translate-x-12 scale-95'
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

export interface ToastProps {
  show: boolean
  message: string
}

export function Toast({ show, message }: ToastProps) {
  return (
    <div
      className={`fixed top-24 right-8 z-[70] flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-[#0F1724]/95 px-4 py-3 shadow-2xl backdrop-blur-xl text-sm font-light text-white transition-all duration-300 ease-out ${
        show
          ? 'translate-x-0 opacity-100 scale-100'
          : 'translate-x-16 opacity-0 scale-95 pointer-events-none'
      }`}
    >
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
        <FontAwesomeIcon icon={faCheck} />
      </div>
      <span>{message}</span>
    </div>
  )
}