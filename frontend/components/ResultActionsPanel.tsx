'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { insertResult, copyToClipboard } from '@/lib/review-api'
import { type Run } from '@/lib/chat-api'

interface ResultActionsPanelProps {
  run: Run
  workspace_id: string
  onInserted?: () => void
}

type FormatType = 'paragraph' | 'code' | 'formatted'

export function ResultActionsPanel({
  run,
  workspace_id,
  onInserted,
}: ResultActionsPanelProps) {
  const queryClient = useQueryClient()
  const [selectedFormat, setSelectedFormat] = useState<FormatType>('formatted')
  const [showPreview, setShowPreview] = useState(false)

  const insertMutation = useMutation({
    mutationFn: () =>
      insertResult({
        run_id: run.id,
        workspace_id,
        format_type: selectedFormat,
        insert_separator: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace'] })
      onInserted?.()
    },
  })

  const copyMutation = useMutation({
    mutationFn: () => copyToClipboard(run.id, workspace_id),
    onSuccess: async () => {
      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(run.output_text || '')
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    },
  })

  if (!run.output_text) {
    return null
  }

  const preview =
    run.output_text.length > 150
      ? run.output_text.slice(0, 150) + '...'
      : run.output_text

  return (
    <div className="border-t border-border bg-surface p-4 space-y-3">
      {/* Format selector */}
      <div>
        <label className="block text-xs font-500 text-text mb-2">Insert as:</label>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedFormat('paragraph')}
            className={`px-2 py-1 rounded-button text-xs font-500 ${
              selectedFormat === 'paragraph'
                ? 'bg-accent text-white'
                : 'bg-panel text-text hover:bg-sidebar'
            }`}
          >
            Text
          </button>
          <button
            onClick={() => setSelectedFormat('code')}
            className={`px-2 py-1 rounded-button text-xs font-500 ${
              selectedFormat === 'code'
                ? 'bg-accent text-white'
                : 'bg-panel text-text hover:bg-sidebar'
            }`}
          >
            Code
          </button>
          <button
            onClick={() => setSelectedFormat('formatted')}
            className={`px-2 py-1 rounded-button text-xs font-500 ${
              selectedFormat === 'formatted'
                ? 'bg-accent text-white'
                : 'bg-panel text-text hover:bg-sidebar'
            }`}
          >
            Formatted
          </button>
        </div>
      </div>

      {/* Preview toggle */}
      <button
        onClick={() => setShowPreview(!showPreview)}
        className="text-xs text-accent hover:underline"
      >
        {showPreview ? 'Hide' : 'Show'} preview
      </button>

      {/* Preview */}
      {showPreview && (
        <div className="p-3 rounded-button bg-panel border border-border text-xs text-text-3">
          <p className="line-clamp-3">{preview}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => insertMutation.mutate()}
          disabled={insertMutation.isPending}
          className="flex-1 px-3 py-2 rounded-button bg-accent text-white text-sm font-500 hover:opacity-90 disabled:opacity-50"
        >
          {insertMutation.isPending ? 'Inserting...' : '↓ Insert'}
        </button>

        <button
          onClick={() => copyMutation.mutate()}
          disabled={copyMutation.isPending}
          className="px-3 py-2 rounded-button border border-border bg-surface text-text text-sm font-500 hover:bg-panel disabled:opacity-50"
          title="Copy to clipboard"
        >
          {copyMutation.isPending ? '...' : '📋'}
        </button>
      </div>

      {/* Status messages */}
      {insertMutation.isSuccess && (
        <p className="text-xs text-success">✓ Inserted into document</p>
      )}
      {insertMutation.isError && (
        <p className="text-xs text-error">✗ Failed to insert</p>
      )}
    </div>
  )
}
