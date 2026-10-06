const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

export interface WorkspaceStats {
  workspace_id: string
  workspace_title: string
  total_runs: number
  unique_agents_used: number
  total_tokens_used: number
  created_at: string
  updated_at: string
}

export interface AgentMetrics {
  agent_id: string
  agent_name: string
  total_runs: number
  successful_runs: number
  failed_runs: number
  success_rate: number
  avg_tokens_used: number
  total_tokens_used: number
  avg_execution_time: number
}

export interface SystemHealth {
  status: string
  timestamp: string
  metrics?: {
    total_agents: number
    total_workspaces: number
    total_runs: number
  }
  error?: string
}

export async function fetchWorkspaceStats(workspace_id: string): Promise<WorkspaceStats> {
  const res = await fetch(`${API_URL}/analytics/workspace/${workspace_id}/stats`)
  if (!res.ok) throw new Error("Failed to fetch workspace stats")
  return res.json()
}

export async function fetchWorkspaceRuns(
  workspace_id: string,
  status?: string,
  agent_id?: string,
  limit: number = 50,
  offset: number = 0
): Promise<any[]> {
  const params = new URLSearchParams()
  if (status) params.append("status", status)
  if (agent_id) params.append("agent_id", agent_id)
  params.append("limit", limit.toString())
  params.append("offset", offset.toString())

  const res = await fetch(`${API_URL}/analytics/workspace/${workspace_id}/runs?${params}`)
  if (!res.ok) throw new Error("Failed to fetch runs")
  return res.json()
}

export async function fetchAgentMetrics(agent_id: string): Promise<AgentMetrics> {
  const res = await fetch(`${API_URL}/analytics/agent/${agent_id}/metrics`)
  if (!res.ok) throw new Error("Failed to fetch agent metrics")
  return res.json()
}

export async function fetchSystemHealth(): Promise<SystemHealth> {
  const res = await fetch(`${API_URL}/analytics/system/health`)
  if (!res.ok) throw new Error("Failed to fetch system health")
  return res.json()
}

export interface WorkspaceSettings {
  id: string
  workspace_id: string
  is_shared: boolean
  share_token?: string
  allow_comments: boolean
  allow_editing: boolean
  created_at: string
  updated_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  theme: string
  notifications_enabled: boolean
  notification_email?: string
  notify_on_success: boolean
  notify_on_failure: boolean
  has_api_key: boolean
  created_at: string
  updated_at: string
}

export async function fetchWorkspaceSettings(workspace_id: string): Promise<WorkspaceSettings> {
  const res = await fetch(`${API_URL}/settings/workspace/${workspace_id}`)
  if (!res.ok) throw new Error("Failed to fetch workspace settings")
  return res.json()
}

export async function updateWorkspaceSettings(
  workspace_id: string,
  data: Partial<WorkspaceSettings>
): Promise<WorkspaceSettings> {
  const res = await fetch(`${API_URL}/settings/workspace/${workspace_id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to update workspace settings")
  return res.json()
}

export async function fetchUserSettings(user_id: string): Promise<UserSettings> {
  const res = await fetch(`${API_URL}/settings/user/${user_id}`)
  if (!res.ok) throw new Error("Failed to fetch user settings")
  return res.json()
}

export async function updateUserSettings(
  user_id: string,
  data: Partial<UserSettings>
): Promise<UserSettings> {
  const res = await fetch(`${API_URL}/settings/user/${user_id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to update user settings")
  return res.json()
}
