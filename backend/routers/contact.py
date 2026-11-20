from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from security import require_admin
import models
import schemas

router = APIRouter(prefix="/contact", tags=["contact"])


@router.get("", response_model=list[schemas.ContactMessageResponse], dependencies=[Depends(require_admin)])
def list_contact_messages(db: Session = Depends(get_db)):
    return (
        db.query(models.ContactMessage)
        .order_by(models.ContactMessage.created_at.desc())
        .all()
    )

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