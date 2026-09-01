from pydantic import BaseModel
from datetime import datetime


class AccountCreate(BaseModel):
    username: str
    password_hash: str


class AccountResponse(BaseModel):
    account_id: int
    username: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ResultCreate(BaseModel):
    account_id: int
    results: str


class ResultResponse(BaseModel):
    result_id: int
    account_id: int
    results: str
    recorded_at: datetime

    class Config:
        from_attributes = True
