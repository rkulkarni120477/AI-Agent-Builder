'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchModels } from '@/lib/api'

export default function ModelsPage() {
  const { data: models = [], isLoading } = useQuery({
    queryKey: ['models'],
    queryFn: fetchModels,
  })

  return (
    <div className="flex flex-col h-screen bg-bg">
      <div className="border-b border-border bg-surface px-8 py-6">
        <div>
          <h1 className="text-2xl font-600 text-text">Models</h1>
          <p className="text-text-3 mt-1">Available AI models for agents</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full border-2 border-border border-t-accent animate-spin mx-auto mb-2" />
              <p className="text-text-3">Loading models...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {models.map((model) => (
              <div key={model.id} className="p-4 rounded-button border border-border bg-surface">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-600 text-text">{model.display_name}</h3>
                    {model.note && <p className="text-text-3 text-sm mt-1">{model.note}</p>}
                    <div className="flex items-center gap-4 mt-3">
                      {model.badge && (
                        <span className="inline-block px-2.5 py-1 rounded-badge bg-accent-soft text-accent text-xs font-500">
                          {model.badge}
                        </span>
                      )}
                      <span className="text-xs text-text-3">
                        Max output: {model.max_tokens?.toLocaleString?.()} tokens
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-3">
                      ${model.input_price_per_1k.toFixed(4)} / 1K input
                    </p>
                    <p className="text-xs text-text-3">
                      ${model.output_price_per_1k.toFixed(4)} / 1K output
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
