# Quiz question endpoints

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas

router = APIRouter(tags=["quiz_questions"])


@router.get("/quizzes/{quiz_id}/questions", response_model=list[schemas.QuizQuestionResponse])
def list_questions(quiz_id: UUID, db: Session = Depends(get_db)):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    
    if quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    return db.query(models.QuizQuestion).filter(models.QuizQuestion.quiz_id == quiz_id).order_by(models.QuizQuestion.position).all()


@router.get("/quiz-questions/{question_id}", response_model=schemas.QuizQuestionResponse)
def get_question(question_id: UUID, db: Session = Depends(get_db)):
    question = db.query(models.QuizQuestion).filter(models.QuizQuestion.id == question_id).first()
    
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    
    return question


@router.post("/quizzes/{quiz_id}/questions", status_code=201, response_model=schemas.QuizQuestionResponse)
def create_question(quiz_id: UUID, question: schemas.QuizQuestionCreate, db: Session = Depends(get_db)):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    
    if quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    db_question = models.QuizQuestion(
        quiz_id=quiz_id,
        question_text=question.question_text,
        position=question.position,
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question


@router.put("/quiz-questions/{question_id}", response_model=schemas.QuizQuestionResponse)
def update_question(question_id: UUID, question: schemas.QuizQuestionCreate, db: Session = Depends(get_db)):
    db_question = db.query(models.QuizQuestion).filter(models.QuizQuestion.id == question_id).first()
    
    if db_question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    
    db_question.question_text = question.question_text
    db_question.position = question.position
    db.commit()
    db.refresh(db_question)
    return db_question


@router.delete("/quiz-questions/{question_id}", status_code=204)
def delete_question(question_id: UUID, db: Session = Depends(get_db)):
    question = db.query(models.QuizQuestion).filter(models.QuizQuestion.id == question_id).first()
    
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    
    db.delete(question)
    db.commit()
    
    return Response(status_code=204)
