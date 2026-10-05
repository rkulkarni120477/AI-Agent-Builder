'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createWorkspace } from '@/lib/workspace-api'

export default function NewWorkspacePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      return createWorkspace({ title })
    },
    onSuccess: (workspace) => {
      router.push(`/workspace/${workspace.id}`)
    },
    onError: (err) => {
      setError(err.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    mutation.mutate()
  }

  return (
    <div className="flex flex-col h-screen bg-bg">
      <div className="border-b border-border bg-surface px-8 py-4">
        <h1 className="text-xl font-600 text-text">Create document</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-2xl space-y-6">
            <div>
              <label className="block text-sm font-500 text-text mb-2">Document title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Meeting Notes - Oct 2026"
                className="w-full px-3 py-2 rounded-input border border-border bg-surface text-text placeholder-text-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-border bg-surface px-8 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 rounded-button border border-border bg-surface text-text font-500 hover:bg-panel"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            {error && <p className="text-error text-sm">{error}</p>}
            <button
              type="submit"
              disabled={mutation.isPending || !title.trim()}
              className="px-4 py-2 rounded-button bg-accent text-white font-500 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            >
              {mutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
