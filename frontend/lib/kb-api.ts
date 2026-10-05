const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

export interface KnowledgeBase {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  document_count: number
}

export interface File {
  id: string
  kb_id: string
  filename: string
  mime: string
  size_bytes: number
  sha256: string
  storage_path: string
  status: string
  error?: string
  chunk_count: number
  tags_csv?: string
  created_at: string
  updated_at: string
}

export interface DocumentSearchResult {
  content: string
  score: number
  source: string
  filename: string
}

export async function fetchKnowledgeBases(q?: string): Promise<KnowledgeBase[]> {
  const params = new URLSearchParams()
  if (q) params.append("q", q)

  const res = await fetch(`${API_URL}/knowledge-bases?${params}`)
  if (!res.ok) throw new Error("Failed to fetch knowledge bases")
  return res.json()
}

export async function fetchKnowledgeBase(id: string): Promise<KnowledgeBase> {
  const res = await fetch(`${API_URL}/knowledge-bases/${id}`)
  if (!res.ok) throw new Error("Failed to fetch knowledge base")
  return res.json()
}

export async function createKnowledgeBase(data: {
  name: string
  description?: string
}): Promise<KnowledgeBase> {
  const res = await fetch(`${API_URL}/knowledge-bases`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.detail || "Failed to create knowledge base")
  }
  return res.json()
}

export async function updateKnowledgeBase(
  id: string,
  data: Partial<{ name: string; description: string }>
): Promise<KnowledgeBase> {
  const res = await fetch(`${API_URL}/knowledge-bases/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.detail || "Failed to update knowledge base")
  }
  return res.json()
}

export async function deleteKnowledgeBase(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/knowledge-bases/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Failed to delete knowledge base")
}

export async function fetchFiles(kb_id: string): Promise<File[]> {
  const res = await fetch(`${API_URL}/knowledge-bases/${kb_id}/files`)
  if (!res.ok) throw new Error("Failed to fetch files")
  return res.json()
}

export async function uploadFile(kb_id: string, file: globalThis.File): Promise<File> {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(`${API_URL}/knowledge-bases/${kb_id}/files`, {
    method: "POST",
    body: formData,
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.detail || "Failed to upload file")
  }
  return res.json()
}

export async function deleteFile(kb_id: string, file_id: string): Promise<void> {
  const res = await fetch(`${API_URL}/knowledge-bases/${kb_id}/files/${file_id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Failed to delete file")
}

export async function searchDocuments(
  kb_id: string,
  query: string,
  k?: number
): Promise<DocumentSearchResult[]> {
  const res = await fetch(`${API_URL}/knowledge-bases/${kb_id}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, k: k || 6 }),
  })
  if (!res.ok) throw new Error("Failed to search documents")
  const data = await res.json()
  return data.results
}
