'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'
import { fetchAgents } from '@/lib/api'

const statusStyles: Record<string, { backgroundColor: string; color: string; dotColor: string }> = {
  active: {
    backgroundColor: 'var(--status-active-bg)',
    color: 'var(--status-active-text)',
    dotColor: 'var(--status-active-dot)',
  },
  draft: {
    backgroundColor: 'var(--status-draft-bg)',
    color: 'var(--status-draft-text)',
    dotColor: 'var(--status-draft-dot)',
  },
  paused: {
    backgroundColor: 'var(--status-paused-bg)',
    color: 'var(--status-paused-text)',
    dotColor: 'var(--status-paused-dot)',
  },
}

const getStatusStyle = (status: string) =>
  statusStyles[status.toLowerCase()] ?? {
    backgroundColor: 'var(--secondary-light)',
    color: 'var(--secondary)',
    dotColor: 'var(--secondary)',
  }

export default function AgentsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('All')

  const { data: agents = [], isLoading, error } = useQuery({
    queryKey: ['agents', searchQuery, selectedStatus],
    queryFn: () => fetchAgents(searchQuery, selectedStatus !== 'All' ? selectedStatus.toLowerCase() : undefined),
  })

  const statusCounts = useMemo(() => {
    return {
      All: agents.length,
      Active: agents.filter((a) => a.status === 'active').length,
      Draft: agents.filter((a) => a.status === 'draft').length,
      Paused: agents.filter((a) => a.status === 'paused').length,
    }
  }, [agents])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex flex-col h-screen bg-bg">
      {/* Header */}
      <div className="border-b border-border bg-surface px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-text-3 mb-1">Workspace</p>
            <h1 className="text-3xl font-700 text-text" style={{ fontFamily: 'serif' }}>Agents</h1>
          </div>
          <Link
            href="/agents/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white font-500 hover:opacity-90 transition-opacity"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New agent
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-3 w-5 h-5 text-text-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search agents"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-white text-text placeholder-text-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-2">
            {['All', 'Active', 'Draft', 'Paused'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-full font-500 text-sm transition-colors ${
                  selectedStatus === status
                    ? 'bg-accent text-white'
                    : 'bg-surface border border-border text-text hover:bg-panel'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
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
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg border border-error text-error hover:bg-error hover:text-white transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : agents.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-panel mx-auto mb-4 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6m0 4v.01" />
                </svg>
              </div>
              <p className="text-text mb-2">No agents yet</p>
              <Link href="/agents/new" className="text-accent hover:underline text-sm">
                Create your first agent
              </Link>
            </div>
          </div>
        ) : (
          <div className="px-8 py-6">
            {/* Table */}
            <div className="border border-border rounded-xl overflow-hidden" style={{ backgroundColor: '#FBF9F4' }}>
              {/* Table Header */}
              <div className="grid grid-cols-[2fr_1fr_1.5fr_0.8fr_1fr_0.8fr] gap-4 px-6 py-4 font-700 text-xs text-text-3 uppercase tracking-widest" style={{ backgroundColor: '#EFEADD', borderBottom: '1px solid #DAD3C3' }}>
                <div>Agent</div>
                <div>Model</div>
                <div>Knowledge</div>
                <div>Status</div>
                <div>Updated</div>
                <div></div>
              </div>

              {/* Table Rows */}
              <div style={{ backgroundColor: '#FBF9F4' }}>
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="grid grid-cols-[2fr_1fr_1.5fr_0.8fr_1fr_0.8fr] gap-4 px-6 py-5 items-center"
                    style={{ borderBottom: '1px solid #E6E0D2' }}
                  >
                    {/* Agent */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E4EDEA' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#0E5A57' }}>
                          <rect x="4" y="8" width="16" height="12" rx="2" />
                          <path d="M12 8V4M9 14h.01M15 14h.01" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-700 text-lg text-text truncate" style={{ fontFamily: 'serif' }}>{agent.name}</h3>
                        <p className="text-xs uppercase tracking-widest font-600 mt-0.5" style={{ color: '#0E5A57' }}>{agent.type}</p>
                        <p className="text-text-3 text-sm mt-1 line-clamp-1">{agent.description}</p>
                      </div>
                    </div>

                    {/* Model */}
                    <div className="text-sm text-text">{agent.model?.display_name}</div>

                    {/* Knowledge */}
                    <div className="flex flex-wrap items-center gap-2">
                      {agent.knowledge_bases && agent.knowledge_bases.length > 0 ? (
                        agent.knowledge_bases.map((kb, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center h-7 px-3 rounded-full text-xs font-500 whitespace-nowrap border"
                            style={{ backgroundColor: '#EFEADD', color: '#3D392F', borderColor: '#DAD3C3' }}
                          >
                            {kb}
                          </span>
                        ))
                      ) : (
                        <span className="text-text-3 text-xs">—</span>
                      )}
                    </div>

                    {/* Status */}
                    <div
                      className="inline-flex h-8 items-center gap-2 rounded-full px-3 text-sm font-600 w-fit"
                      style={{
                        backgroundColor: getStatusStyle(agent.status).backgroundColor,
                        color: getStatusStyle(agent.status).color,
                      }}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getStatusStyle(agent.status).dotColor }}
                      />
                      <span className="capitalize">{agent.status}</span>
                    </div>

                    {/* Updated */}
                    <div className="text-sm text-text-3">{formatDate(agent.updated_at)}</div>

                    {/* Action */}
                    <div className="text-right">
                      <button
                        onClick={() => router.push(`/agents/${agent.id}`)}
                        className="px-4 py-2 rounded-lg border text-text text-sm font-600 hover:bg-white transition-colors"
                        style={{ borderColor: '#C9C1AE', backgroundColor: '#FFFFFF' }}
                      >
                        Open
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
