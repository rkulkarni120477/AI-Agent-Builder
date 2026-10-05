const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

export interface Workspace {
  id: string
  title: string
  content: string
  version: number
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface WorkspaceListItem {
  id: string
  title: string
  version: number
  created_at: string
  updated_at: string
}

export async function fetchWorkspaces(q?: string): Promise<WorkspaceListItem[]> {
  const params = new URLSearchParams()
  if (q) params.append("q", q)

  const res = await fetch(`${API_URL}/workspaces?${params}`)
  if (!res.ok) throw new Error("Failed to fetch workspaces")
  return res.json()
}

export async function fetchWorkspace(id: string): Promise<Workspace> {
  const res = await fetch(`${API_URL}/workspaces/${id}`)
  if (!res.ok) throw new Error("Failed to fetch workspace")
  return res.json()
}

export async function createWorkspace(data: { title: string }): Promise<Workspace> {
  const res = await fetch(`${API_URL}/workspaces`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.detail || "Failed to create workspace")
  }
  return res.json()
}

export async function updateWorkspace(
  id: string,
  data: Partial<{ title: string; content: string }>
): Promise<Workspace> {
  const res = await fetch(`${API_URL}/workspaces/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.detail || "Failed to update workspace")
  }
  return res.json()
}

export async function updateWorkspaceContent(id: string, content: string): Promise<Workspace> {
  const res = await fetch(`${API_URL}/workspaces/${id}/content`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.detail || "Failed to save workspace")
  }
  return res.json()
}

export async function deleteWorkspace(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/workspaces/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Failed to delete workspace")
}
