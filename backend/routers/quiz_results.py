# Quiz results by topic
#
# Builds per-quiz statistics from the existing quiz_attempts, quiz_responses and
# quiz_question_options tables. Each quiz is treated as one topic (for example
# "IALA-tietovisa" and "COLREG-tietovisa"), so no schema change is needed.

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, distinct, func, select
from sqlalchemy.orm import Session

from database import get_db
from security import authorize_owner, get_current_user, is_admin
import models
import schemas

router = APIRouter(prefix="/quiz-results", tags=["quiz_results"])


@router.get("/by-topic", response_model=list[schemas.QuizTopicResult])
def list_quiz_results_by_topic(
    user_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Returns one row per quiz with attempt, answer and correct-answer counts.

    - A regular user always gets their own results. Asking for another
      user's results returns 403.
    - An admin gets every user's results combined, or one user's results
      when user_id is given.

    Every quiz is listed, also those without attempts, so the client can show
    topics that have not been tried yet.
    """
    # Regular users are limited to themselves, the same rule as /quiz-attempts.
    if not is_admin(current_user):
        if user_id is not None:
            authorize_owner(current_user, user_id)
        user_id = current_user.id
    elif user_id is not None:
        # Admin asked for a specific user: tell apart "no results" and "no such user".
        user = db.query(models.User).filter(models.User.id == user_id).first()

        if user is None:
            raise HTTPException(status_code=404, detail="User not found")

    # The user filter sits in the join condition, not in WHERE, so quizzes
    # without matching attempts still come back with zero counts.
    attempt_join = models.QuizAttempt.quiz_id == models.Quiz.id

    if user_id is not None:
        attempt_join = and_(attempt_join, models.QuizAttempt.user_id == user_id)

    # Counted separately so the joined responses do not multiply the number.
    question_count = (
        select(func.count(models.QuizQuestion.id))
        .where(models.QuizQuestion.quiz_id == models.Quiz.id)
        .correlate(models.Quiz)
        .scalar_subquery()
    )

    rows = (
        db.query(
            models.Quiz.id.label("quiz_id"),
            models.Quiz.name.label("quiz_name"),
            question_count.label("question_count"),
            # DISTINCT because each attempt appears once per response after the joins.
            func.count(distinct(models.QuizAttempt.id)).label("attempt_count"),
            func.count(models.QuizResponse.id).label("answer_count"),
            func.count(models.QuizQuestionOption.id)
            .filter(models.QuizQuestionOption.is_correct.is_(True))
            .label("correct_count"),
            func.max(models.QuizAttempt.created_at).label("last_attempt_at"),
        )
        .select_from(models.Quiz)
        .outerjoin(models.QuizAttempt, attempt_join)
        .outerjoin(
            models.QuizResponse,
            models.QuizResponse.attempt_id == models.QuizAttempt.id,
        )
        .outerjoin(
            models.QuizQuestionOption,
            models.QuizQuestionOption.id == models.QuizResponse.selected_option_id,
        )
        .group_by(models.Quiz.id, models.Quiz.name, models.Quiz.created_at)
        # Same order as the quizzes were created, id breaks ties deterministically.
        .order_by(models.Quiz.created_at, models.Quiz.id)
        .all()
    )

    return [
        schemas.QuizTopicResult(
            quiz_id=row.quiz_id,
            quiz_name=row.quiz_name,
            question_count=row.question_count,
            attempt_count=row.attempt_count,
            answer_count=row.answer_count,
            correct_count=row.correct_count,
            accuracy=(
                row.correct_count / row.answer_count if row.answer_count else None
            ),
            last_attempt_at=row.last_attempt_at,
        )
        for row in rows
    ]
