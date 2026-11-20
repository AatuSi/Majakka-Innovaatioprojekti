import { createFileRoute } from '@tanstack/react-router'
import { IALAQuizPage } from '../features/iala-quiz'

// ?resume=<attempt id> continues an unfinished attempt, see the profile's attempt list.
export const Route = createFileRoute('/IALA-quiz')({
  validateSearch: (search: Record<string, unknown>): { resume?: string } =>
    typeof search.resume === 'string' ? { resume: search.resume } : {},
  component: IALAQuizPage,
  head: () => ({ meta: [{ title: 'IALA-tietovisa – Majakka' }] }),
})
