import { createFileRoute } from '@tanstack/react-router'
import ProfileAccountPage from '../../features/profile/ProfileAccountPage'

export const Route = createFileRoute('/profile/')({
  component: ProfileAccountPage,
})