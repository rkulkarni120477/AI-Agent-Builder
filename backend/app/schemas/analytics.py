"""Pydantic schemas for analytics and metrics."""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class AgentMetrics(BaseModel):
    """Metrics for a single agent."""

    agent_id: str
    agent_name: str
    total_runs: int
    successful_runs: int
    failed_runs: int
    success_rate: float
    avg_tokens_used: float
    total_tokens_used: int
    avg_execution_time: float


class WorkspaceStats(BaseModel):
    """Statistics for a workspace."""

    workspace_id: str
    workspace_title: str
    total_runs: int
    unique_agents_used: int
    total_tokens_used: int
    created_at: str
    updated_at: str


class RunsFilterResponse(BaseModel):
    """Filtered runs with pagination."""

    total_count: int
    page: int
    page_size: int
    runs: list


class RunStatistics(BaseModel):
    """Statistics about runs."""

    total_runs: int
    completed_runs: int
    failed_runs: int
    success_rate: float
    avg_tokens_per_run: float
    total_tokens_used: int


class SystemHealth(BaseModel):
    """System health metrics."""

    uptime_seconds: int
    active_users: int
    total_agents: int
    total_workspaces: int
    db_connection_pool_size: int
    db_query_time_ms: float
