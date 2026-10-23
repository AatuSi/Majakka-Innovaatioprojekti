from sqlalchemy.exc import OperationalError

from database import get_db
from main import app


class UnreachableDatabase:
    """Stands in for a session whose database connection has gone away."""

    def execute(self, *args, **kwargs):
        raise OperationalError("SELECT 1", {}, Exception("connection refused"))


def test_health_reports_ok_without_token(anon_client):
    response = anon_client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


def test_health_reports_unavailable_database(anon_client):
    app.dependency_overrides[get_db] = lambda: UnreachableDatabase()

    response = anon_client.get("/health")

    assert response.status_code == 503
    assert response.json() == {"status": "error", "database": "unavailable"}


def test_health_allows_frontend_origin(anon_client):
    response = anon_client.get(
        "/health",
        headers={"Origin": "http://localhost:3000"},
    )

    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
