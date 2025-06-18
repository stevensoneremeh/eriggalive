"use client"

import type React from "react"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { Bold, Italic, Strikethrough, Code, List, ListOrdered, Quote, Link2, Undo, Redo } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  content: string
  onChange: (richText: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
}

const ToolbarButton = ({
  onClick,
  isActive,
  children,
  title,
}: { onClick: () => void; isActive?: boolean; children: React.ReactNode; title: string }) => (
  <Button
    type="button"
    variant="ghost"
    size="icon"
    onClick={onClick}
    className={cn("h-8 w-8 p-1.5", isActive ? "bg-muted text-primary" : "text-muted-foreground hover:text-foreground")}
    title={title}
  >
    {children}
  </Button>
)

export function RichTextEditor({ content, onChange, placeholder, editable = true, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] }, // Configure heading levels if needed
        bulletList: { HTMLAttributes: { class: "list-disc pl-6" } },
        orderedList: { HTMLAttributes: { class: "list-decimal pl-6" } },
        blockquote: { HTMLAttributes: { class: "border-l-4 border-muted-foreground/30 pl-4 italic" } },
      }),
      Link.configure({
        openOnClick: false, // Open links in new tab by default, or handle click
        autolink: true,
        HTMLAttributes: { class: "text-primary hover:underline cursor-pointer" },
      }),
      Placeholder.configure({ placeholder: placeholder || "Write something..." }),
    ],
    content: content,
    editable: editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none p-3 min-h-[120px] border border-input rounded-md bg-transparent shadow-sm",
          className,
          !editable && "border-none p-0 shadow-none",
        ),
      },
    },
  })

  const setLink = () => {
    if (!editor) return
    const previousUrl = editor.getAttributes("link").href
    const url = window.prompt("URL", previousUrl)
    if (url === null) return // Cancelled
    if (url === "") {
      // Unset link
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  if (!editor) {
    return null
  }

  return (
    <div className={cn("rounded-md", editable && "border border-input focus-within:ring-1 focus-within:ring-ring")}>
      {editable && (
        <div className="toolbar flex flex-wrap items-center gap-1 p-2 border-b border-input bg-background rounded-t-md">
          <ToolbarButton
            title="Bold"
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
          >
            <Bold size={18} />
          </ToolbarButton>
          <ToolbarButton
            title="Italic"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
          >
            <Italic size={18} />
          </ToolbarButton>
          <ToolbarButton
            title="Strike"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
          >
            <Strikethrough size={18} />
          </ToolbarButton>
          <ToolbarButton
            title="Code"
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive("code")}
          >
            <Code size={18} />
          </ToolbarButton>
          <ToolbarButton
            title="Bullet List"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
          >
            <List size={18} />
          </ToolbarButton>
          <ToolbarButton
            title="Ordered List"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
          >
            <ListOrdered size={18} />
          </ToolbarButton>
          <ToolbarButton
            title="Blockquote"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
          >
            <Quote size={18} />
          </ToolbarButton>
          <ToolbarButton title="Link" onClick={setLink} isActive={editor.isActive("link")}>
            <Link2 size={18} />
          </ToolbarButton>
          <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()}>
            <Undo size={18} />
          </ToolbarButton>
          <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()}>
            <Redo size={18} />
          </ToolbarButton>
        </div>
      )}
      <EditorContent editor={editor} />
      {/* Example BubbleMenu for inline formatting options */}
      {/* <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className="bg-background border border-input rounded-md shadow-xl p-1 flex gap-1">
        <ToolbarButton title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")}><Bold size={18} /></ToolbarButton>
        <ToolbarButton title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")}><Italic size={18} /></ToolbarButton>
        <ToolbarButton title="Link" onClick={setLink} isActive={editor.isActive("link")}><Link2 size={18} /></ToolbarButton>
      </BubbleMenu> */}
    </div>
  )
}
