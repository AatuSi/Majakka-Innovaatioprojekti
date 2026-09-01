from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from database import Base


class Account(Base):
    __tablename__ = "account"

    account_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(32), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)


class Result(Base):
    __tablename__ = "result"

    result_id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("account.account_id"), nullable=False)
    results = Column(Text, nullable=False)
    recorded_at = Column(DateTime, default=func.now(), nullable=False)
