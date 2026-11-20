import { createFileRoute } from '@tanstack/react-router'
import AdminMessages from '../../features/admin/AdminMessages'

export const Route = createFileRoute('/admin/messages')({
  component: AdminMessages
})