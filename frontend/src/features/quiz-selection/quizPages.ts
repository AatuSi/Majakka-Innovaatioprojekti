// Every quiz in the database has its own page in the app. The quiz pages find
// their quiz by name too (see IALAQuizPage and COLREGQuizPage), so this list
// is the one place that ties the two together.
const quizPages = {
  'IALA-tietovisa': '/IALA-quiz',
  'COLREG-tietovisa': '/COLREG-quiz',
} as const

export type QuizPagePath = (typeof quizPages)[keyof typeof quizPages]

/**
 * Page that runs the quiz, by its name in the database. Null for a quiz that
 * has no page yet, so it is never opened on another quiz's page by mistake.
 */
export function quizPagePath(quizName?: string | null): QuizPagePath | null {
  if (!quizName || !Object.hasOwn(quizPages, quizName)) return null
  return quizPages[quizName as keyof typeof quizPages]
}
