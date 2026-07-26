"""Tests for GET /api/v1/search.

See tests/rag_fixtures.py for why retrieval is faked instead of hitting a
real pgvector query in this test suite.
"""
import uuid

import pytest
from app.core.security import get_password_hash
from app.models.user import User

from tests.rag_fixtures import (
    captured_search_calls,
    fake_semantic_search,
    register_and_login,
)


@pytest.fixture(autouse=True)
def _patch_retrieval(monkeypatch):
    captured_search_calls.clear()
    monkeypatch.setattr("app.routers.search.semantic_search", fake_semantic_search)


@pytest.mark.asyncio
async def test_search_matching_query_returns_ranked_results(client):
    token = register_and_login(client, "search1@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/search", params={"q": "leave policy"}, headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["query"] == "leave policy"
    assert len(data["results"]) == 1
    result = data["results"][0]
    assert result["document_title"] == "Employee_Handbook.pdf"
    assert result["document_id"] == "doc-public-1"
    assert 0 < result["score"] <= 1

    # allowed_roles must be derived from the authenticated user, not omitted/None
    assert captured_search_calls[-1]["allowed_roles"] == ["employee"]


@pytest.mark.asyncio
async def test_search_no_match_returns_empty_results(client):
    token = register_and_login(client, "search2@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get(
        "/api/v1/search", params={"q": "quantum toaster repair manual"}, headers=headers
    )

    assert response.status_code == 200
    assert response.json()["results"] == []


@pytest.mark.asyncio
async def test_search_unauthenticated_returns_401(client):
    response = client.get("/api/v1/search", params={"q": "leave policy"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_search_blocks_restricted_document_for_unauthorized_role(client):
    """An employee searching for HR-restricted content must get no results."""
    token = register_and_login(client, "search3@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get(
        "/api/v1/search", params={"q": "HR salary bands"}, headers=headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["results"] == []
    assert captured_search_calls[-1]["allowed_roles"] == ["employee"]


@pytest.mark.asyncio
async def test_search_allows_restricted_document_for_authorized_role(client, db_session):
    """The same query, run by an hr-role user, must surface the restricted doc."""
    hr_user = User(
        id=str(uuid.uuid4()),
        email="hrsearch@example.com",
        full_name="HR User",
        hashed_password=get_password_hash("securepassword"),
        is_active=True,
        is_superuser=False,
        role="hr",
        token_version=0,
    )
    db_session.add(hr_user)
    await db_session.commit()

    login_resp = client.post(
        "/api/v1/auth/login",
        data={"username": "hrsearch@example.com", "password": "securepassword"},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get(
        "/api/v1/search", params={"q": "HR salary bands"}, headers=headers
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) == 1
    assert data["results"][0]["document_title"] == "HR_Salary_Bands.pdf"
    assert captured_search_calls[-1]["allowed_roles"] == ["hr"]


@pytest.mark.asyncio
async def test_search_top_k_out_of_range_returns_422(client):
    token = register_and_login(client, "search4@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get(
        "/api/v1/search", params={"q": "leave policy", "top_k": 100}, headers=headers
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_search_missing_query_returns_422(client):
    token = register_and_login(client, "search5@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/search", headers=headers)
    assert response.status_code == 422
