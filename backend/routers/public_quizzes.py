# public endpoint for retrieving quizzes
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from database import get_db
from uuid import UUID

import models
import schemas

public_router = APIRouter(
    prefix="/public/quizzes",
    tags=["public-quizzes"],
)

NESTED = selectinload(models.Quiz.questions).selectinload(models.QuizQuestion.options)

@public_router.get(
    "",
    response_model=list[schemas.PublicQuizResponse],
)
def list_public_quizzes(db: Session = Depends(get_db)):
    return db.query(models.Quiz).options(NESTED).all()


@public_router.get(
    "/{quiz_id}",
    response_model=schemas.PublicQuizResponse,
)
def get_public_quiz(
    quiz_id: UUID,
    db: Session = Depends(get_db),
):
    quiz = (
        db.query(models.Quiz)
        .options(NESTED)
        .filter(models.Quiz.id == quiz_id)
        .first()
    )

    if quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found")

    return quiz

@public_router.post(
    "/{quiz_id}/answers/check",
    response_model=schemas.PublicAnswerCheckResponse,
)
def check_public_answer(
    quiz_id: UUID,
    answer: schemas.PublicAnswerCheckRequest,
    db: Session = Depends(get_db),
):
    quiz = (
        db.query(models.Quiz)
        .filter(models.Quiz.id == quiz_id)
        .first()
    )

    if quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found")

    question = (
        db.query(models.QuizQuestion)
        .filter(
            models.QuizQuestion.id == answer.question_id,
            models.QuizQuestion.quiz_id == quiz_id,
        )
        .first()
    )

    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")

    option = (
        db.query(models.QuizQuestionOption)
        .filter(
            models.QuizQuestionOption.id == answer.selected_option_id,
            models.QuizQuestionOption.question_id == answer.question_id,
        )
        .first()
    )

    if option is None:
        raise HTTPException(status_code=400, detail="Option does not belong to the question")

    correct_option = (
        db.query(models.QuizQuestionOption)
        .filter(
            models.QuizQuestionOption.question_id == question.id,
            models.QuizQuestionOption.is_correct.is_(True),
        )
        .first()
    )

    if correct_option is None:
        raise HTTPException(
            status_code=500,
            detail="Question has no correct option",
    )

    return schemas.PublicAnswerCheckResponse(
        correct=option.is_correct,
        correct_option_id=correct_option.id,
        explanation=question.explanation,
    )