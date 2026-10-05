'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchWorkspace, updateWorkspace, updateWorkspaceContent } from '@/lib/workspace-api'
import { Editor } from '@/components/Editor'
import { useCallback, useEffect, useRef, useState } from 'react'

interface WorkspacePageProps {
  params: { id: string }
}

export default function WorkspaceEditorPage({ params }: WorkspacePageProps) {
  const queryClient = useQueryClient()
  const [content, setContent] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  const { data: workspace, isLoading, error } = useQuery({
    queryKey: ['workspace', params.id],
    queryFn: () => fetchWorkspace(params.id),
  })

  const updateMutation = useMutation({
    mutationFn: async (newContent: string) => {
      return updateWorkspaceContent(params.id, newContent)
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['workspace', params.id], updated)
      setIsSaving(false)
    },
  })

  // Initialize content from workspace
  useEffect(() => {
    if (workspace && !content) {
      try {
        setContent(JSON.parse(workspace.content))
      } catch {
        setContent({ type: 'doc', content: [] })
      }
    }
  }, [workspace, content])

  // Handle content changes with autosave debounce
  const handleContentChange = useCallback(
    (newContent: any) => {
      setContent(newContent)
      setIsSaving(true)

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Set new timeout for autosave
      saveTimeoutRef.current = setTimeout(() => {
        try {
          const contentStr = JSON.stringify(newContent)
          updateMutation.mutate(contentStr)
        } catch (err) {
          console.error('Failed to save:', err)
          setIsSaving(false)
        }
      }, 1500)
    },
    [updateMutation]
  )

  const handleSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    if (content) {
      try {
        const contentStr = JSON.stringify(content)
        updateMutation.mutate(contentStr)
      } catch (err) {
        console.error('Failed to save:', err)
        setIsSaving(false)
      }
    }
  }, [content, updateMutation])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-bg">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 rounded-full border-2 border-border border-t-accent animate-spin mx-auto mb-2" />
            <p className="text-text-3">Loading document...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !workspace) {
    return (
      <div className="flex flex-col h-screen bg-bg">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-error mb-2">Failed to load document</p>
            <p className="text-text-3 text-sm">{error?.message}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-bg">
      {/* Header with title and save status */}
      <div className="border-b border-border bg-surface px-8 py-4 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-600 text-text truncate">{workspace.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-text-3 text-xs">v{workspace.version}</p>
            {isSaving && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                <p className="text-warning text-xs">Saving...</p>
              </div>
            )}
            {!isSaving && updateMutation.isSuccess && (
              <p className="text-text-3 text-xs">Saved</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="px-3 py-1.5 text-sm font-500 rounded-button bg-accent text-white hover:opacity-90 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>

      {/* Editor */}
      {content && (
        <div className="flex-1 min-h-0">
          <Editor value={content} onChange={handleContentChange} onSave={handleSave} />
        </div>
      )}
    </div>
  )
}
