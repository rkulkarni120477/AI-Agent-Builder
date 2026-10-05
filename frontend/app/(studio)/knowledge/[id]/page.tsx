'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchKnowledgeBase, fetchFiles, uploadFile, deleteFile } from '@/lib/kb-api'
import { useRef, useState } from 'react'

interface KnowledgeBasePageProps {
  params: { id: string }
}

export default function KnowledgeBasePage({ params }: KnowledgeBasePageProps) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const { data: kb, isLoading, error } = useQuery({
    queryKey: ['knowledge-base', params.id],
    queryFn: () => fetchKnowledgeBase(params.id),
  })

  const { data: files = [], refetch: refetchFiles } = useQuery({
    queryKey: ['files', params.id],
    queryFn: () => fetchFiles(params.id),
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: globalThis.File) => {
      return uploadFile(params.id, file)
    },
    onSuccess: () => {
      refetchFiles()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (file_id: string) => {
      return deleteFile(params.id, file_id)
    },
    onSuccess: () => {
      refetchFiles()
    },
  })

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    for (let i = 0; i < files.length; i++) {
      uploadMutation.mutate(files[i])
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFileUpload(e.dataTransfer.files)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-success-light text-success'
      case 'processing':
        return 'bg-warning-light text-warning'
      case 'failed':
        return 'bg-error-light text-error'
      default:
        return 'bg-secondary-light text-secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return '✓'
      case 'processing':
        return '⟳'
      case 'failed':
        return '✕'
      default:
        return '⊙'
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-bg">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 rounded-full border-2 border-border border-t-accent animate-spin mx-auto mb-2" />
            <p className="text-text-3">Loading knowledge base...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !kb) {
    return (
      <div className="flex flex-col h-screen bg-bg">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-error mb-2">Failed to load knowledge base</p>
            <p className="text-text-3 text-sm">{error?.message}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-bg">
      {/* Header */}
      <div className="border-b border-border bg-surface px-8 py-6">
        <h1 className="text-2xl font-600 text-text">{kb.name}</h1>
        {kb.description && <p className="text-text-3 mt-1">{kb.description}</p>}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="space-y-8">
          {/* Upload section */}
          <div className="max-w-2xl">
            <h2 className="text-lg font-600 text-text mb-4">Upload documents</h2>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
              accept=".txt,.pdf,.doc,.docx,.md"
            />
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-button p-8 text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-accent bg-accent-soft'
                  : 'border-border hover:border-accent hover:bg-panel'
              }`}
            >
              <div className="text-4xl mb-2">📄</div>
              <p className="font-500 text-text">Drag and drop files here</p>
              <p className="text-text-3 text-sm mt-1">or click to browse</p>
              <p className="text-text-4 text-xs mt-2">Max 10MB per file • TXT, PDF, DOC, DOCX, MD</p>
            </div>
          </div>

          {/* Files section */}
          <div className="max-w-2xl">
            <h2 className="text-lg font-600 text-text mb-4">
              Documents ({files.length})
            </h2>

            {files.length === 0 ? (
              <p className="text-text-3 text-sm">No documents yet</p>
            ) : (
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-button border border-border bg-surface"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-500 text-text truncate">{file.filename}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-badge text-xs font-500 ${getStatusColor(
                            file.status
                          )}`}
                        >
                          <span>{getStatusIcon(file.status)}</span>
                          {file.status}
                        </span>
                        <span className="text-text-3 text-xs">
                          {(file.size_bytes / 1024).toFixed(1)} KB
                        </span>
                        {file.chunk_count > 0 && (
                          <span className="text-text-3 text-xs">
                            {file.chunk_count} chunks
                          </span>
                        )}
                      </div>
                      {file.error && (
                        <p className="text-error text-xs mt-1">{file.error}</p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteMutation.mutate(file.id)}
                      disabled={deleteMutation.isPending}
                      className="ml-4 px-2 py-1 text-xs text-error hover:bg-error-light rounded-button disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
