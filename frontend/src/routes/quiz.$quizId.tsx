import { createFileRoute } from '@tanstack/react-router'
import PublicQuizPage from '../features/quiz-selection/PublicQuizPage'

export const Route = createFileRoute('/quiz/$quizId')({
  component: PublicQuizRoute,
})

function PublicQuizRoute() {
  const { quizId } = Route.useParams()
  return <PublicQuizPage quizId={quizId} />
}
