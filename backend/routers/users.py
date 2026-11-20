# User endpoints

from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from security import authorize_owner, get_current_user, is_admin, password_hasher
import models
import schemas

router = APIRouter(prefix="/users", tags=["users"])

protected = [Depends(get_current_user)]

AVATAR_DIR = Path("uploads/avatars")
AVATAR_MAX_BYTES = 2 * 1024 * 1024
AVATAR_CONTENT_TYPES: dict[str, str] = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
}


def duplicate_account_error(error: IntegrityError) -> HTTPException:
    if error.orig.diag.constraint_name == "users_email_lower_key":
        return HTTPException(status_code=409, detail="Email already exists")

    return HTTPException(status_code=409, detail="Username already exists")


def _get_avatar_file_path(user_id: UUID) -> Path | None:
    if not AVATAR_DIR.exists():
        return None
    for ext in AVATAR_CONTENT_TYPES.values():
        candidate = AVATAR_DIR / f"{user_id}{ext}"
        if candidate.is_file():
            return candidate
    return None


@router.get("", response_model=list[schemas.UserSummary], dependencies=protected)
def list_users(db: Session = Depends(get_db)):
    return db.query(models.User).order_by(models.User.username).all()


@router.get("/me", response_model=schemas.UserResponse, dependencies=protected)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


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

    if "role" in user.model_fields_set and user.role is not None:
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


@router.get("/{user_id}/avatar")
def get_avatar(user_id: UUID):
    avatar_path = _get_avatar_file_path(user_id)
    if avatar_path is None:
        raise HTTPException(status_code=404, detail="Avatar not found")
    return FileResponse(avatar_path)


@router.put("/{user_id}/avatar", response_model=schemas.UserResponse, dependencies=protected)
async def upload_avatar(
    user_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    authorize_owner(current_user, user_id)

    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    ext = AVATAR_CONTENT_TYPES.get(file.content_type or "")
    if ext is None:
        raise HTTPException(
            status_code=415,
            detail="Unsupported image type. Use PNG, JPEG, or WebP.",
        )

    content = await file.read()
    if len(content) > AVATAR_MAX_BYTES:
        raise HTTPException(status_code=413, detail="Image too large (max 2 MB)")

    AVATAR_DIR.mkdir(parents=True, exist_ok=True)
    for existing_ext in AVATAR_CONTENT_TYPES.values():
        existing_file = AVATAR_DIR / f"{user_id}{existing_ext}"
        if existing_file.is_file():
            existing_file.unlink()

    target_path = AVATAR_DIR / f"{user_id}{ext}"
    target_path.write_bytes(content)

    if hasattr(db_user, "avatar_updated_at"):
        db_user.avatar_updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(db_user)

    return db_user


@router.delete("/{user_id}/avatar", status_code=204, dependencies=protected)
def delete_avatar(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    authorize_owner(current_user, user_id)

    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    for existing_ext in AVATAR_CONTENT_TYPES.values():
        existing_file = AVATAR_DIR / f"{user_id}{existing_ext}"
        if existing_file.is_file():
            existing_file.unlink()

    if hasattr(db_user, "avatar_updated_at"):
        db_user.avatar_updated_at = None
        db.commit()

    return Response(status_code=204)


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