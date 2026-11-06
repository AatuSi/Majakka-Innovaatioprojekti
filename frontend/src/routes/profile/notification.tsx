import { createFileRoute } from '@tanstack/react-router'
import ProfileNotificationPage from '#/features/profile/ProfileNotificationPage'

export const Route = createFileRoute('/profile/notification')({
  component: ProfileNotificationPage,
})