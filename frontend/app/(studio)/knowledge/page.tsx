'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'
import { fetchKnowledgeBases } from '@/lib/kb-api'

export default function KnowledgeBasesPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const { data: kbs = [], isLoading, error } = useQuery({
    queryKey: ['knowledge-bases', searchQuery],
    queryFn: () => fetchKnowledgeBases(searchQuery),
  })

  return (
    <div className="flex flex-col h-screen bg-bg">
      {/* Header */}
      <div className="border-b border-border bg-surface px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-600 text-text">Knowledge bases</h1>
            <p className="text-text-3 mt-1">Organize documents for agent grounding</p>
          </div>
          <Link
            href="/knowledge/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-button bg-accent text-white font-500 hover:opacity-90"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New knowledge base
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search knowledge bases..."
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
              <p className="text-text-3">Loading knowledge bases...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-error mb-2">Failed to load knowledge bases</p>
              <p className="text-text-3 text-sm">{error.message}</p>
            </div>
          </div>
        ) : kbs.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-text-3 mb-4">No knowledge bases yet</p>
              <Link href="/knowledge/new" className="text-accent hover:underline text-sm">
                Create your first knowledge base
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {kbs.map((kb) => (
              <Link
                key={kb.id}
                href={`/knowledge/${kb.id}`}
                className="p-4 rounded-button border border-border bg-surface hover:bg-panel transition-colors"
              >
                <h3 className="font-600 text-text">{kb.name}</h3>
                {kb.description && <p className="text-text-3 text-sm mt-1">{kb.description}</p>}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <span className="text-xs text-text-3">
                    {kb.document_count} {kb.document_count === 1 ? 'file' : 'files'}
                  </span>
                  <span className="text-xs text-text-3">
                    {new Date(kb.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
