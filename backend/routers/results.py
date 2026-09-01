from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas

router = APIRouter(prefix="/results", tags=["results"])


@router.get("", response_model=list[schemas.ResultResponse])
def list_results(db: Session = Depends(get_db)):
    return db.query(models.Result).order_by(models.Result.result_id).all()


@router.get("/{result_id}", response_model=schemas.ResultResponse)
def get_result(result_id: int, db: Session = Depends(get_db)):
    result = db.query(models.Result).filter(models.Result.result_id == result_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Not found")
    return result


@router.post("", status_code=201, response_model=schemas.ResultResponse)
def create_result(result: schemas.ResultCreate, db: Session = Depends(get_db)):
    db_result = models.Result(**result.dict())
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result


@router.put("/{result_id}", response_model=schemas.ResultResponse)
def update_result(result_id: int, result: schemas.ResultCreate, db: Session = Depends(get_db)):
    db_result = db.query(models.Result).filter(models.Result.result_id == result_id).first()
    if not db_result:
        raise HTTPException(status_code=404, detail="Not found")
    
    db_result.account_id = result.account_id
    db_result.results = result.results
    db.commit()
    db.refresh(db_result)
    return db_result


@router.delete("/{result_id}", status_code=204)
def delete_result(result_id: int, db: Session = Depends(get_db)):
    result = db.query(models.Result).filter(models.Result.result_id == result_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Not found")
    
    db.delete(result)
    db.commit()
    return Response(status_code=204)
