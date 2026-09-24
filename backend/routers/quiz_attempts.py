# Quiz attempt endpoints

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from database import get_db
import models
import schemas
import validation

router = APIRouter(prefix="/quiz-attempts", tags=["quiz_attempts"])


@router.get("", response_model=list[schemas.QuizAttemptResponse])
def list_attempts(db: Session = Depends(get_db)):
    return (
        db.query(models.QuizAttempt)
        .options(selectinload(models.QuizAttempt.responses))
        .order_by(models.QuizAttempt.created_at, models.QuizAttempt.id)
        .all()
    )


@router.get("/{attempt_id}", response_model=schemas.QuizAttemptResponse)
def get_attempt(attempt_id: UUID, db: Session = Depends(get_db)):
    attempt = db.query(models.QuizAttempt).filter(models.QuizAttempt.id == attempt_id).first()

    if attempt is None:
        raise HTTPException(status_code=404, detail="Attempt not found")

    return attempt


@router.post("", status_code=201, response_model=schemas.QuizAttemptResponse)
def create_attempt(attempt: schemas.QuizAttemptCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == attempt.user_id).first()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    quiz = db.query(models.Quiz).filter(models.Quiz.id == attempt.quiz_id).first()

    if quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found")

    answered_question_ids = set()

    for response in attempt.responses:
        validation.require_answer_is_consistent(
            db,
            attempt.quiz_id,
            response.question_id,
            response.selected_option_id,
        )

        if response.question_id in answered_question_ids:
            raise HTTPException(
                status_code=409,
                detail="This question has already been answered in this attempt",
            )

        answered_question_ids.add(response.question_id)

    db_attempt = models.QuizAttempt(
        user_id=attempt.user_id,
        quiz_id=attempt.quiz_id,
    )

    for response in attempt.responses:
        db_attempt.responses.append(
            models.QuizResponse(
                question_id=response.question_id,
                selected_option_id=response.selected_option_id,
            )
        )

    db.add(db_attempt)

    # Backstop: the checks above race against concurrent writers.
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="This question has already been answered in this attempt",
        )

    db.refresh(db_attempt)
    return db_attempt


@router.delete("/{attempt_id}", status_code=204)
def delete_attempt(attempt_id: UUID, db: Session = Depends(get_db)):
    attempt = db.query(models.QuizAttempt).filter(models.QuizAttempt.id == attempt_id).first()

    if attempt is None:
        raise HTTPException(status_code=404, detail="Attempt not found")

    db.delete(attempt)
    db.commit()

    return Response(status_code=204)
