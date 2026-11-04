import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck } from '@fortawesome/free-solid-svg-icons'

interface ToastProps {
  show: boolean
  message: string
}

export default function Toast({ show, message }: ToastProps) {
  return (
    <div
      className={`fixed top-20 right-8 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-[#1E2839] px-4 py-3 shadow-2xl text-xs text-white transition-all duration-300 ease-out ${
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