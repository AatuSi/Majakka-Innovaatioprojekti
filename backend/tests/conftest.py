import pytest
import os
import psycopg
from fastapi.testclient import TestClient

from database import SessionLocal, get_db
from main import app

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://testuser:testpass@localhost:5433/testdb",
)

ENVIRONMENT = os.getenv("ENVIRONMENT")
if ENVIRONMENT != "testing":
    raise RuntimeError(
        "Refusing to run destructive test DB setup unless ENVIRONMENT=testing",
    )

PSYCOPG_DATABASE_URL = DATABASE_URL.replace(
    "postgresql+psycopg://",
    "postgresql://",
)

@pytest.fixture(scope="session", autouse=True)
def initialize_database():
    """Runs the schema.sql file in the Docker test database once before the tests start."""
    schema_path = os.path.join(os.path.dirname(__file__), "..", "schema.sql")
    
    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    with psycopg.connect(PSYCOPG_DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
            cur.execute(schema_sql)
        conn.commit()


@pytest.fixture(autouse=True)
def clean_tables():
    """Clears data from all tables before each test."""
    tables = [
        "quiz_responses",
        "quiz_attempts",
        "quiz_question_options",
        "quiz_questions",
        "quizzes",
        "iala_lights",
        "users"
    ]
    
    with psycopg.connect(PSYCOPG_DATABASE_URL) as conn:
        with conn.cursor() as cur:
            truncate_query = f"TRUNCATE TABLE {', '.join(tables)} RESTART IDENTITY CASCADE;"
            cur.execute(truncate_query)
        conn.commit()

@pytest.fixture
def client():
    db = SessionLocal()

    def override_get_db():
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()