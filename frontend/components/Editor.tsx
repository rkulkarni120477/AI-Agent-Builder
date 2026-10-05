'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useCallback, useEffect } from 'react'

interface EditorProps {
  value: string
  onChange: (content: string) => void
  onSave?: () => void
  readOnly?: boolean
}

export function Editor({ value, onChange, onSave, readOnly = false }: EditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '<p>Start typing...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON())
    },
  })

  // Handle external value changes
  useEffect(() => {
    if (editor && value && editor.getJSON() !== value) {
      editor.commands.setContent(value)
    }
  }, [editor, value])

  // Handle save on Cmd/Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        onSave?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onSave])

  if (!editor) {
    return null
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="border-b border-border bg-surface px-4 py-3 flex items-center gap-1 flex-wrap">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`px-2 py-1 rounded-button text-sm font-500 ${
            editor.isActive('bold')
              ? 'bg-accent text-white'
              : 'text-text hover:bg-panel'
          }`}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`px-2 py-1 rounded-button text-sm font-500 ${
            editor.isActive('italic')
              ? 'bg-accent text-white'
              : 'text-text hover:bg-panel'
          }`}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`px-2 py-1 rounded-button text-sm font-500 ${
            editor.isActive('strike')
              ? 'bg-accent text-white'
              : 'text-text hover:bg-panel'
          }`}
          title="Strike"
        >
          <s>S</s>
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2 py-1 rounded-button text-sm font-500 ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-accent text-white'
              : 'text-text hover:bg-panel'
          }`}
          title="Heading 1"
        >
          H1
        </button>

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 rounded-button text-sm font-500 ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-accent text-white'
              : 'text-text hover:bg-panel'
          }`}
          title="Heading 2"
        >
          H2
        </button>

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 rounded-button text-sm font-500 ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-accent text-white'
              : 'text-text hover:bg-panel'
          }`}
          title="Heading 3"
        >
          H3
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 rounded-button text-sm font-500 ${
            editor.isActive('bulletList')
              ? 'bg-accent text-white'
              : 'text-text hover:bg-panel'
          }`}
          title="Bullet list"
        >
          •
        </button>

        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 rounded-button text-sm font-500 ${
            editor.isActive('orderedList')
              ? 'bg-accent text-white'
              : 'text-text hover:bg-panel'
          }`}
          title="Ordered list"
        >
          1.
        </button>

        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`px-2 py-1 rounded-button text-sm font-500 ${
            editor.isActive('codeBlock')
              ? 'bg-accent text-white'
              : 'text-text hover:bg-panel'
          }`}
          title="Code block"
        >
          &lt;&gt;
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="px-2 py-1 rounded-button text-sm font-500 text-text hover:bg-panel disabled:opacity-50"
          title="Undo"
        >
          ↶
        </button>

        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="px-2 py-1 rounded-button text-sm font-500 text-text hover:bg-panel disabled:opacity-50"
          title="Redo"
        >
          ↷
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-4xl mx-auto">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}
