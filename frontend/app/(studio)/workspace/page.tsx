'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'
import { fetchWorkspaces } from '@/lib/workspace-api'

export default function WorkspacePage() {
  const [searchQuery, setSearchQuery] = useState('')

  const { data: workspaces = [], isLoading, error } = useQuery({
    queryKey: ['workspaces', searchQuery],
    queryFn: () => fetchWorkspaces(searchQuery),
  })

  return (
    <div className="flex flex-col h-screen bg-bg">
      {/* Header */}
      <div className="border-b border-border bg-surface px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-600 text-text">Workspace</h1>
            <p className="text-text-3 mt-1">Create and edit documents with AI agents</p>
          </div>
          <Link
            href="/workspace/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-button bg-accent text-white font-500 hover:opacity-90"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New document
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 rounded-input border border-border bg-surface text-text placeholder-text-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full border-2 border-border border-t-accent animate-spin mx-auto mb-2" />
              <p className="text-text-3">Loading documents...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-error mb-2">Failed to load documents</p>
              <p className="text-text-3 text-sm">{error.message}</p>
            </div>
          </div>
        ) : workspaces.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-text-3 mb-4">No documents yet</p>
              <Link href="/workspace/new" className="text-accent hover:underline text-sm">
                Create your first document
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {workspaces.map((workspace) => (
              <Link
                key={workspace.id}
                href={`/workspace/${workspace.id}`}
                className="flex items-center justify-between p-4 rounded-button border border-border bg-surface hover:bg-panel transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-600 text-text truncate">{workspace.title}</h3>
                  <p className="text-text-3 text-sm">v{workspace.version}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-text-3 text-xs">
                    {new Date(workspace.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
