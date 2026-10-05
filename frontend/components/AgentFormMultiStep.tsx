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

const STEPS = [
  { number: 1, title: 'Basics', description: 'Name, type, and handle' },
  { number: 2, title: 'Behavior', description: 'Instructions and rules' },
  { number: 3, title: 'Advanced', description: 'Model and handoffs' },
  { number: 4, title: 'Knowledge', description: 'Add content' },
]

interface AgentFormProps {
  agent?: Agent
  isEditing?: boolean
}

export function AgentFormMultiStep({ agent, isEditing = false }: AgentFormProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
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
          timeout_seconds: (agent as any).timeout_seconds || 60,
          model_id: agent.model?.id || '',
          temperature: (agent as any).temperature || 1.0,
          strict_grounding: (agent as any).strict_grounding || true,
        }
      : {
          callable_by: 'any',
          timeout_seconds: 60,
          temperature: 1.0,
          strict_grounding: true,
        },
    mode: 'onChange',
  })

  const { data: models = [] } = useQuery({
    queryKey: ['models'],
    queryFn: fetchModels,
  })

  const formValues = watch()

  const handleValue = watch('handle')
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
      } catch {
        setHandleAvailable(null)
      }
    }, 300)

    setHandleCheckTimeout(timeout)
    return () => clearTimeout(timeout)
  }, [handleValue, agent, isEditing, handleCheckTimeout])

  const createMutation = useMutation({
    mutationFn: async (data: AgentFormData) => createAgent(data),
    onSuccess: (newAgent) => router.push(`/agents/${newAgent.id}`),
  })

  const updateMutation = useMutation({
    mutationFn: async (data: AgentFormData) => {
      if (!agent?.id) throw new Error('Agent ID is required')
      return updateAgent(agent.id, data)
    },
    onSuccess: () => router.push(`/agents/${agent?.id}`),
  })

  const onSubmit = async (data: AgentFormData) => {
    if (isEditing) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex h-full bg-bg">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Step Indicator */}
        <div className="bg-surface border-b border-border px-8 py-6">
          <div className="flex items-center gap-2 mb-6">
            {STEPS.map((step, idx) => (
              <div key={step.number} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(step.number)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-500 text-sm transition-colors ${
                    currentStep >= step.number
                      ? 'bg-accent text-white'
                      : 'bg-border text-text-3'
                  }`}
                >
                  {currentStep > step.number ? '✓' : step.number}
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 ${currentStep > step.number ? 'bg-accent' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </div>
          <div>
            <h2 className="text-xl font-600 text-text">{STEPS[currentStep - 1].title}</h2>
            <p className="text-text-3 text-sm mt-1">{STEPS[currentStep - 1].description}</p>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-xl space-y-6">
            {/* Step 1: Basics */}
            {currentStep === 1 && (
              <>
                <div>
                  <label className="block text-sm font-600 text-text mb-3">Agent name *</label>
                  <input
                    {...register('name')}
                    placeholder="e.g., Standards Aligner"
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-text placeholder-text-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  {errors.name && <p className="text-error text-xs mt-2">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-600 text-text mb-3">Call handle *</label>
                  <input
                    {...register('handle')}
                    placeholder="e.g., standards-aligner"
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-text placeholder-text-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  {handleValue && (
                    <p className={`text-xs mt-2 ${handleAvailable ? 'text-success' : 'text-error'}`}>
                      {handleAvailable ? '✓ Available' : '✗ Already in use'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-600 text-text mb-3">Agent type *</label>
                  <select
                    {...register('type')}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Select a type</option>
                    {AGENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {errors.type && <p className="text-error text-xs mt-2">{errors.type.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-600 text-text mb-3">Description</label>
                  <textarea
                    {...register('description')}
                    placeholder="What does this agent do?"
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-text placeholder-text-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  />
                </div>
              </>
            )}

            {/* Step 2: Behavior */}
            {currentStep === 2 && (
              <>
                <div>
                  <label className="block text-sm font-600 text-text mb-3">Instructions *</label>
                  <textarea
                    {...register('instructions')}
                    placeholder="Describe the job, the standards or frameworks it works with, and the output it should produce."
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-text placeholder-text-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  />
                  {errors.instructions && <p className="text-error text-xs mt-2">{errors.instructions.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-600 text-text mb-3">When should other agents call this? *</label>
                  <textarea
                    {...register('when_to_call')}
                    placeholder="e.g., Call when a lesson needs to be aligned to academic standards."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-text placeholder-text-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-600 text-text mb-3">Input it expects *</label>
                    <textarea
                      {...register('input_spec')}
                      placeholder="e.g., Lesson text, grade level, target standards"
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-text placeholder-text-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-600 text-text mb-3">Output it returns *</label>
                    <textarea
                      {...register('output_spec')}
                      placeholder="e.g., JSON list of aligned standards with rationale"
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-text placeholder-text-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-600 text-text mb-3">Who can call this agent *</label>
                  <div className="space-y-2">
                    {[
                      { value: 'any', label: 'Any agent', description: 'Discoverable by every agent on the platform' },
                      { value: 'approved', label: 'Approved agents', description: 'Only agents you approve can call it' },
                      { value: 'orchestrator', label: 'Orchestrator only', description: 'Reachable only through the orchestrator' },
                    ].map((option) => (
                      <label key={option.value} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-panel cursor-pointer">
                        <input
                          type="radio"
                          {...register('callable_by')}
                          value={option.value}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-500 text-text text-sm">{option.label}</div>
                          <div className="text-text-3 text-xs">{option.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Advanced */}
            {currentStep === 3 && (
              <>
                <div>
                  <label className="block text-sm font-600 text-text mb-3">AI Model *</label>
                  <select
                    {...register('model_id')}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Select a model</option>
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.display_name} - {m.badge || 'Standard'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-600 text-text mb-3">Temperature</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    {...register('temperature', { valueAsNumber: true })}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <p className="text-text-3 text-xs mt-2">Lower = more focused, Higher = more creative (0-2)</p>
                </div>

                <div>
                  <label className="block text-sm font-600 text-text mb-3">Time limit per call (seconds)</label>
                  <input
                    type="number"
                    min="5"
                    max="600"
                    {...register('timeout_seconds', { valueAsNumber: true })}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('strict_grounding')}
                      className="w-4 h-4 rounded"
                    />
                    <div>
                      <div className="font-500 text-text text-sm">Strict grounding</div>
                      <div className="text-text-3 text-xs">Agent says "I don't know" instead of guessing</div>
                    </div>
                  </label>
                </div>
              </>
            )}

            {/* Step 4: Knowledge */}
            {currentStep === 4 && (
              <div className="text-center py-12">
                <p className="text-text-2">Knowledge base integration coming soon</p>
                <p className="text-text-3 text-sm mt-2">You can add knowledge after creating the agent</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="border-t border-border bg-surface px-8 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 rounded-lg border border-border text-text hover:bg-panel disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/agents')}
              className="px-4 py-2 rounded-lg border border-border text-text hover:bg-panel"
            >
              Cancel
            </button>
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-4 py-2 rounded-lg bg-accent text-white hover:opacity-90"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 rounded-lg bg-accent text-white hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create agent'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="w-80 bg-black text-white border-l border-border p-6 overflow-y-auto flex flex-col gap-8">
        <div>
          <h3 className="text-2xl font-600 mb-1">{formValues.name || 'Untitled agent'}</h3>
          <p className="text-text-3 text-sm">{formValues.handle ? `@${formValues.handle}` : 'No call handle yet'}</p>
        </div>

        <div>
          <div className="text-xs font-600 text-text-3 uppercase tracking-wide mb-2">TYPE</div>
          <p className="text-text-2">{formValues.type || 'Not set'}</p>
        </div>

        <div>
          <div className="text-xs font-600 text-text-3 uppercase tracking-wide mb-2">MODEL</div>
          <p className="text-text-2">{models.find((m) => m.id === formValues.model_id)?.display_name || 'Claude Sonnet 5.5'}</p>
        </div>

        <div>
          <div className="text-xs font-600 text-text-3 uppercase tracking-wide mb-2">CALLED BY</div>
          <p className="text-text-2">
            {{
              any: 'Any agent',
              approved: 'Approved agents',
              orchestrator: 'Orchestrator only',
            }[formValues.callable_by || 'any']}
          </p>
        </div>

        <div>
          <div className="text-xs font-600 text-text-3 uppercase tracking-wide mb-2">TEMPERATURE</div>
          <p className="text-text-2">{formValues.temperature?.toFixed(1) || '1.0'}</p>
        </div>

        <div>
          <div className="text-xs font-600 text-text-3 uppercase tracking-wide mb-2">TIMEOUT</div>
          <p className="text-text-2">{formValues.timeout_seconds || 60}s</p>
        </div>

        <div className="pt-6 border-t border-gray-700">
          <div className="text-xs font-600 text-text-3 uppercase tracking-wide mb-2">REQUIRED DETAILS</div>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Agent name', filled: !!formValues.name },
              { label: 'Call handle', filled: !!formValues.handle },
              { label: 'Agent type', filled: !!formValues.type },
              { label: 'Instructions', filled: !!formValues.instructions },
              { label: 'Input spec', filled: !!formValues.input_spec },
              { label: 'Output spec', filled: !!formValues.output_spec },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${item.filled ? 'bg-success' : 'bg-border'}`} />
                <span className={item.filled ? 'text-text' : 'text-text-3'}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </form>
  )
}
