import { createFileRoute } from '@tanstack/react-router'
import ProfileNotificationPage from '#/features/profile/ProfileNotificationPage'

// ?id=<notification id> opens that notification, e.g. from the header's bell.
export const Route = createFileRoute('/profile/notification')({
  validateSearch: (search: Record<string, unknown>): { id?: string } =>
    typeof search.id === 'string' ? { id: search.id } : {},
  component: ProfileNotificationPage,
})
