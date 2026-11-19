from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from database import get_db
from security import require_admin
import models
import schemas

router = APIRouter(prefix="/contact", tags=["contact"])

# POST /contact stays public. The management endpoints below are admin only;
# the router is included without the global auth dependency in main.py, so
# each of them declares it here.
admin_only = [Depends(require_admin)]

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

# --- Management of sent messages (admin only) ---


@router.get(
    "",
    response_model=list[schemas.ContactMessageResponse],
    dependencies=admin_only,
)
def list_contact_messages(
    topic: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Lists sent contact messages, newest first. topic filters by exact topic."""
    query = db.query(models.ContactMessage)

    if topic is not None:
        query = query.filter(models.ContactMessage.topic == topic)

    # created_at can tie within a transaction, id keeps the order stable.
    return query.order_by(
        models.ContactMessage.created_at.desc(),
        models.ContactMessage.id.desc(),
    ).all()


@router.get(
    "/{message_id}",
    response_model=schemas.ContactMessageResponse,
    dependencies=admin_only,
)
def get_contact_message(message_id: UUID, db: Session = Depends(get_db)):
    """Returns one sent contact message."""
    message = (
        db.query(models.ContactMessage)
        .filter(models.ContactMessage.id == message_id)
        .first()
    )

    if message is None:
        raise HTTPException(status_code=404, detail="Contact message not found")

    return message


@router.delete("/{message_id}", status_code=204, dependencies=admin_only)
def delete_contact_message(message_id: UUID, db: Session = Depends(get_db)):
    """Deletes a sent contact message permanently, e.g. once it has been handled."""
    message = (
        db.query(models.ContactMessage)
        .filter(models.ContactMessage.id == message_id)
        .first()
    )

    if message is None:
        raise HTTPException(status_code=404, detail="Contact message not found")

    db.delete(message)
    db.commit()

    return Response(status_code=204)
