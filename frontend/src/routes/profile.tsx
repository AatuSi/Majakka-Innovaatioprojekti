import { createFileRoute } from '@tanstack/react-router'
import ProfileLayout from '../features/profile/ProfileLayout'

export const Route = createFileRoute('/profile')({
  component: ProfileLayout,
})