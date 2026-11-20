import { useSyncExternalStore } from 'react'

// A message that outlives the page that shows it, e.g. after deleting the
// account, when the page that did it has already been left.
type ToastState = { message: string; show: boolean }

const SHOW_MS = 3000

let state: ToastState = { message: '', show: false }
let hideTimer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()

function setState(next: ToastState) {
  state = next
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Shows the message in the site-wide toast for a few seconds. */
export function showToast(message: string) {
  clearTimeout(hideTimer)
  setState({ message, show: true })
  hideTimer = setTimeout(() => setState({ ...state, show: false }), SHOW_MS)
}

const hidden: ToastState = { message: '', show: false }

export function useToast(): ToastState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => hidden,
  )
}
