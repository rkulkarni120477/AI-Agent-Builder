'use client'

import { useQuery } from '@tanstack/react-query'
import { useState, useRef, useEffect } from 'react'
import { fetchRuns, invokeAgent } from '@/lib/chat-api'
import { fetchAgents } from '@/lib/api'
import { ResultActionsPanel } from './ResultActionsPanel'

interface ChatPanelProps {
  workspace_id: string
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at?: string
  is_streaming?: boolean
}

export function ChatPanel({ workspace_id }: ChatPanelProps) {
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentRun, setCurrentRun] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch agents
  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => fetchAgents(),
  })

  // Fetch runs
  const { data: runs = [] } = useQuery({
    queryKey: ['runs', workspace_id, selectedAgentId],
    queryFn: () => fetchRuns(workspace_id, selectedAgentId),
  })

  // Load previous messages from runs
  useEffect(() => {
    if (runs.length > 0) {
      const allMessages: Message[] = []
      for (const run of runs) {
        run.messages?.forEach((msg) => {
          allMessages.push({
            id: msg.id,
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
            created_at: msg.created_at,
          })
        })
      }
      setMessages(allMessages)
    }
  }, [runs])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || !selectedAgentId || isLoading) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
    }
    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Add streaming assistant message placeholder
    const streamingMessage: Message = {
      id: `stream-${Date.now()}`,
      role: 'assistant',
      content: '',
      is_streaming: true,
    }
    setMessages((prev) => [...prev, streamingMessage])

    try {
      // Stream response
      const responseIterator = await invokeAgent(
        selectedAgentId,
        workspace_id,
        inputValue
      )

      let fullContent = ''
      for await (const chunk of responseIterator) {
        if (chunk && chunk !== '[ERROR]') {
          fullContent += chunk
          setMessages((prev) => {
            const newMessages = [...prev]
            const lastMsg = newMessages[newMessages.length - 1]
            if (lastMsg.is_streaming) {
              lastMsg.content = fullContent
            }
            return newMessages
          })
        }
      }

      // Mark streaming message as complete and create run
      setMessages((prev) => {
        const newMessages = [...prev]
        const lastMsg = newMessages[newMessages.length - 1]
        if (lastMsg.is_streaming) {
          delete lastMsg.is_streaming
        }
        return newMessages
      })

      // Set current run for quick actions
      const agent = agents.find((a) => a.id === selectedAgentId)
      setCurrentRun({
        agent,
        output_text: fullContent,
        status: 'completed',
      })
    } catch (error) {
      // Add error message
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Agent selector */}
      <div className="border-b border-border bg-surface px-4 py-3">
        <select
          value={selectedAgentId}
          onChange={(e) => {
            setSelectedAgentId(e.target.value)
            setMessages([])
            setCurrentRun(null)
          }}
          className="w-full px-3 py-2 rounded-input border border-border bg-surface text-text text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">Select an agent...</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && selectedAgentId && (
          <div className="flex items-center justify-center h-full text-center">
            <p className="text-text-3">Start a conversation with the selected agent</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-accent text-white'
                  : 'bg-panel text-text'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
              {message.is_streaming && (
                <div className="flex items-center gap-1 mt-2">
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                  <span className="text-xs opacity-70">Streaming...</span>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions panel */}
      {currentRun && currentRun.status === 'completed' && currentRun.output_text && (
        <ResultActionsPanel
          run={currentRun}
          workspace_id={workspace_id}
          onInserted={() => {
            setCurrentRun(null)
          }}
        />
      )}

      {/* Input form */}
      <form
        onSubmit={handleSendMessage}
        className="border-t border-border bg-surface px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask the agent..."
            disabled={!selectedAgentId || isLoading}
            className="flex-1 px-3 py-2 rounded-input border border-border bg-surface text-text placeholder-text-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!selectedAgentId || isLoading || !inputValue.trim()}
            className="px-3 py-2 rounded-button bg-accent text-white font-500 text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
