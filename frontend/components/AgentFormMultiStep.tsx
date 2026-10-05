'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { agentSchema, type AgentFormData } from '@/lib/schemas'
import { createAgent, updateAgent, fetchModels, checkHandleAvailability, type Agent } from '@/lib/api'
import { fetchKnowledgeBases } from '@/lib/kb-api'

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

const CALL_OPTIONS = [
  { value: 'any', label: 'Any agent', note: 'Discoverable by every agent on the platform' },
  { value: 'approved', label: 'Approved agents', note: 'Only agents you approve can call it' },
  { value: 'orchestrator', label: 'Orchestrator only', note: 'Reachable only through the orchestrator' },
] as const

const CALLED_BY_LABEL: Record<string, string> = {
  any: 'Any agent',
  approved: 'Approved agents',
  orchestrator: 'Orchestrator only',
}

const inputCls =
  'w-full h-12 px-3.5 rounded-[10px] border border-[#C9C1AE] bg-white text-base text-text placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-accent'
const textareaCls =
  'w-full px-3.5 py-3 rounded-[10px] border border-[#C9C1AE] bg-white text-base leading-6 text-text placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-accent resize-none'
const labelCls = 'text-sm font-600 text-text'

function Req() {
  return <span className="text-[#9B2C1F]">*</span>
}

function SectionHeader({ n, title, aside }: { n: number; title: string; aside?: React.ReactNode }) {
  return (
    <div className="h-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-[#1F1D18] text-white text-sm font-600 flex items-center justify-center">
          {n}
        </div>
        <h2 className="font-serif text-[22px] font-600 text-text">{title}</h2>
      </div>
      {aside}
    </div>
  )
}

const sectionCls = 'bg-[#FBF9F4] border border-[#DAD3C3] rounded-2xl p-7 flex flex-col gap-5'

interface AgentFormProps {
  agent?: Agent
  isEditing?: boolean
}

export function AgentFormMultiStep({ agent, isEditing = false }: AgentFormProps) {
  const router = useRouter()
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
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
          temperature: (agent as any).temperature ?? 1.0,
          strict_grounding: (agent as any).strict_grounding ?? true,
          knowledge_base_ids: agent.knowledge_base_ids || [],
        }
      : {
          callable_by: 'any',
          timeout_seconds: 60,
          temperature: 1.0,
          strict_grounding: true,
          knowledge_base_ids: [],
        },
    mode: 'onChange',
  })

  const { data: models = [] } = useQuery({ queryKey: ['models'], queryFn: fetchModels })
  const { data: knowledgeBases = [] } = useQuery({
    queryKey: ['knowledge-bases'],
    queryFn: () => fetchKnowledgeBases(),
  })

  const formValues = watch()
  const handleValue = watch('handle')
  const modelId = watch('model_id')
  const kbIds = watch('knowledge_base_ids') ?? []

  // Default to the recommended Sonnet model when creating a new agent
  useEffect(() => {
    if (isEditing || modelId || models.length === 0) return
    const preferred = models.find((m) => /sonnet/i.test(m.display_name)) ?? models[0]
    setValue('model_id', preferred.id, { shouldValidate: true })
  }, [models, modelId, isEditing, setValue])

  useEffect(() => {
    if (!handleValue || (isEditing && handleValue === (agent as any)?.handle)) {
      setHandleAvailable(null)
      return
    }
    const timeout = setTimeout(async () => {
      try {
        setHandleAvailable(await checkHandleAvailability(handleValue))
      } catch {
        setHandleAvailable(null)
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [handleValue, agent, isEditing])

  const selectedModel = models.find((m) => m.id === modelId)
  const selectedKbs = knowledgeBases.filter((kb) => kbIds.includes(kb.id))
  const handleTaken = handleAvailable === false

  const saveMutation = useMutation({
    mutationFn: async ({ data, status }: { data: AgentFormData; status: 'draft' | 'active' }) => {
      if (isEditing) {
        if (!agent?.id) throw new Error('Agent ID is required')
        return updateAgent(agent.id, data)
      }
      return createAgent({ ...data, status })
    },
    onSuccess: (saved) => router.push(`/agents/${saved.id}`),
    onError: (e: Error) => setError(e.message),
  })

  const submitAs = (status: 'draft' | 'active') =>
    handleSubmit((data) => {
      setError(null)
      saveMutation.mutate({ data, status })
    })

  const canSubmit = isValid && !handleTaken && !isSubmitting && !saveMutation.isPending

  const requiredDetails = [
    { label: 'Agent name', filled: !!formValues.name },
    { label: 'Call handle', filled: !!formValues.handle && !handleTaken },
    { label: 'Agent type', filled: !!formValues.type },
    { label: 'Instructions', filled: !!formValues.instructions },
  ]

  return (
    <form onSubmit={submitAs('active')} className="min-h-full bg-bg">
      <header className="flex items-center justify-between px-10 pt-7 pb-6 border-b border-[#DAD3C3]">
        <div className="flex flex-col gap-1.5">
          <div className="text-sm text-text-2">
            <Link href="/agents" className="font-600 text-accent underline">
              Agents
            </Link>{' '}
            / {isEditing ? 'Edit agent' : 'New agent'}
          </div>
          <h1 className="font-serif text-[34px] leading-[37px] font-600 tracking-tight text-text">
            {isEditing ? 'Edit agent' : 'Create an agent'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/agents')}
            className="inline-flex items-center min-h-[44px] px-3 text-[15px] font-600 text-text-2"
          >
            Cancel
          </button>
          {!isEditing && (
            <button
              type="button"
              onClick={submitAs('draft')}
              disabled={!canSubmit}
              className="min-h-[44px] px-5 rounded-[10px] border border-[#C9C1AE] bg-[#FBF9F4] text-[15px] font-600 text-text disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Save draft
            </button>
          )}
          <button
            type="submit"
            disabled={!canSubmit}
            className="min-h-[44px] px-[22px] rounded-[10px] border text-[15px] font-600 border-accent bg-accent text-white disabled:border-[#C9C1AE] disabled:bg-[#E4DFD2] disabled:text-text-2 disabled:cursor-not-allowed"
          >
            {isEditing ? 'Save changes' : 'Create agent'}
          </button>
        </div>
      </header>

      <div className="flex gap-8 px-10 pt-8 pb-10 items-start">
        <div className="flex-1 min-w-0 flex flex-col gap-7">
          {error && (
            <div role="alert" className="rounded-[10px] border border-[#9B2C1F] bg-white px-4 py-3 text-sm text-[#9B2C1F]">
              {error}
            </div>
          )}

          {/* 1 Basics */}
          <section className={sectionCls}>
            <SectionHeader
              n={1}
              title="Basics"
              aside={
                <div className="text-sm text-text-2">
                  <Req /> Required
                </div>
              }
            />
            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className={labelCls}>
                  Agent name <Req />
                </label>
                <input {...register('name')} placeholder="e.g. Policy Assistant" className={inputCls} />
                {errors.name && <p className="text-xs text-[#9B2C1F]">{errors.name.message}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelCls}>
                  Call handle <Req />
                </label>
                <input {...register('handle')} placeholder="policy-assistant" className={inputCls} />
                {errors.handle ? (
                  <p className="text-xs text-[#9B2C1F]">{errors.handle.message}</p>
                ) : (
                  handleValue &&
                  handleAvailable !== null && (
                    <p className={`text-xs ${handleAvailable ? 'text-success' : 'text-[#9B2C1F]'}`}>
                      {handleAvailable ? 'âœ“ Available' : 'âœ— Already in use'}
                    </p>
                  )
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelCls}>
                Agent type <Req />
              </label>
              <select {...register('type')} className={inputCls}>
                <option value="">Select a type</option>
                {AGENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelCls}>Description</label>
              <input {...register('description')} placeholder="What does this agent do?" className={inputCls} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelCls}>
                Instructions <Req />
              </label>
              <textarea
                {...register('instructions')}
                placeholder="Describe the job, the standards or frameworks it works with, and the output it should produce."
                className={`${textareaCls} h-36`}
              />
              {errors.instructions && <p className="text-xs text-[#9B2C1F]">{errors.instructions.message}</p>}
            </div>
          </section>

          {/* 2 How other agents call it */}
          <section className={sectionCls}>
            <SectionHeader n={2} title="How other agents call it" />
            <div className="flex flex-col gap-2">
              <label className={labelCls}>When should other agents call this one?</label>
              <textarea
                {...register('when_to_call')}
                placeholder="e.g. Call when a lesson needs to be aligned to academic standards."
                className={`${textareaCls} h-24`}
              />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className={labelCls}>Input it expects</label>
                <textarea
                  {...register('input_spec')}
                  placeholder="e.g. Lesson text, grade level and target standards set."
                  className={`${textareaCls} h-28`}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelCls}>Output it returns</label>
                <textarea
                  {...register('output_spec')}
                  placeholder="e.g. JSON list of aligned standards with a rationale for each."
                  className={`${textareaCls} h-28`}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className={labelCls}>Who can call this agent</div>
              <Controller
                name="callable_by"
                control={control}
                render={({ field }) => (
                  <div role="group" className="grid grid-cols-3 gap-4">
                    {CALL_OPTIONS.map((o) => {
                      const selected = field.value === o.value
                      return (
                        <button
                          key={o.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => field.onChange(o.value)}
                          className={`flex flex-col gap-1 text-left p-4 rounded-xl border-2 ${
                            selected ? 'border-accent bg-white' : 'border-[#C9C1AE] bg-white'
                          }`}
                        >
                          <span className="text-[15px] font-600 text-text">{o.label}</span>
                          <span className="text-[13px] leading-[18px] text-text-2">{o.note}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              />
            </div>
            <div className="flex flex-col gap-2 max-w-[320px]">
              <label className={labelCls}>Time limit per call (seconds)</label>
              <input
                type="number"
                min={5}
                max={600}
                {...register('timeout_seconds', { valueAsNumber: true })}
                className={inputCls}
              />
            </div>
          </section>

          {/* 3 Model */}
          <section className={sectionCls}>
            <SectionHeader
              n={3}
              title="Model"
              aside={<div className="text-sm text-text-2">You can change this any time</div>}
            />
            <div className="flex flex-col gap-2">
              <label className={labelCls}>
                Choose a model <Req />
              </label>
              <select {...register('model_id')} className={inputCls}>
                <option value="">Select a model</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.display_name}
                    {m.badge ? ` Â· ${m.badge}` : ''}
                  </option>
                ))}
              </select>
              {selectedModel?.note && <div className="text-sm text-text-2">{selectedModel.note}</div>}
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className={labelCls}>Temperature</label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={2}
                  {...register('temperature', { valueAsNumber: true })}
                  className={inputCls}
                />
                <p className="text-xs text-text-2">Lower is more focused, higher is more creative (0â€“2)</p>
              </div>
              <label className="flex items-start gap-3 cursor-pointer pt-7">
                <input type="checkbox" {...register('strict_grounding')} className="w-4 h-4 mt-1" />
                <div>
                  <div className="text-sm font-600 text-text">Strict grounding</div>
                  <div className="text-xs text-text-2">Agent says â€œI donâ€™t knowâ€ instead of guessing</div>
                </div>
              </label>
            </div>
          </section>

          {/* 4 Knowledge */}
          <section className={sectionCls}>
            <SectionHeader n={4} title="Knowledge" />
            <p className="text-[15px] leading-[22px] text-text-2">
              Choose the knowledge bases this agent can draw on.
            </p>
            {knowledgeBases.length === 0 ? (
              <p className="text-sm text-text-2">No knowledge bases available yet.</p>
            ) : (
              <Controller
                name="knowledge_base_ids"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {knowledgeBases.map((kb) => {
                      const checked = field.value?.includes(kb.id) ?? false
                      return (
                        <button
                          key={kb.id}
                          type="button"
                          aria-pressed={checked}
                          onClick={() =>
                            field.onChange(
                              checked ? (field.value ?? []).filter((id) => id !== kb.id) : [...(field.value ?? []), kb.id]
                            )
                          }
                          className={`inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-pill border text-sm font-500 ${
                            checked
                              ? 'bg-accent border-accent text-white'
                              : 'bg-white border-[#C9C1AE] text-text hover:bg-chip'
                          }`}
                        >
                          {checked && <span aria-hidden>âœ“</span>}
                          {kb.name}
                        </button>
                      )
                    })}
                  </div>
                )}
              />
            )}
          </section>
        </div>

        {/* Summary */}
        <aside className="w-[360px] shrink-0 sticky top-8 rounded-2xl bg-[#1F1D18] text-white p-7 flex flex-col gap-5">
          <div>
            <h3 className="font-serif text-2xl font-600 leading-tight">{formValues.name || 'Untitled agent'}</h3>
            <p className="text-[15px] text-[#C9C1AE] mt-1">
              {formValues.handle ? `@${formValues.handle}` : 'No call handle yet'}
            </p>
          </div>
          <div className="border-t border-white/15" />
          {[
            { label: 'Type', value: formValues.type || 'Not set' },
            { label: 'Model', value: selectedModel?.display_name || 'Not set', bold: true },
            { label: 'Called by', value: CALLED_BY_LABEL[formValues.callable_by || 'any'] },
            {
              label: 'Temperature',
              value: Number.isFinite(formValues.temperature) ? Number(formValues.temperature).toFixed(1) : '1.0',
            },
            { label: 'Timeout', value: `${Number.isFinite(formValues.timeout_seconds) ? formValues.timeout_seconds : 60}s` },
          ].map((row) => (
            <div key={row.label}>
              <div className="text-[13px] tracking-[0.06em] uppercase text-[#C9C1AE]">{row.label}</div>
              <div className={`text-base mt-1 ${row.bold ? 'font-600' : ''}`}>{row.value}</div>
            </div>
          ))}
          <div className="border-t border-white/15" />
          <div>
            <div className="flex items-center justify-between text-[13px] tracking-[0.06em] uppercase text-[#C9C1AE]">
              <span>Knowledge</span>
              <span className="normal-case tracking-normal">
                {selectedKbs.length === 1 ? '1 base selected' : `${selectedKbs.length} bases selected`}
              </span>
            </div>
            {selectedKbs.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedKbs.map((kb) => (
                  <span key={kb.id} className="inline-flex items-center h-8 px-3 rounded-pill bg-white/10 text-sm">
                    {kb.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="border-t border-white/15" />
          <div>
            <div className="text-[13px] tracking-[0.06em] uppercase text-[#C9C1AE] mb-3">Required details</div>
            <div className="flex flex-col gap-2.5 text-[15px]">
              {requiredDetails.map((item) => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      item.filled ? 'bg-[#2E9E6B] text-white' : 'bg-white/20'
                    }`}
                  >
                    {item.filled ? 'âœ“' : ''}
                  </span>
                  <span className={item.filled ? 'text-white' : 'text-[#C9C1AE]'}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </form>
  )
}
