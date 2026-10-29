from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas

router = APIRouter(prefix="/contact", tags=["contact"])

@router.post("", status_code=201,response_model=schemas.ContactMessageResponse,)
def create_contact_message(
    contact: schemas.ContactMessageCreate,
    db: Session = Depends(get_db),
):
    db_contact = models.ContactMessage(
        first_name=contact.first_name,
        last_name=contact.last_name,
        email=contact.email,
        topic=contact.topic,
        message=contact.message,
    )

    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)

    return db_contact