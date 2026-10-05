const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

export interface Run {
  id: string
  workspace_id: string
  agent_id: string
  status: string
  input_text: string
  output_text?: string
  error?: string
  tokens_used: number
  created_at: string
  updated_at: string
  messages: Message[]
}

export interface Message {
  id: string
  role: string
  content: string
  created_at: string
}

export async function invokeAgent(
  agent_id: string,
  workspace_id: string,
  input_text: string,
  knowledge_base_ids?: string[]
): Promise<AsyncIterable<string>> {
  const response = await fetch(`${API_URL}/chat/invoke`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agent_id,
      workspace_id,
      input_text,
      knowledge_base_ids,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to invoke agent: ${response.statusText}`)
  }

  if (!response.body) {
    throw new Error("No response body")
  }

  // Return async iterable of streamed chunks
  return {
    async *[Symbol.asyncIterator]() {
      const reader = response.body!.getReader()
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              yield line.slice(6)
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    },
  }
}

export async function fetchRuns(
  workspace_id: string,
  agent_id?: string
): Promise<Run[]> {
  const params = new URLSearchParams()
  if (agent_id) params.append("agent_id", agent_id)

  const res = await fetch(`${API_URL}/chat/runs/${workspace_id}?${params}`)
  if (!res.ok) throw new Error("Failed to fetch runs")
  return res.json()
}

export async function fetchRun(workspace_id: string, run_id: string): Promise<Run> {
  const res = await fetch(`${API_URL}/chat/runs/${workspace_id}/${run_id}`)
  if (!res.ok) throw new Error("Failed to fetch run")
  return res.json()
}
