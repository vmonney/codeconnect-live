def test_create_interview(client, auth_headers):
    """Test creating an interview"""
    response = client.post(
        "/api/interviews",
        json={
            "title": "Python Developer Interview",
            "description": "Technical screening",
            "language": "python"
        },
        headers=auth_headers
    )

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Python Developer Interview"
    assert data["language"] == "python"
    assert "id" in data

def test_list_interviews(client, auth_headers):
    """Test listing interviews"""
    # Create interview
    client.post(
        "/api/interviews",
        json={"title": "Test Interview", "language": "python"},
        headers=auth_headers
    )

    # List interviews
    response = client.get("/api/interviews", headers=auth_headers)

    assert response.status_code == 200
    assert len(response.json()) >= 1
