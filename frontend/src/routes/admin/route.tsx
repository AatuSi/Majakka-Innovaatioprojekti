import { createFileRoute } from '@tanstack/react-router'
import AdminLayout from '../../features/admin/AdminLayout'
import { assertAdminAccess } from '../../features/admin/admin-access'
import { NotFound } from '../__root'

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    await assertAdminAccess()
  },
  notFoundComponent: NotFound,
  component: AdminLayout,
})