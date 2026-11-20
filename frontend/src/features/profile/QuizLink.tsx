import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { quizPagePath } from '../quiz-selection/quizPages'

interface QuizLinkProps {
  quizName?: string | null
  /** Unfinished attempt to continue; leave out to start the quiz anew. */
  resumeAttemptId?: string
  className?: string
  children: ReactNode
}

/**
 * Link to the page that runs the quiz. A quiz without its own page leads to
 * the quiz list instead of another quiz's page.
 */
export default function QuizLink({
  quizName,
  resumeAttemptId,
  className,
  children,
}: QuizLinkProps) {
  const path = quizPagePath(quizName)

  if (!path) {
    return (
      <Link to="/quizzes" className={className}>
        {children}
      </Link>
    )
  }

  return (
    <Link
      to={path}
      search={resumeAttemptId ? { resume: resumeAttemptId } : {}}
      className={className}
    >
      {children}
    </Link>
  )
}
