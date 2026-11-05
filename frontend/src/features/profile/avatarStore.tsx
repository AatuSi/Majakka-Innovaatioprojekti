import { useSyncExternalStore } from 'react'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/free-solid-svg-icons'

interface AvatarState {
  // null means the uploaded picture is the active avatar.
  selectedIcon: IconDefinition | null
  uploadedImage: string | null
}

// Preview only for now: the picture is not saved to the backend yet, so it
// lasts until the page is reloaded.
let state: AvatarState = { selectedIcon: faUser, uploadedImage: null }
const listeners = new Set<() => void>()

function setState(next: AvatarState) {
  state = next
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function selectAvatarIcon(icon: IconDefinition) {
  setState({ ...state, selectedIcon: icon })
}

export function selectUploadedAvatar() {
  setState({ ...state, selectedIcon: null })
}

export function uploadAvatar(file: File) {
  if (state.uploadedImage) URL.revokeObjectURL(state.uploadedImage)
  setState({ selectedIcon: null, uploadedImage: URL.createObjectURL(file) })
}

export function useAvatar() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  )
}