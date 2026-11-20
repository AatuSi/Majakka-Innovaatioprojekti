import { createFileRoute } from '@tanstack/react-router'
import AdminDatabase from '../../features/admin/AdminDatabase'

export const Route = createFileRoute('/admin/database')({
  component: AdminDatabase
})