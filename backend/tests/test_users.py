def test_create_user(client):
    response = client.post(
        "/users",
        json={
            "username": "alice",
            "password": "secret123",
            "role": "user",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["username"] == "alice"
    assert data["role"] == "user"
    assert "id" in data
    assert "password" not in data
    assert "password_hash" not in data


def test_create_user_saves_personal_details(client):
    response = client.post(
        "/users",
        json={
            "username": "alice",
            "password": "secret123",
            "first_name": "Alice",
            "last_name": "Virtanen",
            "email": "alice@example.com",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["first_name"] == "Alice"
    assert data["last_name"] == "Virtanen"
    assert data["email"] == "alice@example.com"


def test_create_user_rejects_at_sign_in_username(client):
    response = client.post(
        "/users",
        json={"username": "alice@example.com", "password": "secret123"},
    )

    assert response.status_code == 422


def test_create_user_with_taken_email_returns_conflict(client):
    client.post(
        "/users",
        json={"username": "alice", "password": "secret123", "email": "same@example.com"},
    )

    response = client.post(
        "/users",
        json={"username": "bob", "password": "secret123", "email": "SAME@example.com"},
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Email already exists"


def test_update_user_with_taken_email_returns_conflict(client):
    client.post(
        "/users",
        json={"username": "alice", "password": "secret123", "email": "alice@example.com"},
    )
    bob = client.post(
        "/users",
        json={"username": "bob", "password": "secret123"},
    ).json()

    response = client.put(f"/users/{bob['id']}", json={"email": "Alice@example.com"})

    assert response.status_code == 409
    assert response.json()["detail"] == "Email already exists"


def test_create_user_uses_user_role_by_default(client):
    response = client.post(
        "/users",
        json={
            "username": "alice",
            "password": "secret123",
        },
    )

    assert response.status_code == 201
    assert response.json()["role"] == "user"


def test_create_duplicate_user_returns_conflict(client):
    payload = {
        "username": "alice",
        "password": "secret123",
    }

    first_response = client.post("/users", json=payload)
    second_response = client.post("/users", json=payload)

    assert first_response.status_code == 201
    assert second_response.status_code == 409
    assert second_response.json()["detail"] == "Username already exists"


def test_list_users_returns_users_sorted_by_username(client):
    client.post(
        "/users",
        json={"username": "zeta", "password": "secret123"},
    )
    client.post(
        "/users",
        json={"username": "alpha", "password": "secret123"},
    )

    response = client.get("/users")

    assert response.status_code == 200

    usernames = [user["username"] for user in response.json()]
    assert usernames == ["alpha", "zeta"]


def test_get_user(client):
    create_response = client.post(
        "/users",
        json={"username": "alice", "password": "secret123"},
    )

    assert create_response.status_code == 201
    user_id = create_response.json()["id"]
    response = client.get(f"/users/{user_id}")

    assert response.status_code == 200
    assert response.json()["username"] == "alice"


def test_get_missing_user_returns_not_found(client):
    response = client.get(
        "/users/00000000-0000-0000-0000-000000000000"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"


def test_update_user(client):
    create_response = client.post(
        "/users",
        json={"username": "alice", "password": "old-password"},
    )

    user_id = create_response.json()["id"]

    response = client.put(
        f"/users/{user_id}",
        json={
            "username": "alice-updated",
            "role": "admin",
        },
    )

    assert response.status_code == 200
    assert response.json()["username"] == "alice-updated"
    assert response.json()["role"] == "admin"


def _login_status(client, username, password):
    response = client.post(
        "/auth/login",
        json={"username": username, "password": password},
    )
    return response.status_code


def test_update_user_cannot_change_password(client):
    user_id = client.post(
        "/users",
        json={"username": "alice", "password": "old-password"},
    ).json()["id"]

    response = client.put(f"/users/{user_id}", json={"password": "new-password"})

    assert response.status_code == 200
    assert _login_status(client, "alice", "old-password") == 200
    assert _login_status(client, "alice", "new-password") == 401


def test_change_password(client):
    user_id = client.post(
        "/users",
        json={"username": "alice", "password": "old-password"},
    ).json()["id"]

    response = client.post(
        f"/users/{user_id}/password",
        json={"current_password": "old-password", "new_password": "new-password"},
    )

    assert response.status_code == 204
    assert _login_status(client, "alice", "new-password") == 200
    assert _login_status(client, "alice", "old-password") == 401


def test_change_password_rejects_wrong_current_password(client):
    user_id = client.post(
        "/users",
        json={"username": "alice", "password": "old-password"},
    ).json()["id"]

    response = client.post(
        f"/users/{user_id}/password",
        json={"current_password": "wrong", "new_password": "new-password"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Current password is incorrect"
    assert _login_status(client, "alice", "old-password") == 200


def test_change_password_rejects_empty_new_password(client):
    user_id = client.post(
        "/users",
        json={"username": "alice", "password": "old-password"},
    ).json()["id"]

    response = client.post(
        f"/users/{user_id}/password",
        json={"current_password": "old-password", "new_password": ""},
    )

    assert response.status_code == 422


def test_change_password_of_another_user_is_forbidden(anon_client):
    alice_id = anon_client.post(
        "/users",
        json={"username": "alice", "password": "alice-password"},
    ).json()["id"]
    anon_client.post(
        "/users",
        json={"username": "bob", "password": "bob-password"},
    )
    token = anon_client.post(
        "/auth/login",
        json={"username": "bob", "password": "bob-password"},
    ).json()["access_token"]

    response = anon_client.post(
        f"/users/{alice_id}/password",
        json={"current_password": "alice-password", "new_password": "hacked"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403
    assert _login_status(anon_client, "alice", "alice-password") == 200


def test_change_password_requires_login(anon_client):
    user_id = anon_client.post(
        "/users",
        json={"username": "alice", "password": "old-password"},
    ).json()["id"]

    response = anon_client.post(
        f"/users/{user_id}/password",
        json={"current_password": "old-password", "new_password": "new-password"},
    )

    assert response.status_code == 401


def test_delete_user(client):
    create_response = client.post(
        "/users",
        json={"username": "alice", "password": "secret123"},
    )

    user_id = create_response.json()["id"]

    delete_response = client.delete(f"/users/{user_id}")
    get_response = client.get(f"/users/{user_id}")

    assert delete_response.status_code == 204
    assert get_response.status_code == 404