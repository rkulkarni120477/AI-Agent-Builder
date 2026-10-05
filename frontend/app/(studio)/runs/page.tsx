'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { fetchSystemHealth } from '@/lib/analytics-api'

export default function RunsPage() {
  const [view, setView] = useState<'overview' | 'runs'>('overview')

  const { data: health, isLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: fetchSystemHealth,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  return (
    <div className="flex flex-col h-screen bg-bg">
      <div className="border-b border-border bg-surface px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-600 text-text">Runs &amp; logs</h1>
            <p className="text-text-3 mt-1">Agent execution history and system monitoring</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView('overview')}
              className={`px-4 py-2 rounded-button text-sm font-500 ${
                view === 'overview'
                  ? 'bg-accent text-white'
                  : 'border border-border bg-surface text-text hover:bg-panel'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setView('runs')}
              className={`px-4 py-2 rounded-button text-sm font-500 ${
                view === 'runs'
                  ? 'bg-accent text-white'
                  : 'border border-border bg-surface text-text hover:bg-panel'
              }`}
            >
              All runs
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {view === 'overview' && (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-8 h-8 rounded-full border-2 border-border border-t-accent animate-spin mx-auto mb-2" />
                  <p className="text-text-3">Loading system status...</p>
                </div>
              </div>
            ) : health ? (
              <div className="space-y-6 max-w-4xl">
                {/* Health Status */}
                <div className="p-6 rounded-button border border-border bg-surface">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-600 text-text">System Status</h2>
                      <p className="text-text-3 text-sm mt-1">Last updated: {new Date(health.timestamp).toLocaleTimeString()}</p>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-button text-sm font-500 ${
                        health.status === 'healthy'
                          ? 'bg-success-light text-success'
                          : 'bg-warning-light text-warning'
                      }`}
                    >
                      {health.status?.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                {health.metrics && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-button border border-border bg-surface">
                      <p className="text-text-3 text-sm">Total Agents</p>
                      <p className="text-3xl font-600 text-text mt-2">
                        {health.metrics.total_agents}
                      </p>
                    </div>
                    <div className="p-4 rounded-button border border-border bg-surface">
                      <p className="text-text-3 text-sm">Total Workspaces</p>
                      <p className="text-3xl font-600 text-text mt-2">
                        {health.metrics.total_workspaces}
                      </p>
                    </div>
                    <div className="p-4 rounded-button border border-border bg-surface">
                      <p className="text-text-3 text-sm">Total Runs</p>
                      <p className="text-3xl font-600 text-text mt-2">
                        {health.metrics.total_runs}
                      </p>
                    </div>
                  </div>
                )}

                {/* Features List */}
                <div className="p-6 rounded-button border border-border bg-surface">
                  <h3 className="font-600 text-text mb-4">Available Features</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-success">✓</span>
                      <span className="text-text-2">Workspace analytics and statistics</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-success">✓</span>
                      <span className="text-text-2">Agent performance metrics</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-success">✓</span>
                      <span className="text-text-2">Runs filtering and pagination</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-success">✓</span>
                      <span className="text-text-2">Workspace sharing and collaboration</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-success">✓</span>
                      <span className="text-text-2">User preferences and settings</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-success">✓</span>
                      <span className="text-text-2">System health monitoring</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}

        {view === 'runs' && (
          <div className="text-center py-12">
            <p className="text-text-3">Runs can be viewed from individual workspaces and agent detail pages</p>
          </div>
        )}
      </div>
    </div>
  )
}
