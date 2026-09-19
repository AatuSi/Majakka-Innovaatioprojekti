from enum import Enum
from typing import List, Optional, Any, Dict
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"


# --- USER SCHEMAS ---

class UserBase(BaseModel):
    username: str


class UserCreate(UserBase):
    password: str
    role: Optional[UserRole] = UserRole.USER


# Fields left out keep their current value.
class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None


class UserResponse(UserBase):
    id: UUID
    role: UserRole
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# --- OPTION SCHEMAS ---

class QuizQuestionOptionBase(BaseModel):
    option_text: Optional[str] = None
    iala_light_id: Optional[UUID] = None
    is_correct: bool = False
    position: int = 0


class QuizQuestionOptionCreate(QuizQuestionOptionBase):
    pass


class QuizQuestionOptionResponse(QuizQuestionOptionBase):
    id: UUID
    question_id: UUID
    created_at: datetime
    iala_light_id: Optional[UUID] = None

    model_config = ConfigDict(from_attributes=True)


# --- QUESTION SCHEMAS ---

class QuizQuestionBase(BaseModel):
    question_text: Optional[str] = None
    iala_light_id: Optional[UUID] = None
    position: int = 0


class QuizQuestionCreate(QuizQuestionBase):
    options: List[QuizQuestionOptionCreate] = []


# Options are managed through their own endpoints.
class QuizQuestionUpdate(QuizQuestionBase):
    pass


class QuizQuestionResponse(QuizQuestionBase):
    id: UUID
    quiz_id: UUID
    created_at: datetime
    iala_light_id: Optional[UUID] = None
    options: List[QuizQuestionOptionResponse] = []

    model_config = ConfigDict(from_attributes=True)


# --- QUIZ SCHEMAS ---

class QuizBase(BaseModel):
    name: Optional[str] = None


class QuizCreate(QuizBase):
    questions: List[QuizQuestionCreate] = []


# Questions are managed through their own endpoints.
class QuizUpdate(QuizBase):
    pass


class QuizResponse(QuizBase):
    id: UUID
    created_at: datetime
    questions: List[QuizQuestionResponse] = []

    model_config = ConfigDict(from_attributes=True)


# --- RESPONSE SCHEMAS ---

class QuizResponseCreate(BaseModel):
    question_id: UUID
    selected_option_id: UUID


class QuizResponseItemSchema(BaseModel):
    id: UUID
    attempt_id: UUID
    question_id: UUID
    selected_option_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- ATTEMPT SCHEMAS ---

class QuizAttemptCreate(BaseModel):
    user_id: UUID
    quiz_id: UUID
    responses: List[QuizResponseCreate] = []


class QuizAttemptResponse(BaseModel):
    id: UUID
    user_id: UUID
    quiz_id: UUID
    created_at: datetime
    responses: List[QuizResponseItemSchema] = []

    model_config = ConfigDict(from_attributes=True)


class IalaLightBase(BaseModel):
    name: str
    category: str
    rhythm: str
    description: Optional[str] = None
    config: Dict[str, Any]

class IalaLightCreate(IalaLightBase):
    pass

class IalaLightResponse(IalaLightBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)