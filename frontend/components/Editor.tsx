'use client'

import { useEditor, EditorContent, type Editor as TiptapEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useState } from 'react'

interface EditorProps {
  value: any
  onChange: (content: any) => void
  onSave?: () => void
  readOnly?: boolean
}

const MENUS = ['File', 'Edit', 'View', 'Insert', 'Format', 'Table', 'Tools', 'Help']

function ToolButton({
  active,
  disabled,
  title,
  onClick,
  children,
}: {
  active?: boolean
  disabled?: boolean
  title: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`h-8 min-w-8 px-2 rounded-md text-sm font-500 disabled:opacity-40 ${
        active ? 'bg-chip text-accent' : 'text-text hover:bg-chip'
      }`}
    >
      {children}
    </button>
  )
}

function nodePath(editor: TiptapEditor) {
  const { $from } = editor.state.selection
  const parts: string[] = []
  for (let d = 1; d <= $from.depth; d++) parts.push($from.node(d).type.name)
  const map: Record<string, string> = {
    paragraph: 'p',
    heading: 'h',
    bulletList: 'ul',
    orderedList: 'ol',
    listItem: 'li',
    codeBlock: 'code',
    blockquote: 'blockquote',
  }
  return parts.map((p) => map[p] || p).join(' › ')
}

export function Editor({ value, onChange, onSave, readOnly = false }: EditorProps) {
  const [, force] = useState(0)
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    editable: !readOnly,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'ws-doc focus:outline-none min-h-[480px]',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON())
    },
    onSelectionUpdate: () => force((n) => n + 1),
    onTransaction: () => force((n) => n + 1),
  })

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

  if (!editor) return null

  const text = editor.getText()
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const blocksValue = editor.isActive('heading', { level: 1 })
    ? 'h1'
    : editor.isActive('heading', { level: 2 })
      ? 'h2'
      : editor.isActive('heading', { level: 3 })
        ? 'h3'
        : 'p'

  const setBlock = (v: string) => {
    const chain = editor.chain().focus()
    if (v === 'p') chain.setParagraph().run()
    else chain.setHeading({ level: Number(v[1]) as 1 | 2 | 3 }).run()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-4">
        <div className="flex items-center gap-4 px-2 pb-2 text-sm text-text-2">
          {MENUS.map((m) => (
            <span key={m} className="cursor-default hover:text-text">
              {m}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1 flex-wrap rounded-t-lg border border-border bg-[#FBF9F4] px-2 py-1.5">
          <ToolButton title="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
            {"\u21B6"}
          </ToolButton>
          <ToolButton title="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
            {"\u21B7"}
          </ToolButton>
          <div className="w-px h-5 bg-border mx-1" />
          <select
            value={blocksValue}
            onChange={(e) => setBlock(e.target.value)}
            className="h-8 rounded-md border border-border bg-white px-2 text-sm text-text focus:outline-none"
            title="Blocks"
          >
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>
          <div className="w-px h-5 bg-border mx-1" />
          <ToolButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
            <strong>B</strong>
          </ToolButton>
          <ToolButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <em>I</em>
          </ToolButton>
          <ToolButton title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <s>S</s>
          </ToolButton>
          <div className="w-px h-5 bg-border mx-1" />
          <ToolButton title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            {"\u2022"} List
          </ToolButton>
          <ToolButton title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            1. List
          </ToolButton>
          <div className="w-px h-5 bg-border mx-1" />
          <ToolButton title="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            {'</>'}
          </ToolButton>
          <ToolButton title="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            {"\u275D"}
          </ToolButton>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6">
        <div className="border-x border-border bg-[#FBF9F4] px-10 py-8 min-h-full">
          <EditorContent editor={editor} />
        </div>
      </div>

      <div className="mx-6 mb-4 flex items-center justify-between rounded-b-lg border border-border bg-[#FBF9F4] px-4 py-1.5 text-xs text-text-3">
        <span>{nodePath(editor)}</span>
        <span>
          {words} words · {text.length} characters
        </span>
      </div>
    </div>
  )
}
