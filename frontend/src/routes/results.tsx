import { createFileRoute } from '@tanstack/react-router'
import { QuizResultsPage } from '../features/quiz-results'

export const Route = createFileRoute('/results')({
  component: QuizResultsPage,
  head: () => ({
    meta: [{ title: 'Tulokset – Majakka' }],
  }),
})
