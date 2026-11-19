import { faGraduationCap, faUser } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/free-solid-svg-icons'
import type { UserResponse } from '../../client'
import { client } from '../../client/client.gen'
import { useAuthUser } from '../../components/authUserStore'

// The keys are what the backend stores in users.avatar_icon.
export const avatarIcons = { user: faUser, 'graduation-cap': faGraduationCap } as const
export type AvatarIconName = keyof typeof avatarIcons

// Same limits as the backend checks, so the user hears about them before uploading.
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
export const AVATAR_ACCEPT = 'image/png,image/jpeg,image/webp'

export type Avatar = { kind: 'icon'; icon: IconDefinition } | { kind: 'image'; url: string }

/**
 * URL of the account's uploaded picture, or null when there is none. The
 * timestamp changes on every upload, so the browser never shows a cached old one.
 */
export function getAvatarImageUrl(account: UserResponse | null): string | null {
  if (!account?.avatar_updated_at) return null
  const version = encodeURIComponent(account.avatar_updated_at)
  return `${client.getConfig().baseUrl}/users/${account.id}/avatar?v=${version}`
}

/**
 * Everything is saved on the account: a chosen icon wins, otherwise the
 * uploaded picture is shown, otherwise the default icon.
 */
export function getAvatar(account: UserResponse | null): Avatar {
  const iconName = account?.avatar_icon
  if (iconName) return { kind: 'icon', icon: avatarIcons[iconName] }

  const url = getAvatarImageUrl(account)
  if (url) return { kind: 'image', url }

  return { kind: 'icon', icon: faUser }
}

export function useAvatar(): Avatar {
  return getAvatar(useAuthUser())
}
