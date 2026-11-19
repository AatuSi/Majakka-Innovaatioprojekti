import { createFileRoute } from '@tanstack/react-router'
import { COLREGQuizPage } from '../features/colreg-quiz'

// ?resume=<attempt id> continues an unfinished attempt, see the profile's attempt list.
export const Route = createFileRoute('/COLREG-quiz')({
  validateSearch: (search: Record<string, unknown>): { resume?: string } =>
    typeof search.resume === 'string' ? { resume: search.resume } : {},
  component: COLREGQuizPage,
  head: () => ({ meta: [{ title: 'COLREG-tietovisa – Majakka' }] }),
})
