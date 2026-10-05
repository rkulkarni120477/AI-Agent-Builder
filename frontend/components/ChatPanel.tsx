'use client'

import { useQuery } from '@tanstack/react-query'
import { useState, useRef, useEffect } from 'react'
import { fetchRuns, invokeAgent } from '@/lib/chat-api'
import { fetchAgents } from '@/lib/api'
import { fetchKnowledgeBases } from '@/lib/kb-api'
import { ResultActionsPanel } from './ResultActionsPanel'

const EXAMPLES = [
  { text: 'Align this lesson to NGSS middle school standards', agent: 'Standards Aligner', kb: 'Academic Standards', label: 'NGSS Middle School Physical Science.pdf' },
  { text: 'Tag this lesson with topics, standards and skills', agent: 'Content Tagger', kb: 'Skills Taxonomies', label: 'Skills Taxonomies' },
  { text: 'Extract the skills students practice in this activity', agent: 'Skill Extractor' },
  { text: 'Find skill gaps against the Science Practices Skills Map', agent: 'Skill Gap Analyzer', kb: 'Skills Taxonomies', label: 'Science Practices Skills Map.xlsx' },
  { text: 'Write three practice questions for the exit ticket', agent: 'Content Creator', kb: 'Style and Accessibility Guides', label: 'Editorial Style Guide.pdf' },
  { text: 'Draft a four-week unit outline from this lesson', agent: 'Curriculum Designer', kb: 'Curriculum Library', label: 'Grade 7 Science Scope and Sequence.docx' },
  { text: 'Turn this lesson into a 30-minute micro-course', agent: 'Micro-course Builder' },
]

type Tab = 'chat' | 'actions' | 'review'

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
  const [tab, setTab] = useState<Tab>('chat')
  const [selectedKbIds, setSelectedKbIds] = useState<string[]>([])
  const [menu, setMenu] = useState<'agent' | 'kb' | null>(null)
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

  const { data: kbs = [] } = useQuery({
    queryKey: ['knowledge-bases'],
    queryFn: () => fetchKnowledgeBases(),
  })

  const loadExample = (ex: (typeof EXAMPLES)[number]) => {
    const agent = agents.find((a) => a.name === ex.agent)
    const kb = kbs.find((k) => k.name === ex.kb)
    if (agent) setSelectedAgentId(agent.id)
    setSelectedKbIds(kb ? [kb.id] : [])
    setInputValue(ex.text)
  }

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
        inputValue,
        selectedKbIds.length ? selectedKbIds : undefined
      )

      let fullContent = ''
      for await (const chunk of responseIterator) {
        if (chunk && chunk.startsWith('[ERROR]')) {
          throw new Error(chunk.slice(7).trim() || 'Agent failed')
        }
        if (chunk) {
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

  const selectedAgent = agents.find((a) => a.id === selectedAgentId)
  const selectedKbs = kbs.filter((k) => selectedKbIds.includes(k.id))
  const canSend = !!selectedAgentId && !!inputValue.trim() && !isLoading

  return (
    <div className="flex flex-col h-full bg-bg">
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-accent text-lg">✦</span>
          <span className="font-serif text-lg font-600 text-text">Assistant</span>
        </div>
        <div className="flex rounded-lg bg-chip p-1">
          {([['chat', 'Chat'], ['actions', 'Quick actions'], ['review', 'Review']] as [Tab, string][]).map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`flex-1 rounded-md py-1.5 text-sm font-500 ${
                tab === k ? 'bg-white text-text shadow-sm' : 'text-text-2 hover:text-text'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-3">
        {tab === 'chat' && messages.length === 0 && (
          <div>
            <div className="font-serif text-lg font-600 text-text">Example commands</div>
            <p className="mt-1 mb-3 text-sm text-text-2">
              Pick one to load it into the message box with its agent and knowledge, then send. You can also type @ to
              call an agent or # to attach knowledge.
            </p>
            <div className="space-y-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.text}
                  type="button"
                  onClick={() => loadExample(ex)}
                  className="block w-full rounded-xl border border-border bg-white px-4 py-3 text-left hover:border-accent"
                >
                  <div className="text-sm font-500 text-text">{ex.text}</div>
                  <div className="mt-1 text-xs text-accent">
                    @ {ex.agent}
                    {ex.label ? ` · # ${ex.label}` : ''}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'chat' &&
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] px-4 py-2 rounded-lg ${
                  message.role === 'user' ? 'bg-accent text-white' : 'bg-panel text-text'
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

        {tab === 'actions' &&
          (currentRun && currentRun.status === 'completed' && currentRun.output_text ? (
            <ResultActionsPanel
              run={currentRun}
              workspace_id={workspace_id}
              onInserted={() => setCurrentRun(null)}
            />
          ) : (
            <p className="text-sm text-text-2">Run an agent in Chat to get insert and copy actions for its result.</p>
          ))}

        {tab === 'review' && <p className="text-sm text-text-2">No review suggestions yet.</p>}
      </div>

      <form
        onSubmit={handleSendMessage}
        className="relative border-t border-border bg-surface px-5 py-3"
      >
        {(selectedAgent || selectedKbs.length > 0) && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {selectedAgent && (
              <span className="rounded-pill bg-chip px-2.5 py-0.5 text-xs font-500 text-accent">@ {selectedAgent.name}</span>
            )}
            {selectedKbs.map((k) => (
              <span key={k.id} className="rounded-pill bg-chip px-2.5 py-0.5 text-xs font-500 text-accent">
                # {k.name}
              </span>
            ))}
          </div>
        )}
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (canSend) handleSendMessage(e as unknown as React.FormEvent)
            }
          }}
          placeholder="Ask about this document. Type @ for an agent, # for knowledge."
          className="h-[84px] w-full resize-none rounded-[10px] border border-[#C9C1AE] bg-white px-3.5 py-2.5 text-[15px] text-text focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMenu(menu === 'agent' ? null : 'agent')}
            className="rounded-md border border-border bg-white px-2.5 py-1 text-sm text-text hover:bg-chip"
          >
            @ Agent
          </button>
          <button
            type="button"
            onClick={() => setMenu(menu === 'kb' ? null : 'kb')}
            className="rounded-md border border-border bg-white px-2.5 py-1 text-sm text-text hover:bg-chip"
          >
            # Knowledge
          </button>
          <button
            type="submit"
            disabled={!canSend}
            className="ml-auto rounded-md bg-accent px-4 py-1.5 text-sm font-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>

        {menu && (
          <div className="absolute bottom-full left-5 mb-1 max-h-56 w-64 overflow-y-auto rounded-lg border border-border bg-white p-1 shadow-lg">
            {menu === 'agent'
              ? agents.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setSelectedAgentId(a.id)
                      setMenu(null)
                    }}
                    className={`block w-full rounded-md px-3 py-1.5 text-left text-sm hover:bg-chip ${
                      a.id === selectedAgentId ? 'text-accent font-500' : 'text-text'
                    }`}
                  >
                    {a.name}
                  </button>
                ))
              : kbs.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() =>
                      setSelectedKbIds((prev) =>
                        prev.includes(k.id) ? prev.filter((x) => x !== k.id) : [...prev, k.id]
                      )
                    }
                    className={`block w-full rounded-md px-3 py-1.5 text-left text-sm hover:bg-chip ${
                      selectedKbIds.includes(k.id) ? 'text-accent font-500' : 'text-text'
                    }`}
                  >
                    {selectedKbIds.includes(k.id) ? '? ' : ''}
                    {k.name}
                  </button>
                ))}
          </div>
        )}
      </form>
    </div>
  )
}