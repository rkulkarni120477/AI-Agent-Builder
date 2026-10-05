'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchAgent } from '@/lib/api'
import { AgentForm } from '@/components/AgentForm'

interface AgentPageProps {
  params: { id: string }
}

export default function AgentPage({ params }: AgentPageProps) {
  const { data: agent, isLoading, error } = useQuery({
    queryKey: ['agent', params.id],
    queryFn: () => fetchAgent(params.id),
  })

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b border-border bg-surface px-8 py-4">
        <h1 className="text-xl font-600 text-text">
          {isLoading ? 'Loading...' : agent?.name || 'Agent'}
        </h1>
      </div>
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 rounded-full border-2 border-border border-t-accent animate-spin mx-auto mb-2" />
            <p className="text-text-3">Loading agent...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-error mb-2">Failed to load agent</p>
            <p className="text-text-3 text-sm">{error.message}</p>
          </div>
        </div>
      ) : agent ? (
        <AgentForm agent={agent} isEditing={true} />
      ) : null}
    </div>
  )
}
