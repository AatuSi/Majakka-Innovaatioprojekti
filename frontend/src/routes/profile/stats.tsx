import { createFileRoute } from '@tanstack/react-router'
import ProfileStatsPage from '../../features/profile/ProfileStatsPage'

export const Route = createFileRoute('/profile/stats')({
  component: ProfileStatsPage,
})