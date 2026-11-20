import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCompass } from '@fortawesome/free-solid-svg-icons'
import type { QuizAttemptHistoryItem } from '../../client'
import { useAuthUser } from '../../components/authUserStore'
import { isUnfinished, useTopicResults, weakestTopic } from './attemptHistory'
import QuizLink from './QuizLink'
import { card, eyebrow, iconBadge, primaryButton } from './profileStyles'

interface ContinueCardProps {
  /** Attempts as useAttemptHistory gives them: finished and continuable, newest first. */
  rows: QuizAttemptHistoryItem[]
  loading: boolean
}

/**
 * One suggestion for what to do next: continue the latest unfinished quiz,
 * otherwise go over the quiz with the most wrong answers, otherwise start one.
 */
export default function ContinueCard({ rows, loading }: ContinueCardProps) {
  const authUser = useAuthUser()
  const topicResults = useTopicResults(authUser?.id)

  // Hidden until both are in, so the suggestion doesn't change in front of the user.
  if (loading || topicResults.loading) return null

  const unfinished = rows.find(isUnfinished)
  const weakest = weakestTopic(topicResults.topics)
  const hasHistory = rows.some((item) => !isUnfinished(item))

  let title: string
  let text: string
  let action: ReactNode

  if (unfinished) {
    title = `Jatka tietovisaa: ${unfinished.quiz_name ?? 'Nimetön tietovisa'}`
    text =
      unfinished.total_questions > 0
        ? `Olet vastannut ${unfinished.total_questions} kysymykseen. Jatka siitä, mihin jäit.`
        : 'Aloitit tietovisan, mutta et vielä vastannut kysymyksiin.'
    action = (
      <QuizLink
        quizName={unfinished.quiz_name}
        resumeAttemptId={unfinished.id}
        className={primaryButton}
      >
        Jatka
      </QuizLink>
    )
  } else if (weakest && weakest.accuracy < 1) {
    title = `Kertaa tietovisa: ${weakest.quiz_name ?? 'Nimetön tietovisa'}`
    text = `Vastauksistasi ${Math.round(weakest.accuracy * 100)} % on ollut oikein. Tässä aiheessa on eniten kerrattavaa.`
    action = (
      <QuizLink quizName={weakest.quiz_name} className={primaryButton}>
        Kertaa
      </QuizLink>
    )
  } else if (!hasHistory) {
    title = 'Aloita ensimmäinen tietovisa'
    text = 'Testaa, miten tunnistat kulkuvalot ja loistot pimeällä.'
    action = (
      <Link to="/quizzes" className={primaryButton}>
        Valitse tietovisa
      </Link>
    )
  } else {
    title = 'Kaikki oikein!'
    text =
      'Olet vastannut kaikkiin tietovisojen kysymyksiin oikein. Pidä taidot yllä kertaamalla välillä.'
    action = (
      <Link to="/quizzes" className={primaryButton}>
        Valitse tietovisa
      </Link>
    )
  }

  return (
    <section
      className={`${card} flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8`}
    >
      <div className="flex items-start gap-4">
        <div className={iconBadge}>
          <FontAwesomeIcon icon={faCompass} />
        </div>
        <div>
          <span className={eyebrow}>Jatka tästä</span>
          <h3 className="mt-1 text-xl font-light text-white">{title}</h3>
          <p className="mt-1 text-sm font-light text-[#9fb0c7]">{text}</p>
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </section>
  )
}
