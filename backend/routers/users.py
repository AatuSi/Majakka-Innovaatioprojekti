# User endpoints

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from security import authorize_owner, get_current_user, is_admin, password_hasher
import models
import schemas

router = APIRouter(prefix="/users", tags=["users"])

protected = [Depends(get_current_user)]


def duplicate_account_error(error: IntegrityError) -> HTTPException:
    if error.orig.diag.constraint_name == "users_email_lower_key":
        return HTTPException(status_code=409, detail="Email already exists")

    return HTTPException(status_code=409, detail="Username already exists")


@router.get("", response_model=list[schemas.UserSummary], dependencies=protected)
def list_users(db: Session = Depends(get_db)):
    return db.query(models.User).order_by(models.User.username).all()


@router.get("/{user_id}", response_model=schemas.UserResponse, dependencies=protected)
def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    authorize_owner(current_user, user_id)

    user = db.query(models.User).filter(models.User.id == user_id).first()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.post("", status_code=201, response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if user.role == schemas.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not allowed")

    hashed_password = password_hasher.hash(user.password)

    db_user = models.User(
        username=user.username,
        password_hash=hashed_password,
        role=user.role or models.UserRole.USER,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
    )

    db.add(db_user)

    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise duplicate_account_error(error)

    db.refresh(db_user)
    return db_user


@router.put("/{user_id}", response_model=schemas.UserResponse, dependencies=protected)
def update_user(
    user_id: UUID,
    user: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    authorize_owner(current_user, user_id)

    if user.role is not None and not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not allowed")

    db_user = db.query(models.User).filter(models.User.id == user_id).first()

    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    if user.username is not None:
        db_user.username = user.username

    if user.role is not None:
        db_user.role = user.role

    for field in ("first_name", "last_name", "email", "avatar_icon"):
        if field in user.model_fields_set:
            setattr(db_user, field, getattr(user, field))

    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise duplicate_account_error(error)

    db.refresh(db_user)
    return db_user


# A wrong current password is a 400, not a 401: the session itself is valid, and
# the frontend treats a 401 as an expired session and logs the user out.
@router.post("/{user_id}/password", status_code=204, dependencies=protected)
def change_password(
    user_id: UUID,
    passwords: schemas.PasswordChange,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    authorize_owner(current_user, user_id)

    db_user = db.query(models.User).filter(models.User.id == user_id).first()

    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    if not password_hasher.verify(passwords.current_password, db_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    db_user.password_hash = password_hasher.hash(passwords.new_password)
    db.commit()

    return Response(status_code=204)


@router.delete("/{user_id}", status_code=204, dependencies=protected)
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    authorize_owner(current_user, user_id)

    user = db.query(models.User).filter(models.User.id == user_id).first()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

    return Response(status_code=204)

