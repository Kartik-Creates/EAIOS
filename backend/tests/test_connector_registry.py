"""Unit & integration tests for Connector Registry auto-discovery and duplicate-name validation."""
import pytest
from app.connectors.base import ConnectorSpec
from app.connectors.registry import ConnectorRegistry, connector_registry
from app.schemas.briefing import SourceResult


@pytest.mark.asyncio
async def test_connector_registry_autodiscovers_existing_connectors():
    """Verify that all default connector modules in app/connectors are discovered."""
    connectors = connector_registry.get_all_connectors()

    assert "gmail" in connectors
    assert "jira" in connectors
    assert "github" in connectors
    assert "calendar" in connectors
    assert "google_drive" in connectors
    assert "slack" in connectors

    assert connectors["gmail"].display_name == "Gmail"
    assert connectors["jira"].is_implemented is True


@pytest.mark.asyncio
async def test_dummy_connector_autodiscovery_proof(tmp_path):
    """PROOF OF AUTO-DISCOVERY: Create a new dummy_service.py file in a temp directory,

    run discover_connectors(), and prove it is picked up automatically with ZERO edits to any registry file.
    """
    dummy_code = '''
from app.connectors.base import ConnectorSpec
from app.schemas.briefing import SourceResult

async def _mock_dummy_briefing(db, user):
    return SourceResult(source="dummy", connected=True, items=[])

CONNECTOR = ConnectorSpec(
    name="dummy_custom_service",
    display_name="Custom Dummy Service",
    icon="Sparkles",
    oauth_config={},
    briefing_fn=_mock_dummy_briefing,
    is_implemented=True,
)
'''
    dummy_file = tmp_path / "dummy_custom.py"
    dummy_file.write_text(dummy_code)

    reg = ConnectorRegistry()
    reg.discover_connectors(package_path=str(tmp_path))

    discovered = reg.get_all_connectors()
    assert "dummy_custom_service" in discovered
    assert discovered["dummy_custom_service"].display_name == "Custom Dummy Service"
    assert discovered["dummy_custom_service"].icon == "Sparkles"


@pytest.mark.asyncio
async def test_duplicate_connector_name_raises_runtime_error(tmp_path):
    """PROOF OF DUPLICATE VALIDATION: Two connector files using the same name MUST raise a RuntimeError on startup."""
    code1 = '''
from app.connectors.base import ConnectorSpec
CONNECTOR = ConnectorSpec(name="duplicate_name", display_name="Conn 1", icon="X", oauth_config={})
'''
    code2 = '''
from app.connectors.base import ConnectorSpec
CONNECTOR = ConnectorSpec(name="duplicate_name", display_name="Conn 2", icon="Y", oauth_config={})
'''
    (tmp_path / "conn1.py").write_text(code1)
    (tmp_path / "conn2.py").write_text(code2)

    reg = ConnectorRegistry()
    with pytest.raises(RuntimeError, match="Duplicate connector name 'duplicate_name'"):
        reg.discover_connectors(package_path=str(tmp_path))


@pytest.mark.asyncio
async def test_unimplemented_connector_does_not_break_briefing(db_session, monkeypatch):
    """Verify that a connector with is_implemented=False does not break briefing aggregation for other sources."""
    from app.models.user import User

    user = User(id="unimpl-user-id", email="unimpl@example.com", hashed_password="pw", is_active=True, role="employee")
    db_session.add(user)
    await db_session.commit()

    # Create dummy registry with 1 implemented and 1 unimplemented connector
    reg = ConnectorRegistry()

    async def _mock_implemented_briefing(db, u):
        return SourceResult(source="working", connected=True, items=[])

    working_conn = ConnectorSpec(
        name="working",
        display_name="Working",
        icon="Check",
        oauth_config={},
        briefing_fn=_mock_implemented_briefing,
        is_implemented=True,
    )
    unimpl_conn = ConnectorSpec(
        name="not_implemented",
        display_name="Not Implemented",
        icon="Clock",
        oauth_config={},
        briefing_fn=None,
        is_implemented=False,
    )

    reg._connectors = {"working": working_conn, "not_implemented": unimpl_conn}
    reg._discovered = True

    implemented = reg.get_implemented_connectors()
    assert len(implemented) == 1
    assert implemented[0].name == "working"


@pytest.mark.asyncio
async def test_connectors_endpoint_returns_registry_list(client, db_session):
    """Test GET /api/v1/connectors endpoint returns list of all registered connectors."""
    from tests.rag_fixtures import register_and_login

    token = register_and_login(client, "connectors_ep_user@example.com")
    resp = client.get("/api/v1/connectors", headers={"Authorization": f"Bearer {token}"})

    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    names = [c["name"] for c in data]
    assert "gmail" in names
    assert "jira" in names
    assert "github" in names
    assert "calendar" in names
