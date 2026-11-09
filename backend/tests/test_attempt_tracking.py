import pytest

from main import app
import models
from security import get_current_user


def make_student(client, username):
    user = client.post(
        "/users",
        json={"username": username, "password": "secret123"},
    ).json()
    token = client.post(
        "/auth/login",
        json={"username": username, "password": "secret123"},
    ).json()["access_token"]

    return {"id": user["id"], "headers": {"Authorization": f"Bearer {token}"}}


def act_as_admin():
    app.dependency_overrides[get_current_user] = lambda: models.User(role=models.UserRole.ADMIN)


def act_as_token_holder():
    app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture
def student(client, answerable_question):
    """A real logged-in user; the quiz was built as admin before this runs."""
    act_as_token_holder()
    return make_student(client, "student")


def start_attempt(client, student, quiz_id):
    response = client.post(
        "/quiz-attempts",
        json={"user_id": student["id"], "quiz_id": quiz_id},
        headers=student["headers"],
    )
    assert response.status_code == 201
    return response.json()["id"]


def answer(client, student, attempt_id, question, option_index, **extra):
    return client.post(
        f"/quiz-attempts/{attempt_id}/responses",
        json={
            "question_id": question["id"],
            "selected_option_id": question["options"][option_index]["id"],
            **extra,
        },
        headers=student["headers"],
    )


def complete(client, student, attempt_id):
    return client.post(
        f"/quiz-attempts/{attempt_id}/complete",
        headers=student["headers"],
    )


def history(client, student):
    response = client.get("/quiz-attempts/history", headers=student["headers"])
    assert response.status_code == 200
    return response.json()


def test_new_attempt_is_not_completed(client, student, created_quiz):
    attempt_id = start_attempt(client, student, created_quiz["id"])

    attempt = client.get(f"/quiz-attempts/{attempt_id}", headers=student["headers"]).json()

    assert attempt["completed_at"] is None
    assert attempt["duration_seconds"] is None


def test_answer_records_correctness_and_time(client, student, created_quiz, answerable_question):
    attempt_id = start_attempt(client, student, created_quiz["id"])

    response = answer(client, student, attempt_id, answerable_question, 0, time_spent_ms=1500)

    assert response.status_code == 201
    assert response.json()["is_correct"] is True
    assert response.json()["time_spent_ms"] == 1500


def test_wrong_answer_is_recorded_as_incorrect(client, student, created_quiz, answerable_question):
    attempt_id = start_attempt(client, student, created_quiz["id"])

    response = answer(client, student, attempt_id, answerable_question, 1)

    assert response.json()["is_correct"] is False
    assert response.json()["time_spent_ms"] is None


def test_client_cannot_claim_its_answer_was_correct(client, student, created_quiz, answerable_question):
    attempt_id = start_attempt(client, student, created_quiz["id"])

    response = answer(client, student, attempt_id, answerable_question, 1, is_correct=True)

    assert response.json()["is_correct"] is False


def test_negative_time_is_rejected(client, student, created_quiz, answerable_question):
    attempt_id = start_attempt(client, student, created_quiz["id"])

    response = answer(client, student, attempt_id, answerable_question, 0, time_spent_ms=-1)

    assert response.status_code == 422


def test_correcting_a_question_keeps_past_results(client, student, created_quiz, answerable_question):
    attempt_id = start_attempt(client, student, created_quiz["id"])
    answer(client, student, attempt_id, answerable_question, 0)
    complete(client, student, attempt_id)

    act_as_admin()
    updated = client.put(
        f"/quiz-question-options/{answerable_question['options'][0]['id']}",
        json={"is_correct": False},
    )
    assert updated.status_code == 200
    act_as_token_holder()

    assert history(client, student)[0]["score"] == 1


def test_complete_sets_time_and_duration(client, student, created_quiz):
    attempt_id = start_attempt(client, student, created_quiz["id"])

    response = complete(client, student, attempt_id)

    assert response.status_code == 200
    assert response.json()["completed_at"] is not None
    assert response.json()["duration_seconds"] >= 0


def test_complete_twice_is_a_conflict(client, student, created_quiz):
    attempt_id = start_attempt(client, student, created_quiz["id"])
    complete(client, student, attempt_id)

    assert complete(client, student, attempt_id).status_code == 409


def test_answering_a_completed_attempt_is_a_conflict(client, student, created_quiz, answerable_question):
    attempt_id = start_attempt(client, student, created_quiz["id"])
    complete(client, student, attempt_id)

    response = answer(client, student, attempt_id, answerable_question, 0)

    assert response.status_code == 409


def test_complete_missing_attempt_returns_not_found(client, student):
    response = complete(client, student, "00000000-0000-0000-0000-000000000000")

    assert response.status_code == 404


def test_cannot_complete_another_users_attempt(client, student, created_quiz):
    attempt_id = start_attempt(client, student, created_quiz["id"])
    other = make_student(client, "other")

    assert complete(client, other, attempt_id).status_code == 403


def test_history_reports_score_and_quiz_name(client, student, created_quiz, answerable_question):
    attempt_id = start_attempt(client, student, created_quiz["id"])
    answer(client, student, attempt_id, answerable_question, 0)
    complete(client, student, attempt_id)

    items = history(client, student)

    assert len(items) == 1
    assert items[0]["id"] == attempt_id
    assert items[0]["quiz_name"] == "test quiz"
    assert items[0]["score"] == 1
    assert items[0]["total_questions"] == 1
    assert items[0]["duration_seconds"] >= 0


def test_history_counts_wrong_answers_in_the_total_only(client, student, created_quiz, answerable_question):
    attempt_id = start_attempt(client, student, created_quiz["id"])
    answer(client, student, attempt_id, answerable_question, 1)
    complete(client, student, attempt_id)

    item = history(client, student)[0]

    assert item["score"] == 0
    assert item["total_questions"] == 1


def test_history_skips_unfinished_attempts(client, student, created_quiz, answerable_question):
    attempt_id = start_attempt(client, student, created_quiz["id"])
    answer(client, student, attempt_id, answerable_question, 0)

    assert history(client, student) == []


def test_history_keeps_every_attempt_newest_first(client, student, created_quiz, answerable_question):
    first = start_attempt(client, student, created_quiz["id"])
    answer(client, student, first, answerable_question, 1)
    complete(client, student, first)
    second = start_attempt(client, student, created_quiz["id"])
    answer(client, student, second, answerable_question, 0)
    complete(client, student, second)

    assert [item["id"] for item in history(client, student)] == [second, first]


def test_history_only_shows_own_attempts(client, student, created_quiz):
    attempt_id = start_attempt(client, student, created_quiz["id"])
    complete(client, student, attempt_id)
    other = make_student(client, "other")

    assert history(client, other) == []


def test_question_topic_can_be_set_and_changed(client, created_quiz):
    created = client.post(
        f"/quizzes/{created_quiz['id']}/questions",
        json={"question_text": "Kysymys", "topic": "Lateraalimerkit"},
    )
    assert created.json()["topic"] == "Lateraalimerkit"

    updated = client.put(
        f"/quiz-questions/{created.json()['id']}",
        json={"topic": "Kardinaalimerkit"},
    )
    assert updated.json()["topic"] == "Kardinaalimerkit"


def test_profile_details_can_be_saved(anon_client):
    alice = make_student(anon_client, "alice")

    response = anon_client.put(
        f"/users/{alice['id']}",
        json={
            "first_name": "Alice",
            "last_name": "Virtanen",
            "email": "alice@example.com",
            "avatar_icon": "graduation-cap",
        },
        headers=alice["headers"],
    )

    assert response.status_code == 200
    assert response.json()["first_name"] == "Alice"
    assert response.json()["last_name"] == "Virtanen"
    assert response.json()["email"] == "alice@example.com"
    assert response.json()["avatar_icon"] == "graduation-cap"


def test_profile_details_left_out_are_kept(anon_client):
    alice = make_student(anon_client, "alice")
    anon_client.put(
        f"/users/{alice['id']}",
        json={"first_name": "Alice", "email": "alice@example.com"},
        headers=alice["headers"],
    )

    response = anon_client.put(
        f"/users/{alice['id']}",
        json={"first_name": "Alicia"},
        headers=alice["headers"],
    )

    assert response.json()["first_name"] == "Alicia"
    assert response.json()["email"] == "alice@example.com"


def test_unknown_avatar_icon_is_rejected(anon_client):
    alice = make_student(anon_client, "alice")

    response = anon_client.put(
        f"/users/{alice['id']}",
        json={"avatar_icon": "skull"},
        headers=alice["headers"],
    )

    assert response.status_code == 422


def test_personal_details_stay_private(anon_client):
    alice = make_student(anon_client, "alice")
    anon_client.put(
        f"/users/{alice['id']}",
        json={"email": "alice@example.com"},
        headers=alice["headers"],
    )
    bob = make_student(anon_client, "bob")

    listed = anon_client.get("/users", headers=bob["headers"])
    fetched = anon_client.get(f"/users/{alice['id']}", headers=bob["headers"])

    assert listed.status_code == 200
    assert "alice@example.com" not in listed.text
    assert all("email" not in user for user in listed.json())
    assert fetched.status_code == 403
