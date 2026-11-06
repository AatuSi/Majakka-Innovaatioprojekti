import type {
  PublicQuizResponse,
} from '../../client'
import type { QuizDefinition } from './types'

export function mapBackendQuiz(
  quiz: PublicQuizResponse,
  metadata: Pick<QuizDefinition, 'eyebrow' | 'description' | 'accentLights'>,
): QuizDefinition {
  return {
    id: quiz.id,
    eyebrow: metadata.eyebrow,
    title: quiz.name ?? 'Tietovisa',
    description: metadata.description,
    accentLights: metadata.accentLights,
    questions: (quiz.questions ?? []).map((question) => ({
      id: question.id,
      prompt: question.question_text ?? '',
      hint: question.hint ?? undefined,
      options: (question.options ?? []).map((option) => ({
        id: option.id,
        label: option.option_text ?? '',
      })),
    })),
  }
}