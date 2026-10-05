'use client'

export default function ModelsPage() {
  return (
    <div className="flex flex-col h-screen bg-bg">
      <div className="border-b border-border bg-surface px-8 py-6">
        <div>
          <h1 className="text-2xl font-600 text-text">Models</h1>
          <p className="text-text-3 mt-1">Available AI models</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-text-3">Model management will be available in a future phase</p>
      </div>
    </div>
  )
}
