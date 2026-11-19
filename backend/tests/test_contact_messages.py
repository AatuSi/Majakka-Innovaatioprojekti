# Tests for managing sent contact messages (list, get, delete).

import pytest

from main import app
import models
from security import get_current_user

MISSING_UUID = "00000000-0000-0000-0000-000000000000"


def send_message(client, topic="Palaute", message="Hei!"):
    """Sends a message through the public endpoint, like the contact form does."""
    response = client.post(
        "/contact",
        json={
            "first_name": "Maija",
            "last_name": "Meikalainen",
            "email": "maija@example.com",
            "topic": topic,
            "message": message,
        },
    )
    assert response.status_code == 201

    return response.json()


@pytest.fixture
def regular_client(anon_client):
    """A client logged in as a regular user, who must not see the messages."""
    app.dependency_overrides[get_current_user] = lambda: models.User(role=models.UserRole.USER)
    return anon_client


def test_list_messages_returns_empty_list(client):
    response = client.get("/contact")

    assert response.status_code == 200
    assert response.json() == []


def test_list_messages_returns_sent_messages_newest_first(client):
    first = send_message(client, message="Eka")
    second = send_message(client, message="Toka")

    response = client.get("/contact")

    assert response.status_code == 200
    assert [message["id"] for message in response.json()] == [second["id"], first["id"]]


def test_list_messages_filters_by_topic(client):
    feedback = send_message(client, topic="Palaute")
    send_message(client, topic="Yhteistyo")

    response = client.get("/contact", params={"topic": "Palaute"})

    assert response.status_code == 200
    assert response.json() == [feedback]


def test_get_message(client):
    sent = send_message(client)

    response = client.get(f"/contact/{sent['id']}")

    assert response.status_code == 200
    assert response.json() == sent


def test_get_missing_message_returns_not_found(client):
    response = client.get(f"/contact/{MISSING_UUID}")

    assert response.status_code == 404


def test_delete_message(client):
    sent = send_message(client)

    response = client.delete(f"/contact/{sent['id']}")

    assert response.status_code == 204
    assert client.get(f"/contact/{sent['id']}").status_code == 404


def test_delete_missing_message_returns_not_found(client):
    response = client.delete(f"/contact/{MISSING_UUID}")

    assert response.status_code == 404


@pytest.mark.parametrize("method", ["get", "delete"])
def test_message_invalid_uuid(client, method):
    response = client.request(method.upper(), "/contact/not-a-valid-uuid")

    assert response.status_code == 422


def test_regular_user_cannot_list_messages(regular_client):
    response = regular_client.get("/contact")

    assert response.status_code == 403


@pytest.mark.parametrize("method", ["get", "delete"])
def test_regular_user_cannot_read_or_delete_message(regular_client, method):
    sent = send_message(regular_client)

    response = regular_client.request(method.upper(), f"/contact/{sent['id']}")

    assert response.status_code == 403


def test_sending_message_stays_public(anon_client):
    send_message(anon_client)
