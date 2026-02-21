import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Smile } from 'lucide-react'

// ── Emoji Picker ─────────────────────────────────────────────────────────────
const EMOJI_GROUPS = [
  { label: 'נפוצים', emojis: ['👍', '✅', '❌', '⚠️', '📌', '🔴', '🟡', '🟢', '💡', '📞', '📅', '🎯', '🚀', '💼', '🤝'] },
  { label: 'רגשות', emojis: ['😊', '😀', '🙏', '🎉', '👏', '😔', '😅', '🤔', '💪', '❤️'] },
]

function EmojiPicker({ onSelect, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute z-50 bg-white rounded-xl shadow-card-hover border border-sh-pink-light p-3 w-64"
      style={{ top: '100%', right: 0, marginTop: 4 }}
    >
      {EMOJI_GROUPS.map(group => (
        <div key={group.label} className="mb-2">
          <div className="text-[10px] text-sh-text-light mb-1">{group.label}</div>
          <div className="flex flex-wrap gap-1">
            {group.emojis.map(e => (
              <button
                key={e}
                type="button"
                onMouseDown={ev => { ev.preventDefault(); onSelect(e) }}
                className="text-lg hover:bg-sh-pink-light/40 rounded p-0.5 transition-colors"
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Toolbar Button ────────────────────────────────────────────────────────────
function ToolBtn({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
        active
          ? 'bg-sh-pink-light text-sh-pink'
          : 'text-sh-text-muted hover:bg-sh-bg hover:text-sh-text'
      }`}
    >
      {children}
    </button>
  )
}

// ── RichTextEditor ────────────────────────────────────────────────────────────
export default function RichTextEditor({ value, onChange, placeholder }) {
  const [showEmoji, setShowEmoji] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
    ],
    content: value || '',
    editorProps: {
      attributes: {
        dir: 'rtl',
        class: 'outline-none min-h-[80px] text-sm text-sh-text leading-relaxed px-3 py-2',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
  })

  // Sync external value reset (e.g. switching companies)
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (value !== current) {
      editor.commands.setContent(value || '', false)
    }
  }, [value, editor])

  const insertEmoji = useCallback((emoji) => {
    if (!editor) return
    editor.chain().focus().insertContent(emoji).run()
    setShowEmoji(false)
  }, [editor])

  if (!editor) return null

  return (
    <div className="border border-sh-pink-light rounded-xl overflow-hidden bg-white focus-within:border-sh-pink transition-colors">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-sh-pink-light/60 bg-sh-bg/40">
        <div className="relative ml-auto">
          <ToolBtn onClick={() => setShowEmoji(v => !v)} active={showEmoji} title="אמוג'י">
            <Smile size={14} />
          </ToolBtn>
          {showEmoji && <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />}
        </div>

        <div className="w-px h-4 bg-sh-pink-light/60 mx-1" />

        <ToolBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="רשימה ממוספרת"
        >
          <ListOrdered size={14} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="רשימת נקודות"
        >
          <List size={14} />
        </ToolBtn>

        <div className="w-px h-4 bg-sh-pink-light/60 mx-1" />

        <ToolBtn
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="קו תחתון"
        >
          <UnderlineIcon size={14} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="נטוי"
        >
          <Italic size={14} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="מודגש"
        >
          <Bold size={14} />
        </ToolBtn>
      </div>

      {/* Editor area */}
      <div className="relative">
        {!editor.getText() && placeholder && (
          <div className="absolute top-2 right-3 text-sm text-sh-text-light pointer-events-none select-none">
            {placeholder}
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
