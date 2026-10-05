'use client'

import { AgentForm } from '@/components/AgentForm'

export default function NewAgentPage() {
  return (
    <div className="flex flex-col h-screen">
      <div className="border-b border-border bg-surface px-8 py-4">
        <h1 className="text-xl font-600 text-text">Create new agent</h1>
      </div>
      <AgentForm />
    </div>
  )
}
