import { createFileRoute } from '@tanstack/react-router'
import QuizSelectionPage from '../features/quiz-selection/QuizSelectionPage'

export const Route = createFileRoute('/quizzes')({
    component: QuizSelectionPage,
  head: () => ({
    meta: [{ title: 'Tietovisat – Majakka' }],
  }),
})


