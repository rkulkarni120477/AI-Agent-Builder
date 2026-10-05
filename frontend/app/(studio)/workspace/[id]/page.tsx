'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchWorkspace, updateWorkspace, updateWorkspaceContent } from '@/lib/workspace-api'
import { Editor } from '@/components/Editor'
import { ChatPanel } from '@/components/ChatPanel'
import { useCallback, useEffect, useRef, useState } from 'react'

interface WorkspacePageProps {
  params: { id: string }
}

export default function WorkspaceEditorPage({ params }: WorkspacePageProps) {
  const queryClient = useQueryClient()
  const [content, setContent] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showChat, setShowChat] = useState(true)
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

  const renameMutation = useMutation({
    mutationFn: (title: string) => updateWorkspace(params.id, { title }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['workspace', params.id], (old: any) => ({
        ...old,
        title: updated.title,
      }))
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
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
          <div className="text-xs font-500 uppercase tracking-wide text-text-3">Workspace</div>
          <input
            key={workspace.id}
            defaultValue={workspace.title}
            aria-label="Document name"
            maxLength={200}
            onBlur={(e) => {
              const v = e.target.value.trim()
              if (!v) {
                e.target.value = workspace.title
              } else if (v !== workspace.title) {
                renameMutation.mutate(v)
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              if (e.key === 'Escape') {
                ;(e.target as HTMLInputElement).value = workspace.title
                ;(e.target as HTMLInputElement).blur()
              }
            }}
            className="w-full rounded-button border border-transparent bg-transparent px-1 -ml-1 font-serif text-2xl font-600 text-text truncate hover:border-border focus:border-accent focus:bg-bg focus:outline-none"
          />
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
          <span className="rounded-pill border border-border bg-chip px-3 py-1 text-xs font-500 text-text-2">
            Context: whole document
          </span>
          <button
            onClick={() => setShowChat(!showChat)}
            className="px-3 py-1.5 text-sm font-500 rounded-button border border-border hover:bg-panel"
            title={showChat ? 'Hide chat' : 'Show chat'}
          >
            {showChat ? '×' : '💬'}
          </button>
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="px-3 py-1.5 text-sm font-500 rounded-button bg-accent text-white hover:opacity-90 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>

      {/* Editor and Chat split view */}
      <div className="flex-1 min-h-0 flex">
        {/* Editor */}
        {content && (
          <div className={`${showChat ? 'w-2/3' : 'w-full'} flex flex-col border-r border-border bg-bg`}>
            <Editor value={content} onChange={handleContentChange} onSave={handleSave} />
          </div>
        )}

        {/* Chat Panel */}
        {showChat && (
          <div className="w-1/3 flex flex-col">
            <ChatPanel workspace_id={params.id} />
          </div>
        )}
      </div>
    </div>
  )
}
