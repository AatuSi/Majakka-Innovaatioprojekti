# App initialization, dependency injection setup

from fastapi import FastAPI
from routers import (
    users,
    quizzes,
    quiz_questions,
    quiz_question_options,
    quiz_attempts,
    quiz_responses,
)

app = FastAPI()

app.include_router(users.router)
app.include_router(quizzes.router)
app.include_router(quiz_questions.router)
app.include_router(quiz_question_options.router)
app.include_router(quiz_attempts.router)
app.include_router(quiz_responses.router)
