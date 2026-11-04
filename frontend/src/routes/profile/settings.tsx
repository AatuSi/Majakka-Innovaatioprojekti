import { createFileRoute } from '@tanstack/react-router'
import ProfileSettingsPage from '../../features/profile/ProfileSettingsPage'

export const Route = createFileRoute('/profile/settings')({
  component: ProfileSettingsPage,
})