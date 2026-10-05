'use client'

import { useEditor, EditorContent, type Editor as TiptapEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useState } from 'react'

interface EditorProps {
  value: any
  onChange: (content: any) => void
  onSave?: () => void
  onContextChange?: (ctx: { selection: string; doc: string }) => void
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

function MenuDropdown({
  title,
  items,
  isOpen,
  onToggle,
  onSelect,
}: {
  title: string
  items: { label: string; action: () => void; divider?: boolean }[]
  isOpen: boolean
  onToggle: () => void
  onSelect?: () => void
}) {
  return (
    <div className="relative" data-menu-container>
      <button
        onClick={onToggle}
        className={`cursor-default text-sm ${
          isOpen ? 'text-text border-b-2 border-accent' : 'text-text-2 hover:text-text'
        }`}
      >
        {title}
      </button>
      {isOpen && (
        <div className="absolute left-0 mt-1 w-48 rounded-lg border border-border bg-white shadow-lg z-50 py-1" data-menu-container>
          {items.map((item, idx) => (
            <div key={idx}>
              {item.divider ? (
                <div className="h-px bg-border my-1" />
              ) : (
                <button
                  onClick={() => {
                    item.action()
                    onSelect?.()
                  }}
                  className="w-full text-left px-4 py-1.5 text-sm text-text hover:bg-chip"
                >
                  {item.label}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function Editor({ value, onChange, onSave, onContextChange, readOnly = false }: EditorProps) {
  const [, force] = useState(0)
  const [showAbout, setShowAbout] = useState(false)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  const toggleMenu = (menuName: string) => {
    setActiveMenu(activeMenu === menuName ? null : menuName)
  }

  const closeMenus = () => {
    setActiveMenu(null)
  }

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
    onSelectionUpdate: ({ editor }) => {
      force((n) => n + 1)
      reportContext(editor)
    },
    onTransaction: () => force((n) => n + 1),
  })

  function reportContext(ed: TiptapEditor) {
    if (!onContextChange) return
    const { from, to, empty } = ed.state.selection
    const selection = empty ? '' : ed.state.doc.textBetween(from, to, '\n').trim()
    onContextChange({ selection, doc: ed.getText() })
  }

  useEffect(() => {
    if (editor) reportContext(editor)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, value])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        onSave?.()
      }
      if (e.key === 'Escape') {
        closeMenus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onSave])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-menu-container]')) {
        closeMenus()
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

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

  const fileMenuItems = [
    { label: 'New document', action: () => window.location.href = '/workspace/new' },
    { label: 'Print', action: () => window.print(), divider: false },
  ]

  const editMenuItems = [
    { label: 'Undo', action: () => editor.chain().focus().undo().run() },
    { label: 'Redo', action: () => editor.chain().focus().redo().run() },
    { divider: true },
    { label: 'Cut', action: () => document.execCommand('cut') },
    { label: 'Copy', action: () => document.execCommand('copy') },
    { divider: true },
    { label: 'Select all', action: () => editor.chain().focus().selectAll().run() },
    { label: 'Find and replace', action: () => alert('Find and replace') },
  ]

  const viewMenuItems = [
    { label: 'Source code', action: () => alert('Source code view') },
    { label: 'Preview', action: () => alert('Preview mode') },
    { label: 'Show blocks', action: () => alert('Show blocks') },
    { label: 'Fullscreen', action: () => document.documentElement.requestFullscreen?.() },
    { divider: true },
    { label: 'Word count', action: () => alert(`Words: ${text.trim() ? text.trim().split(/\s+/).length : 0}`) },
  ]

  const insertMenuItems = [
    { label: 'Link', action: () => alert('Insert link') },
    { label: 'Image', action: () => alert('Insert image') },
    { label: 'Table', action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
    { label: 'Horizontal line', action: () => editor.chain().focus().setHorizontalRule().run() },
    { label: 'Page break', action: () => alert('Insert page break') },
    { label: 'Blockquote', action: () => editor.chain().focus().toggleBlockquote().run() },
    { label: 'Code block', action: () => editor.chain().focus().toggleCodeBlock().run() },
    { label: 'Accordion', action: () => alert('Insert accordion') },
    { label: 'Special character', action: () => alert('Insert special character') },
  ]

  const formatMenuItems = [
    { label: 'Bold', action: () => editor.chain().focus().toggleBold().run() },
    { label: 'Italic', action: () => editor.chain().focus().toggleItalic().run() },
    { label: 'Underline', action: () => alert('Underline (implement via extension)') },
    { label: 'Strikethrough', action: () => editor.chain().focus().toggleStrike().run() },
    { divider: true },
    { label: 'Heading 1', action: () => editor.chain().focus().setHeading({ level: 1 }).run() },
    { label: 'Heading 2', action: () => editor.chain().focus().setHeading({ level: 2 }).run() },
    { label: 'Heading 3', action: () => editor.chain().focus().setHeading({ level: 3 }).run() },
    { label: 'Paragraph', action: () => editor.chain().focus().setParagraph().run() },
    { divider: true },
    { label: 'Clear formatting', action: () => editor.chain().focus().clearNodes().run() },
  ]

  const tableMenuItems = [
    { label: 'Insert table', action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
    { label: 'Row above', action: () => editor.chain().focus().addRowBefore().run() },
    { label: 'Row below', action: () => editor.chain().focus().addRowAfter().run() },
    { label: 'Column left', action: () => editor.chain().focus().addColBefore().run() },
    { label: 'Column right', action: () => editor.chain().focus().addColAfter().run() },
    { divider: true },
    { label: 'Delete row', action: () => editor.chain().focus().deleteRow().run() },
    { label: 'Delete column', action: () => editor.chain().focus().deleteColumn().run() },
    { label: 'Delete table', action: () => editor.chain().focus().deleteTable().run() },
  ]

  const toolsMenuItems = [
    { label: 'Word count', action: () => alert(`Words: ${text.trim() ? text.trim().split(/\s+/).length : 0}`) },
    { label: 'Source code', action: () => alert('Source code view') },
    { label: 'Accessibility check', action: () => alert('Accessibility check') },
  ]

  const helpMenuItems = [
    { label: 'Keyboard shortcuts', action: () => alert('Keyboard shortcuts') },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-4">
        <div className="flex items-center gap-4 px-2 pb-2">
          <MenuDropdown title="File" items={fileMenuItems} isOpen={activeMenu === 'File'} onToggle={() => toggleMenu('File')} onSelect={closeMenus} />
          <MenuDropdown title="Edit" items={editMenuItems} isOpen={activeMenu === 'Edit'} onToggle={() => toggleMenu('Edit')} onSelect={closeMenus} />
          <MenuDropdown title="View" items={viewMenuItems} isOpen={activeMenu === 'View'} onToggle={() => toggleMenu('View')} onSelect={closeMenus} />
          <MenuDropdown title="Insert" items={insertMenuItems} isOpen={activeMenu === 'Insert'} onToggle={() => toggleMenu('Insert')} onSelect={closeMenus} />
          <MenuDropdown title="Format" items={formatMenuItems} isOpen={activeMenu === 'Format'} onToggle={() => toggleMenu('Format')} onSelect={closeMenus} />
          <MenuDropdown title="Table" items={tableMenuItems} isOpen={activeMenu === 'Table'} onToggle={() => toggleMenu('Table')} onSelect={closeMenus} />
          <MenuDropdown title="Tools" items={toolsMenuItems} isOpen={activeMenu === 'Tools'} onToggle={() => toggleMenu('Tools')} onSelect={closeMenus} />
          <MenuDropdown title="Help" items={helpMenuItems} isOpen={activeMenu === 'Help'} onToggle={() => toggleMenu('Help')} onSelect={closeMenus} />
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
