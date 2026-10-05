'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { fetchAgents } from '@/lib/api'

const AGENT_TYPES = [
  'Standard alignment',
  'Content tagging',
  'Skill extraction',
  'Skill gap analysis',
  'Content creation',
  'Curriculum creation',
  'Micro-course creation',
  'Custom',
]

const STATUSES = ['active', 'draft', 'paused']

export default function AgentsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  const { data: agents = [], isLoading, error } = useQuery({
    queryKey: ['agents', searchQuery, selectedStatus, selectedType],
    queryFn: () => fetchAgents(searchQuery, selectedStatus || undefined, selectedType || undefined),
  })

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: agents.length }
    STATUSES.forEach((status) => {
      counts[status] = agents.filter((a) => a.status === status).length
    })
    return counts
  }, [agents])

  return (
    <div className="flex flex-col h-screen bg-bg">
      {/* Header */}
      <div className="border-b border-border bg-surface px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-600 text-text">Agents</h1>
            <p className="text-text-3 mt-1">Build and manage your AI agents</p>
          </div>
          <Link
            href="/agents/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-button bg-accent text-white font-500 hover:opacity-90"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New agent
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar filters */}
        <aside className="w-56 flex-shrink-0 border-r border-border bg-sidebar p-6 overflow-y-auto">
          {/* Search */}
          <div className="mb-6">
            <label className="block text-sm font-500 text-text mb-2">Search</label>
            <input
              type="text"
              placeholder="Name, type, handle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 rounded-input border border-border bg-surface text-text placeholder-text-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Status filter */}
          <div className="mb-8">
            <h3 className="text-sm font-600 text-text mb-3">Status</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedStatus('')}
                className={`w-full text-left px-3 py-2 rounded-button text-sm font-500 ${
                  selectedStatus === ''
                    ? 'bg-surface border border-border text-text'
                    : 'text-text-3 hover:bg-surface'
                }`}
              >
                <span>All</span>
                <span className="ml-2 text-text-3">({statusCounts['All']})</span>
              </button>
              {STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`w-full text-left px-3 py-2 rounded-button text-sm font-500 capitalize ${
                    selectedStatus === status
                      ? 'bg-surface border border-border text-text'
                      : 'text-text-3 hover:bg-surface'
                  }`}
                >
                  <span className="capitalize">{status}</span>
                  <span className="ml-2 text-text-3">({statusCounts[status]})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Type filter */}
          <div>
            <h3 className="text-sm font-600 text-text mb-3">Type</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedType('')}
                className={`w-full text-left px-3 py-2 rounded-button text-sm font-500 ${
                  selectedType === ''
                    ? 'bg-surface border border-border text-text'
                    : 'text-text-3 hover:bg-surface'
                }`}
              >
                All types
              </button>
              {AGENT_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`w-full text-left px-3 py-2 rounded-button text-sm font-500 ${
                    selectedType === type
                      ? 'bg-surface border border-border text-text'
                      : 'text-text-3 hover:bg-surface'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Agents list */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 rounded-full border-2 border-border border-t-accent animate-spin mx-auto mb-2" />
                <p className="text-text-3">Loading agents...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-error mb-2">Failed to load agents</p>
                <p className="text-text-3 text-sm">{error.message}</p>
              </div>
            </div>
          ) : agents.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-text-3">No agents found</p>
                {searchQuery || selectedType || selectedStatus ? (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedType('')
                      setSelectedStatus('')
                    }}
                    className="text-accent hover:underline text-sm mt-2"
                  >
                    Clear filters
                  </button>
                ) : (
                  <Link href="/agents/new" className="text-accent hover:underline text-sm mt-2 inline-block">
                    Create your first agent
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {agents.map((agent) => (
                <Link
                  key={agent.id}
                  href={`/agents/${agent.id}`}
                  className="block px-8 py-4 hover:bg-surface transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base font-600 text-text truncate">{agent.name}</h2>
                      <p className="text-text-3 text-sm mt-1">{agent.description}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="inline-block px-2.5 py-1 rounded-badge bg-panel text-text-2 text-xs font-500">
                          {agent.type}
                        </span>
                        <span
                          className={`inline-block px-2.5 py-1 rounded-badge text-xs font-500 ${
                            agent.status === 'active'
                              ? 'bg-success-light text-success'
                              : agent.status === 'draft'
                                ? 'bg-warning-light text-warning'
                                : 'bg-secondary-light text-secondary'
                          }`}
                        >
                          {agent.status}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0 text-right">
                      <p className="text-text-3 text-xs">v{agent.version}</p>
                      <p className="text-text-3 text-xs">
                        {new Date(agent.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
