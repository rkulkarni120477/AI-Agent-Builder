'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { agentSchema, type AgentFormData } from '@/lib/schemas'
import { createAgent, updateAgent, fetchModels, checkHandleAvailability, type Agent, type Model } from '@/lib/api'

const AGENT_TYPES = [
  'Standard alignment',
  'Content tagging',
  'Skill extraction',
  'Skill gap analysis',
  'Content creation',
  'Curriculum creation',
  'Micro-course creation',
  'Custom',
]

interface AgentFormProps {
  agent?: Agent
  isEditing?: boolean
}

export function AgentForm({ agent, isEditing = false }: AgentFormProps) {
  const router = useRouter()
  const [handleCheckTimeout, setHandleCheckTimeout] = useState<NodeJS.Timeout>()
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null)

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: agent
      ? {
          name: agent.name,
          handle: (agent as any).handle || '',
          type: agent.type,
          description: agent.description || '',
          instructions: (agent as any).instructions || '',
          when_to_call: (agent as any).when_to_call || '',
          input_spec: (agent as any).input_spec || '',
          output_spec: (agent as any).output_spec || '',
          callable_by: (agent as any).callable_by || 'any',
          timeout_seconds: (agent as any).timeout_seconds || 30,
          model_id: agent.model?.id || '',
          temperature: (agent as any).temperature || 1.0,
          strict_grounding: (agent as any).strict_grounding || false,
        }
      : {
          callable_by: 'any',
          timeout_seconds: 30,
          temperature: 1.0,
          strict_grounding: false,
        },
    mode: 'onChange',
  })

  const { data: models = [] } = useQuery({
    queryKey: ['models'],
    queryFn: fetchModels,
  })

  const handleValue = watch('handle')

  // Check handle availability with debounce
  useEffect(() => {
    if (!handleValue || (isEditing && handleValue === (agent as any)?.handle)) {
      setHandleAvailable(null)
      return
    }

    clearTimeout(handleCheckTimeout)
    const timeout = setTimeout(async () => {
      try {
        const available = await checkHandleAvailability(handleValue)
        setHandleAvailable(available)
      } catch (error) {
        setHandleAvailable(null)
      }
    }, 300)

    setHandleCheckTimeout(timeout)
    return () => clearTimeout(timeout)
  }, [handleValue, agent, isEditing, handleCheckTimeout])

  const createMutation = useMutation({
    mutationFn: async (data: AgentFormData) => {
      return createAgent(data)
    },
    onSuccess: (newAgent) => {
      router.push(`/studio/agents/${newAgent.id}`)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: AgentFormData) => {
      if (!agent?.id) throw new Error('Agent ID is required')
      return updateAgent(agent.id, data)
    },
    onSuccess: () => {
      router.push(`/studio/agents/${agent?.id}`)
    },
  })

  const onSubmit = async (data: AgentFormData) => {
    if (isEditing) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
      {/* Form fields */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-2xl space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-500 text-text mb-2">Name</label>
            <input
              {...register('name')}
              type="text"
              placeholder="e.g., Standards Aligner"
              className="w-full px-3 py-2 rounded-input border border-border bg-surface text-text placeholder-text-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {errors.name && <p className="text-error text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Handle */}
          <div>
            <label className="block text-sm font-500 text-text mb-2">Handle</label>
            <div className="relative">
              <input
                {...register('handle')}
                type="text"
                placeholder="e.g., standards-aligner"
                className="w-full px-3 py-2 rounded-input border border-border bg-surface text-text placeholder-text-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {handleValue && handleValue !== (agent as any)?.handle && (
                <div className="absolute right-3 top-2.5">
                  {handleAvailable === null ? (
                    <div className="w-4 h-4 rounded-full border-2 border-border border-t-accent animate-spin" />
                  ) : handleAvailable ? (
                    <span className="text-success text-sm">✓</span>
                  ) : (
                    <span className="text-error text-sm">✗</span>
                  )}
                </div>
              )}
            </div>
            {errors.handle && <p className="text-error text-xs mt-1">{errors.handle.message}</p>}
            {handleAvailable === false && <p className="text-error text-xs mt-1">This handle is already taken</p>}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-500 text-text mb-2">Type</label>
            <select
              {...register('type')}
              className="w-full px-3 py-2 rounded-input border border-border bg-surface text-text text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">Select a type</option>
              {AGENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.type && <p className="text-error text-xs mt-1">{errors.type.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-500 text-text mb-2">Description</label>
            <textarea
              {...register('description')}
              placeholder="What does this agent do?"
              rows={3}
              className="w-full px-3 py-2 rounded-input border border-border bg-surface text-text placeholder-text-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
            {errors.description && <p className="text-error text-xs mt-1">{errors.description.message}</p>}
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-500 text-text mb-2">Instructions</label>
            <textarea
              {...register('instructions')}
              placeholder="System instructions for the agent..."
              rows={5}
              className="w-full px-3 py-2 rounded-input border border-border bg-surface text-text placeholder-text-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
            {errors.instructions && <p className="text-error text-xs mt-1">{errors.instructions.message}</p>}
          </div>

          {/* When to call */}
          <div>
            <label className="block text-sm font-500 text-text mb-2">When to call</label>
            <textarea
              {...register('when_to_call')}
              placeholder="When should this agent be invoked?"
              rows={3}
              className="w-full px-3 py-2 rounded-input border border-border bg-surface text-text placeholder-text-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
            {errors.when_to_call && <p className="text-error text-xs mt-1">{errors.when_to_call.message}</p>}
          </div>

          {/* Input spec */}
          <div>
            <label className="block text-sm font-500 text-text mb-2">Input spec</label>
            <textarea
              {...register('input_spec')}
              placeholder="JSON schema or description of expected input..."
              rows={3}
              className="w-full px-3 py-2 rounded-input border border-border bg-surface text-text placeholder-text-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent resize-none font-mono text-xs"
            />
            {errors.input_spec && <p className="text-error text-xs mt-1">{errors.input_spec.message}</p>}
          </div>

          {/* Output spec */}
          <div>
            <label className="block text-sm font-500 text-text mb-2">Output spec</label>
            <textarea
              {...register('output_spec')}
              placeholder="JSON schema or description of expected output..."
              rows={3}
              className="w-full px-3 py-2 rounded-input border border-border bg-surface text-text placeholder-text-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent resize-none font-mono text-xs"
            />
            {errors.output_spec && <p className="text-error text-xs mt-1">{errors.output_spec.message}</p>}
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-500 text-text mb-2">Model</label>
            <select
              {...register('model_id')}
              className="w-full px-3 py-2 rounded-input border border-border bg-surface text-text text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">Select a model</option>
              {models.map((model: Model) => (
                <option key={model.id} value={model.id}>
                  {model.display_name}
                </option>
              ))}
            </select>
            {errors.model_id && <p className="text-error text-xs mt-1">{errors.model_id.message}</p>}
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-500 text-text mb-2">Temperature</label>
            <div className="flex items-center gap-3">
              <input
                {...register('temperature', { valueAsNumber: true })}
                type="range"
                min="0"
                max="2"
                step="0.1"
                className="flex-1"
              />
              <span className="w-12 text-right text-text font-500">
                {watch('temperature').toFixed(1)}
              </span>
            </div>
            <p className="text-text-3 text-xs mt-1">0 = deterministic, 2 = creative</p>
            {errors.temperature && <p className="text-error text-xs mt-1">{errors.temperature.message}</p>}
          </div>

          {/* Timeout */}
          <div>
            <label className="block text-sm font-500 text-text mb-2">Timeout (seconds)</label>
            <input
              {...register('timeout_seconds', { valueAsNumber: true })}
              type="number"
              min="5"
              max="600"
              className="w-full px-3 py-2 rounded-input border border-border bg-surface text-text text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {errors.timeout_seconds && <p className="text-error text-xs mt-1">{errors.timeout_seconds.message}</p>}
          </div>

          {/* Callable by */}
          <div>
            <label className="block text-sm font-500 text-text mb-2">Callable by</label>
            <select
              {...register('callable_by')}
              className="w-full px-3 py-2 rounded-input border border-border bg-surface text-text text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="any">Anyone</option>
              <option value="approved">Approved callers only</option>
              <option value="orchestrator">Orchestrator only</option>
            </select>
            {errors.callable_by && <p className="text-error text-xs mt-1">{errors.callable_by.message}</p>}
          </div>

          {/* Strict grounding */}
          <div className="flex items-center gap-3">
            <input
              {...register('strict_grounding')}
              type="checkbox"
              id="strict-grounding"
              className="w-4 h-4 rounded border-border bg-surface text-accent"
            />
            <label htmlFor="strict-grounding" className="text-sm font-500 text-text">
              Require knowledge base grounding
            </label>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-surface px-8 py-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded-button border border-border bg-surface text-text font-500 hover:bg-panel"
        >
          Cancel
        </button>
        <div className="flex items-center gap-3">
          {createMutation.isError || updateMutation.isError ? (
            <p className="text-error text-sm">
              {createMutation.error?.message || updateMutation.error?.message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={isLoading || !isValid || (handleAvailable === false)}
            className="px-4 py-2 rounded-button bg-accent text-white font-500 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
          >
            {isLoading ? 'Saving...' : isEditing ? 'Update agent' : 'Create agent'}
          </button>
        </div>
      </div>
    </form>
  )
}
