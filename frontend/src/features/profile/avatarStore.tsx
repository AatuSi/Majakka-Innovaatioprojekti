import { useSyncExternalStore } from 'react'
import { faGraduationCap, faUser } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/free-solid-svg-icons'

// The keys are what the backend stores in users.avatar_icon.
export const avatarIcons = { user: faUser, 'graduation-cap': faGraduationCap } as const
export type AvatarIconName = keyof typeof avatarIcons

interface AvatarState {
  // null means the uploaded picture is the active avatar.
  selectedIcon: IconDefinition | null
  uploadedImage: string | null
}

// Icons are saved on the account. An uploaded picture is a preview only for
// now: it is not saved to the backend, so it lasts until the page is reloaded.
let state: AvatarState = { selectedIcon: faUser, uploadedImage: null }
let savedIconName: AvatarIconName | null = null
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

/** Applies the account's saved icon, only when it actually changed. */
export function syncSavedAvatarIcon(name: AvatarIconName | null) {
  if (name === savedIconName) return
  savedIconName = name
  setState({ ...state, selectedIcon: avatarIcons[name ?? 'user'] })
}

/** Forgets the avatar on logout, so the next account doesn't see the picture. */
export function resetAvatar() {
  if (state.uploadedImage) URL.revokeObjectURL(state.uploadedImage)
  savedIconName = null
  setState({ selectedIcon: faUser, uploadedImage: null })
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