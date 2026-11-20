from datetime import datetime
from enum import Enum
from typing import Annotated, Any, Dict, List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

# Column bounds, so oversized input fails validation instead of the insert.
Name = Annotated[str, Field(max_length=255)]
Label = Annotated[str, Field(max_length=100)]
Position = Annotated[int, Field(ge=-2**31, le=2**31 - 1)]

# No "@": that is how login tells a username from an email address.
Username = Annotated[Name, Field(min_length=1, pattern=r"^[^@]*$")]
Password = Annotated[str, Field(min_length=1)]
PersonName = Annotated[str, Field(min_length=1, max_length=100)]
Email = Annotated[str, Field(min_length=3, max_length=320)]
AvatarIcon = Literal["user", "graduation-cap"]
TimeSpentMs = Annotated[int, Field(ge=0, le=2**31 - 1)]


class UserRole(str, Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    USER = "user"


# --- USER SCHEMAS ---

class UserBase(BaseModel):
    username: Name
    first_name: Optional[Annotated[str, Field(max_length=100)]] = None
    last_name: Optional[Annotated[str, Field(max_length=100)]] = None
    email: Optional[Annotated[str, Field(max_length=320)]] = None


class UserCreate(UserBase):
    username: Username
    password: Password
    role: Optional[UserRole] = UserRole.USER
    first_name: Optional[PersonName] = None
    last_name: Optional[PersonName] = None
    email: Optional[Email] = None


# Fields left out keep their current value; an explicit null clears a personal
# detail. Passwords change through POST /users/{id}/password, which checks the
# current one first.
class UserUpdate(BaseModel):
    username: Optional[Username] = None
    role: Optional[UserRole] = None
    first_name: Optional[Annotated[str, Field(max_length=100)]] = None
    last_name: Optional[Annotated[str, Field(max_length=100)]] = None
    email: Optional[Annotated[str, Field(max_length=320)]] = None
    avatar_icon: Optional[AvatarIcon] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: Password


# What every logged-in user may see of other users: no personal details.
class UserSummary(UserBase):
    id: UUID
    role: UserRole
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# The full account, only ever returned to its owner or an admin.
class UserResponse(UserSummary):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    avatar_icon: Optional[AvatarIcon] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user:UserResponse


# --- HEALTH SCHEMAS ---

class HealthResponse(BaseModel):
    status: Literal["ok", "error"]
    database: Literal["ok", "unavailable"]


# --- OPTION SCHEMAS ---

class QuizQuestionOptionBase(BaseModel):
    option_text: Optional[str] = None
    iala_light_id: Optional[UUID] = None
    is_correct: bool = False
    position: Position = 0


class QuizQuestionOptionCreate(QuizQuestionOptionBase):
    pass


# Fields left out keep their current value. An explicit null clears a nullable
# field; for the NOT NULL columns (is_correct, position) null means "unchanged".
class QuizQuestionOptionUpdate(BaseModel):
    option_text: Optional[str] = None
    iala_light_id: Optional[UUID] = None
    is_correct: Optional[bool] = None
    position: Optional[Position] = None


class QuizQuestionOptionResponse(QuizQuestionOptionBase):
    id: UUID
    question_id: UUID
    created_at: datetime
    iala_light_id: Optional[UUID] = None

    model_config = ConfigDict(from_attributes=True)


# --- QUESTION SCHEMAS ---

class QuizQuestionBase(BaseModel):
    question_text: Optional[str] = None
    explanation: Optional[str] = None
    hint: Optional[str] = None
    topic: Optional[Label] = None
    iala_light_id: Optional[UUID] = None
    position: Position = 0
    answer_image_url: Optional[str] = None


class QuizQuestionCreate(QuizQuestionBase):
    options: List[QuizQuestionOptionCreate] = []


# Options are managed through their own endpoints. Fields left out keep their
# current value; an explicit null clears question_text or iala_light_id.
class QuizQuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    explanation: Optional[str] = None
    hint: Optional[str] = None
    topic: Optional[Label] = None
    iala_light_id: Optional[UUID] = None
    position: Optional[Position] = None
    answer_image_url: Optional[str] = None


class QuizQuestionResponse(QuizQuestionBase):
    id: UUID
    quiz_id: UUID
    created_at: datetime
    iala_light_id: Optional[UUID] = None
    options: List[QuizQuestionOptionResponse] = []

    model_config = ConfigDict(from_attributes=True)


# --- QUIZ SCHEMAS ---

class QuizBase(BaseModel):
    name: Optional[Name] = None


class QuizCreate(QuizBase):
    questions: List[QuizQuestionCreate] = []


# Questions are managed through their own endpoints. A name left out keeps its
# current value; an explicit null clears it.
class QuizUpdate(BaseModel):
    name: Optional[Name] = None


class QuizResponse(QuizBase):
    id: UUID
    created_at: datetime
    questions: List[QuizQuestionResponse] = []

    model_config = ConfigDict(from_attributes=True)


# --- RESPONSE SCHEMAS ---

class QuizResponseCreate(BaseModel):
    question_id: UUID
    selected_option_id: UUID
    time_spent_ms: Optional[TimeSpentMs] = None


class QuizResponseItemSchema(BaseModel):
    id: UUID
    attempt_id: UUID
    question_id: UUID
    selected_option_id: UUID
    is_correct: bool
    time_spent_ms: Optional[int] = None
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
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    responses: List[QuizResponseItemSchema] = []

    model_config = ConfigDict(from_attributes=True)


class QuizAttemptHistoryItem(BaseModel):
    id: UUID
    quiz_id: UUID
    quiz_name: Optional[str] = None
    created_at: datetime
    completed_at: datetime
    duration_seconds: Optional[int] = None
    score: int
    total_questions: int


class IalaLightBase(BaseModel):
    name: Name
    category: Label
    rhythm: Label
    description: Optional[str] = None
    config: Dict[str, Any]

class IalaLightCreate(IalaLightBase):
    pass

class IalaLightResponse(IalaLightBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ContactMessageCreate(BaseModel):
    first_name: Annotated[str, Field(min_length=1, max_length=100)]
    last_name: Annotated[str, Field(min_length=1, max_length=100)]
    email: Annotated[str, Field(min_length=3, max_length=320)]
    topic: Annotated[str, Field(min_length=1, max_length=100)]
    message: Annotated[str, Field(min_length=1, max_length=5000)]


class ContactMessageResponse(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    email: str
    topic: str
    message: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- PUBLIC QUIZ SCHEMAS ---


class PublicQuizQuestionOptionResponse(BaseModel):
    id: UUID
    question_id: UUID
    option_text: Optional[str] = None
    iala_light_id: Optional[UUID] = None
    position: Position = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PublicQuizQuestionResponse(BaseModel):
    id: UUID
    quiz_id: UUID
    question_text: Optional[str] = None
    hint: Optional[str] = None
    iala_light_id: Optional[UUID] = None
    answer_image_url: Optional[str] = None
    position: Position = 0
    created_at: datetime
    options: List[PublicQuizQuestionOptionResponse] = []

    model_config = ConfigDict(from_attributes=True)


class PublicQuizResponse(BaseModel):
    id: UUID
    name: Optional[Name] = None
    created_at: datetime
    questions: List[PublicQuizQuestionResponse] = []

    model_config = ConfigDict(from_attributes=True)

class PublicAnswerCheckRequest(BaseModel):
    question_id: UUID
    selected_option_id: UUID


class PublicAnswerCheckResponse(BaseModel):
    correct: bool
    correct_option_id: UUID
    explanation: Optional[str] = None


# --- QUIZ RESULTS BY TOPIC ---


class QuizTopicResult(BaseModel):
    """Aggregated results for one quiz. Each quiz is one topic (e.g. IALA, COLREG)."""

    quiz_id: UUID
    quiz_name: Optional[str] = None
    # Questions the quiz currently has, so the client can show progress against it.
    question_count: int
    # Attempts made, including ones saved without answers.
    attempt_count: int
    # Answers given across all counted attempts.
    answer_count: int
    # Answers whose selected option is marked correct.
    correct_count: int
    # correct_count / answer_count, between 0 and 1; None when nothing was answered.
    accuracy: Optional[float] = None
    # Time of the most recent counted attempt; None when there are no attempts.
    last_attempt_at: Optional[datetime] = None
