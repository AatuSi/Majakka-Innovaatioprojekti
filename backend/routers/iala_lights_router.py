from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas

router = APIRouter(tags=["iala_lights"])

@router.get("", response_model=list[schemas.IalaLightResponse])
def list_iala_lights(
    category: Optional[str] = Query(None, description="Filter by category (e.g. cardinal, lateral)"),
    search: Optional[str] = Query(None, description="Search by name or description"),
    db: Session = Depends(get_db),
):
    """List and browse IALA lights with optional category and keyword search."""
    query = db.query(models.IalaLight)

    if category:
        query = query.filter(models.IalaLight.category == category)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                models.IalaLight.name.ilike(search_pattern),
                models.IalaLight.description.ilike(search_pattern),
            )
        )

    return query.order_by(models.IalaLight.name).all()


@router.get("/{light_id}", response_model=schemas.IalaLightResponse)
def get_iala_light(light_id: UUID, db: Session = Depends(get_db)):
    """Fetch a single IALA light by its UUID."""
    light = db.query(models.IalaLight).filter(models.IalaLight.id == light_id).first()

    if light is None:
        raise HTTPException(status_code=404, detail="IALA light not found")

    return light


@router.post("", status_code=201, response_model=schemas.IalaLightResponse)
def create_iala_light(
    light_in: schemas.IalaLightCreate,
    db: Session = Depends(get_db),
):
    """Add a new IALA light to the catalog."""
    db_light = models.IalaLight(
        name=light_in.name,
        category=light_in.category,
        description=light_in.description,
        config=light_in.config,
    )

    db.add(db_light)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=f"An IALA light with the name '{light_in.name}' already exists.",
        )

    db.refresh(db_light)
    return db_light


@router.put("/{light_id}", response_model=schemas.IalaLightResponse)
def update_iala_light(
    light_id: UUID,
    light_in: schemas.IalaLightCreate,
    db: Session = Depends(get_db),
):
    """Update an existing IALA light entry."""
    db_light = db.query(models.IalaLight).filter(models.IalaLight.id == light_id).first()

    if db_light is None:
        raise HTTPException(status_code=404, detail="IALA light not found")

    db_light.name = light_in.name
    db_light.category = light_in.category
    db_light.description = light_in.description
    db_light.config = light_in.config

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=f"An IALA light with the name '{light_in.name}' already exists.",
        )

    db.refresh(db_light)
    return db_light


@router.delete("/{light_id}", status_code=204)
def delete_iala_light(light_id: UUID, db: Session = Depends(get_db)):
    """Delete an IALA light from the catalog."""
    db_light = db.query(models.IalaLight).filter(models.IalaLight.id == light_id).first()

    if db_light is None:
        raise HTTPException(status_code=404, detail="IALA light not found")

    db.delete(db_light)
    db.commit()
    return Response(status_code=204)