import pytest
from app.workflows.analytics import analytics_engine
from app.workflows.circuit_breaker import CircuitState, circuit_breaker_registry
from app.workflows.dag import DAGCycleError, DAGGraph, DAGNode
from app.workflows.resilience import CircuitBreakerOpenError, RetryPolicy
from app.workflows.sub_workflow import CircularSubWorkflowError, sub_workflow_engine


def test_dag_execution_levels_and_validation():
    nodes = [
        DAGNode(step_id="step_a", dependencies=[]),
        DAGNode(step_id="step_b", dependencies=["step_a"]),
        DAGNode(step_id="step_c", dependencies=["step_a"]),
        DAGNode(step_id="step_d", dependencies=["step_b", "step_c"]),
    ]
    graph = DAGGraph(nodes)
    levels = graph.get_execution_levels()

    assert len(levels) == 3
    assert levels[0] == ["step_a"]
    assert set(levels[1]) == {"step_b", "step_c"}
    assert levels[2] == ["step_d"]


def test_dag_cycle_detection():
    cyclic_nodes = [
        DAGNode(step_id="step_a", dependencies=["step_b"]),
        DAGNode(step_id="step_b", dependencies=["step_a"]),
    ]
    with pytest.raises(DAGCycleError):
        DAGGraph(cyclic_nodes)


def test_retry_policy_exponential_backoff():
    policy = RetryPolicy(max_retries=3, initial_delay=0.1, backoff_factor=2.0)
    assert policy.calculate_delay(1) == 0.1
    assert policy.calculate_delay(2) == 0.2
    assert policy.calculate_delay(3) == 0.4


def test_circuit_breaker_tripping_and_recovery():
    cb = circuit_breaker_registry.get_breaker("TestProvider")
    cb.state = CircuitState.CLOSED
    cb.failure_count = 0

    cb.record_failure()
    cb.record_failure()
    assert cb.state == CircuitState.CLOSED

    cb.record_failure()  # 3rd failure trips threshold
    assert cb.state == CircuitState.OPEN

    with pytest.raises(CircuitBreakerOpenError):
        cb.before_call()

    cb.record_success()
    assert cb.state == CircuitState.CLOSED


def test_circular_sub_workflow_prevention():
    with pytest.raises(CircularSubWorkflowError):
        sub_workflow_engine.expand_sub_workflow(
            sub_workflow_id="daily_brief",
            parameters={},
            call_stack=["daily_brief"],
        )


def test_analytics_metrics_computation():
    metrics = analytics_engine.compute_metrics()
    assert metrics is not None
    assert isinstance(metrics.success_rate, float)
