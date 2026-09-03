# Quiz endpoints

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


@router.get("", response_model=list[schemas.QuizResponse])
def list_quizzes(db: Session = Depends(get_db)):
    return db.query(models.Quiz).all()


@router.get("/{quiz_id}", response_model=schemas.QuizResponse)
def get_quiz(quiz_id: UUID, db: Session = Depends(get_db)):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    
    if quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    return quiz


@router.post("", status_code=201, response_model=schemas.QuizResponse)
def create_quiz(quiz: schemas.QuizCreate, db: Session = Depends(get_db)):
    db_quiz = models.Quiz(name=quiz.name)
    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)
    return db_quiz


@router.put("/{quiz_id}", response_model=schemas.QuizResponse)
def update_quiz(quiz_id: UUID, quiz: schemas.QuizCreate, db: Session = Depends(get_db)):
    db_quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    
    if db_quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    db_quiz.name = quiz.name
    db.commit()
    db.refresh(db_quiz)
    return db_quiz


@router.delete("/{quiz_id}", status_code=204)
def delete_quiz(quiz_id: UUID, db: Session = Depends(get_db)):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    
    if quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    db.delete(quiz)
    db.commit()
    
    return Response(status_code=204)
