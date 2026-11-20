import { createFileRoute } from '@tanstack/react-router'
import AdminStatistics from '#/features/admin/AdminStatistics'

export const Route = createFileRoute('/admin/statistics')({
  component: AdminStatistics
})