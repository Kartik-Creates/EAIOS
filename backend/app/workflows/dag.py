from typing import Any, Dict, List, Optional, Set
from pydantic import BaseModel, Field


class DAGCycleError(Exception):
    """Raised when a cycle is detected in the Workflow Execution Graph."""
    pass


class DAGNode(BaseModel):
    step_id: str
    dependencies: List[str] = Field(default_factory=list)
    condition: Optional[str] = None  # Optional condition evaluation rule

    class Config:
        frozen = True


class DAGGraph:
    """
    Directed Acyclic Graph (DAG) for Workflow Step Orchestration.
    Validates graph structure, prevents cycles, and resolves parallel execution levels.
    """

    def __init__(self, nodes: List[DAGNode]) -> None:
        self.nodes = {n.step_id: n for n in nodes}
        self.validate_graph()

    def validate_graph(self) -> None:
        """Validate dependencies and check for cyclic dependencies."""
        for step_id, node in self.nodes.items():
            for dep in node.dependencies:
                if dep not in self.nodes:
                    raise ValueError(f"Dependency '{dep}' referenced by step '{step_id}' does not exist.")

        # Cycle detection using Kahn's algorithm
        in_degree = {n: 0 for n in self.nodes}
        adj_list = {n: [] for n in self.nodes}

        for step_id, node in self.nodes.items():
            for dep in node.dependencies:
                adj_list[dep].append(step_id)
                in_degree[step_id] += 1

        queue = [n for n in in_degree if in_degree[n] == 0]
        visited_count = 0

        while queue:
            curr = queue.pop(0)
            visited_count += 1
            for neighbor in adj_list[curr]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        if visited_count != len(self.nodes):
            raise DAGCycleError("Cyclic dependency detected in workflow execution graph!")

    def get_execution_levels(self) -> List[List[str]]:
        """
        Group step IDs into parallel execution levels.
        Steps at the same level can be executed simultaneously in parallel.
        """
        in_degree = {n: 0 for n in self.nodes}
        adj_list = {n: [] for n in self.nodes}

        for step_id, node in self.nodes.items():
            for dep in node.dependencies:
                adj_list[dep].append(step_id)
                in_degree[step_id] += 1

        levels: List[List[str]] = []
        current_level = [n for n in in_degree if in_degree[n] == 0]

        while current_level:
            levels.append(current_level)
            next_level = []
            for curr in current_level:
                for neighbor in adj_list[curr]:
                    in_degree[neighbor] -= 1
                    if in_degree[neighbor] == 0:
                        next_level.append(neighbor)
            current_level = next_level

        return levels
