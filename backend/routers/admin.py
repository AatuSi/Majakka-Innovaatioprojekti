from datetime import date, datetime, time
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from security import get_current_user
import models

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/metrics", dependencies=[Depends(get_current_user)])
def get_admin_metrics(
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    db: Session = Depends(get_db),
):
    total_users = db.query(func.count(models.User.id)).scalar() or 0
    total_attempts = db.query(func.count(models.QuizAttempt.id)).scalar() or 0

    user_query = db.query(
        func.date(models.User.created_at).label("day"),
        func.count(models.User.id).label("count"),
    )
    attempt_query = db.query(
        func.date(models.QuizAttempt.created_at).label("day"),
        func.count(models.QuizAttempt.id).label("count"),
    )

    if start_date:
        start_dt = datetime.combine(start_date, time.min)
        user_query = user_query.filter(models.User.created_at >= start_dt)
        attempt_query = attempt_query.filter(models.QuizAttempt.created_at >= start_dt)

    if end_date:
        end_dt = datetime.combine(end_date, time.max)
        user_query = user_query.filter(models.User.created_at <= end_dt)
        attempt_query = attempt_query.filter(models.QuizAttempt.created_at <= end_dt)

    users_by_day = {
        str(row.day): row.count
        for row in user_query.group_by(func.date(models.User.created_at)).all()
    }
    attempts_by_day = {
        str(row.day): row.count
        for row in attempt_query.group_by(func.date(models.QuizAttempt.created_at)).all()
    }

    return {
        "total_users": total_users,
        "total_quiz_attempts": total_attempts,
        "users_by_day": users_by_day,
        "attempts_by_day": attempts_by_day,
    }