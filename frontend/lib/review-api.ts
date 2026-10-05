const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

export interface Review {
  id: string
  run_id: string
  workspace_id: string
  status: string
  reviewer_notes?: string
  inserted_at?: string
  created_at: string
  updated_at: string
}

export interface InsertResultRequest {
  run_id: string
  workspace_id: string
  format_type?: "paragraph" | "code" | "formatted"
  position?: string
  insert_separator?: boolean
}

export interface InsertResultResponse {
  workspace_id: string
  run_id: string
  block_count: number
  preview: string
}

export async function insertResult(
  request: InsertResultRequest
): Promise<InsertResultResponse> {
  const res = await fetch(`${API_URL}/review/insert-result`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.detail || "Failed to insert result")
  }
  return res.json()
}

export async function createReview(
  run_id: string,
  workspace_id: string,
  status: "approved" | "rejected",
  notes?: string
): Promise<Review> {
  const res = await fetch(`${API_URL}/review/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      run_id,
      workspace_id,
      status,
      notes,
    }),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.detail || "Failed to create review")
  }
  return res.json()
}

export async function fetchWorkspaceReviews(workspace_id: string): Promise<Review[]> {
  const res = await fetch(`${API_URL}/review/reviews/${workspace_id}`)
  if (!res.ok) throw new Error("Failed to fetch reviews")
  return res.json()
}

export async function copyToClipboard(run_id: string, workspace_id: string): Promise<void> {
  await fetch(`${API_URL}/review/copy-to-clipboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ run_id, workspace_id }),
  })
}
