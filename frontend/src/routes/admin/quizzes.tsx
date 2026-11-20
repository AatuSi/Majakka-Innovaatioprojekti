import { createFileRoute } from '@tanstack/react-router'
import AdminQuizzes from '../../features/admin/AdminQuizzes'

export const Route = createFileRoute('/admin/quizzes')({
  component: AdminQuizzes
})