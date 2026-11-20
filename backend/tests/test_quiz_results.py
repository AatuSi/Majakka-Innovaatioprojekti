# Tests for quiz results by topic (one topic = one quiz).

from uuid import UUID

import pytest

from main import app
import models
from security import get_current_user

MISSING_UUID = "00000000-0000-0000-0000-000000000000"


def add_question(client, quiz_id, position):
    """Adds a question with one correct and one wrong option."""
    response = client.post(
        f"/quizzes/{quiz_id}/questions",
        json={
            "question_text": f"Kysymys {position}",
            "position": position,
            "options": [
                {"option_text": "Oikein", "is_correct": True, "position": 1},
                {"option_text": "Vaarin", "is_correct": False, "position": 2},
            ],
        },
    )
    assert response.status_code == 201

    return response.json()


def correct_option(question):
    return next(option for option in question["options"] if option["is_correct"])


def wrong_option(question):
    return next(option for option in question["options"] if not option["is_correct"])


def save_attempt(client, user_id, quiz_id, answers):
    """answers is a list of (question, option) pairs."""
    response = client.post(
        "/quiz-attempts",
        json={
            "user_id": user_id,
            "quiz_id": quiz_id,
            "responses": [
                {"question_id": question["id"], "selected_option_id": option["id"]}
                for question, option in answers
            ],
        },
    )
    assert response.status_code == 201

    return response.json()


def create_user(client, username):
    response = client.post("/users", json={"username": username, "password": "secret123"})
    assert response.status_code == 201

    return response.json()


def create_quiz(client, name):
    response = client.post("/quizzes", json={"name": name})
    assert response.status_code == 201

    return response.json()


def login_as(user, role=models.UserRole.USER):
    """Makes the following requests run as the given user."""
    app.dependency_overrides[get_current_user] = lambda: models.User(
        id=UUID(user["id"]),
        role=role,
    )


def by_quiz(results):
    return {result["quiz_id"]: result for result in results}


def test_results_empty_without_quizzes(client):
    response = client.get("/quiz-results/by-topic")

    assert response.status_code == 200
    assert response.json() == []


def test_quiz_without_attempts_has_zero_counts(client, created_quiz):
    response = client.get("/quiz-results/by-topic")

    assert response.status_code == 200
    assert response.json() == [
        {
            "quiz_id": created_quiz["id"],
            "quiz_name": created_quiz["name"],
            "question_count": 0,
            "attempt_count": 0,
            "answer_count": 0,
            "correct_count": 0,
            "accuracy": None,
            "last_attempt_at": None,
        }
    ]


def test_results_are_counted_per_topic(client, created_user):
    iala = create_quiz(client, "IALA-tietovisa")
    colreg = create_quiz(client, "COLREG-tietovisa")
    iala_q1 = add_question(client, iala["id"], 1)
    iala_q2 = add_question(client, iala["id"], 2)
    colreg_q1 = add_question(client, colreg["id"], 1)

    # IALA: two attempts, 3 answers, 2 of them correct.
    save_attempt(
        client,
        created_user["id"],
        iala["id"],
        [(iala_q1, correct_option(iala_q1)), (iala_q2, wrong_option(iala_q2))],
    )
    last_iala = save_attempt(
        client,
        created_user["id"],
        iala["id"],
        [(iala_q1, correct_option(iala_q1))],
    )
    # COLREG: one attempt, 1 wrong answer.
    save_attempt(
        client,
        created_user["id"],
        colreg["id"],
        [(colreg_q1, wrong_option(colreg_q1))],
    )

    response = client.get("/quiz-results/by-topic")

    assert response.status_code == 200
    results = response.json()
    # Listed in the order the quizzes were created.
    assert [result["quiz_id"] for result in results] == [iala["id"], colreg["id"]]

    iala_result = by_quiz(results)[iala["id"]]
    assert iala_result["quiz_name"] == "IALA-tietovisa"
    assert iala_result["question_count"] == 2
    assert iala_result["attempt_count"] == 2
    assert iala_result["answer_count"] == 3
    assert iala_result["correct_count"] == 2
    assert iala_result["accuracy"] == pytest.approx(2 / 3)
    assert iala_result["last_attempt_at"] == last_iala["created_at"]

    colreg_result = by_quiz(results)[colreg["id"]]
    assert colreg_result["question_count"] == 1
    assert colreg_result["attempt_count"] == 1
    assert colreg_result["answer_count"] == 1
    assert colreg_result["correct_count"] == 0
    assert colreg_result["accuracy"] == 0


def test_attempt_without_answers_counts_as_attempt(client, created_attempt):
    response = client.get("/quiz-results/by-topic")

    result = by_quiz(response.json())[created_attempt["quiz_id"]]
    assert result["attempt_count"] == 1
    assert result["answer_count"] == 0
    assert result["accuracy"] is None


def test_admin_sees_all_users_or_one_user(client, created_quiz):
    question = add_question(client, created_quiz["id"], 1)
    alice = create_user(client, "alice")
    bob = create_user(client, "bob")
    save_attempt(client, alice["id"], created_quiz["id"], [(question, correct_option(question))])
    save_attempt(client, bob["id"], created_quiz["id"], [(question, wrong_option(question))])

    everyone = client.get("/quiz-results/by-topic").json()
    only_bob = client.get("/quiz-results/by-topic", params={"user_id": bob["id"]}).json()

    assert everyone[0]["attempt_count"] == 2
    assert everyone[0]["correct_count"] == 1
    assert only_bob[0]["attempt_count"] == 1
    assert only_bob[0]["correct_count"] == 0


def test_admin_asking_for_missing_user_returns_not_found(client):
    response = client.get("/quiz-results/by-topic", params={"user_id": MISSING_UUID})

    assert response.status_code == 404


def test_regular_user_sees_only_own_results(client, created_quiz):
    question = add_question(client, created_quiz["id"], 1)
    alice = create_user(client, "alice")
    bob = create_user(client, "bob")
    save_attempt(client, alice["id"], created_quiz["id"], [(question, correct_option(question))])
    save_attempt(client, bob["id"], created_quiz["id"], [(question, wrong_option(question))])

    login_as(alice)
    response = client.get("/quiz-results/by-topic")

    assert response.status_code == 200
    result = response.json()[0]
    assert result["attempt_count"] == 1
    assert result["correct_count"] == 1
    assert result["accuracy"] == 1


def test_regular_user_can_name_themselves(client, created_quiz):
    alice = create_user(client, "alice")

    login_as(alice)
    response = client.get("/quiz-results/by-topic", params={"user_id": alice["id"]})

    assert response.status_code == 200


def test_regular_user_cannot_see_others_results(client):
    alice = create_user(client, "alice")
    bob = create_user(client, "bob")

    login_as(alice)
    response = client.get("/quiz-results/by-topic", params={"user_id": bob["id"]})

    assert response.status_code == 403


def test_results_invalid_user_id(client):
    response = client.get("/quiz-results/by-topic", params={"user_id": "not-a-valid-uuid"})

    assert response.status_code == 422
