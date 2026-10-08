# Health check endpoint
#
# Public on purpose: the frontend calls it to tell whether the API, and the
# database behind it, can be reached before anyone has logged in.

from fastapi import APIRouter, Depends, Response
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from database import get_db
import schemas

router = APIRouter(prefix="/health", tags=["health"])


@router.get(
    "",
    response_model=schemas.HealthResponse,
    responses={503: {"model": schemas.HealthResponse}},
)
def health_check(response: Response, db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError:
        response.status_code = 503
        return schemas.HealthResponse(status="error", database="unavailable")

    return schemas.HealthResponse(status="ok", database="ok")
