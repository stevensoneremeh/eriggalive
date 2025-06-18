"use client"

import React from "react"
import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion"
import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import Mention from "@tiptap/extension-mention"
import { Bold, Italic, Strikethrough, Code, List, ListOrdered, Quote, Link2, Undo, Redo } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { searchUsersForMention } from "@/lib/community-actions" // Assuming this action exists
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Command, CommandList, CommandItem, CommandEmpty } from "@/components/ui/command" // For mention suggestion list
import tippy from "tippy.js"
import "tippy.js/dist/tippy.css"

interface RichTextEditorProps {
  content: string
  onChange: (richText: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
  onMentionQuery?: (query: string) => Promise<Array<{ id: string; label: string; name?: string; avatar?: string }>>
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

// Mention Suggestion List Component
const MentionList = React.forwardRef<
  HTMLDivElement,
  SuggestionProps<{ id: string; label: string; name?: string; avatar?: string }>
>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = React.useState(0)

  const selectItem = (index: number) => {
    const item = props.items[index]
    if (item) {
      props.command({ id: item.id, label: item.label }) // Pass id and label for mention node
    }
  }

  React.useEffect(() => setSelectedIndex(0), [props.items])

  React.useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
        return true
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((selectedIndex + 1) % props.items.length)
        return true
      }
      if (event.key === "Enter") {
        selectItem(selectedIndex)
        return true
      }
      return false
    },
  }))

  if (props.items.length === 0) {
    return null
  }

  return (
    <Command ref={ref} className="rounded-md border bg-popover text-popover-foreground shadow-md w-64 z-50">
      <CommandList>
        {props.items.length ? (
          props.items.map((item, index) => (
            <CommandItem
              key={item.id}
              value={item.label}
              onSelect={() => selectItem(index)}
              className={cn(
                "flex items-center gap-2 p-2 cursor-pointer",
                index === selectedIndex ? "bg-accent text-accent-foreground" : "",
              )}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={item.avatar || "/placeholder-user.jpg"} alt={item.label} />
                <AvatarFallback>{item.label.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-sm">{item.name || item.label}</div>
                <div className="text-xs text-muted-foreground">@{item.label}</div>
              </div>
            </CommandItem>
          ))
        ) : (
          <CommandEmpty>No users found.</CommandEmpty>
        )}
      </CommandList>
    </Command>
  )
})
MentionList.displayName = "MentionList"

const mentionSuggestionOptions: Omit<SuggestionOptions, "editor"> = {
  items: async ({ query }) => {
    // Use the passed onMentionQuery or default to searchUsersForMention
    const users = await searchUsersForMention(query) // This should be passed in or defaulted
    return users.map((user) => ({
      id: user.id, // Typically username or UUID
      label: user.label, // What's inserted into the editor
      name: user.name,
      avatar: user.avatar,
    }))
  },
  render: () => {
    let component: ReactRenderer | null = null
    let popup: any | null = null // tippy instance

    return {
      onStart: (props) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        })

        // @ts-ignore
        popup = tippy("body", {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
        })
      },
      onUpdate(props) {
        component?.updateProps(props)
        popup?.[0].setProps({
          getReferenceClientRect: props.clientRect,
        })
      },
      onKeyDown(props) {
        if (props.event.key === "Escape") {
          popup?.[0].hide()
          return true
        }
        return component?.ref?.onKeyDown(props)
      },
      onExit() {
        popup?.[0].destroy()
        component?.destroy()
      },
    }
  },
  char: "@",
  command: ({ editor, range, props }) => {
    // props contains { id, label } from the selected item
    editor.chain().focus().deleteRange(range).setMention({ id: props.id, label: props.label }).insertContent(" ").run()
  },
  allowSpaces: false,
}

export function RichTextEditor({
  content,
  onChange,
  placeholder,
  editable = true,
  className,
  onMentionQuery = searchUsersForMention, // Default to the imported action
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { HTMLAttributes: { class: "list-disc pl-6" } },
        orderedList: { HTMLAttributes: { class: "list-decimal pl-6" } },
        blockquote: { HTMLAttributes: { class: "border-l-4 border-muted-foreground/30 pl-4 italic" } },
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        HTMLAttributes: {
          class: "text-primary hover:underline cursor-pointer",
          target: "_blank",
          rel: "noopener noreferrer nofollow",
        },
      }),
      Placeholder.configure({ placeholder: placeholder || "Write something..." }),
      Mention.configure({
        HTMLAttributes: {
          class: "text-primary font-medium bg-primary/10 px-1 rounded-sm cursor-pointer",
        },
        suggestion: {
          ...mentionSuggestionOptions,
          items: async ({ query }) => {
            const users = await onMentionQuery(query)
            return users.map((u) => ({ id: u.id, label: u.label, name: u.name, avatar: u.avatar }))
          },
        } as SuggestionOptions<any>, // Cast to any to satisfy tippy.js type issue with SuggestionOptions
        renderLabel({ options, node }) {
          return `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`
        },
      }),
    ],
    content: content,
    editable: editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none p-3 min-h-[100px] border border-input rounded-md bg-transparent shadow-sm",
          className,
          !editable && "border-none p-0 shadow-none bg-transparent",
        ),
      },
    },
  })

  const setLink = () => {
    if (!editor) return
    const previousUrl = editor.getAttributes("link").href
    const url = window.prompt("URL", previousUrl)
    if (url === null) return
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  if (!editor) return null

  return (
    <div className={cn("rounded-md", editable && "border border-input focus-within:ring-1 focus-within:ring-ring")}>
      {editable && (
        <div className="toolbar flex flex-wrap items-center gap-0.5 p-1.5 border-b border-input bg-background rounded-t-md">
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
    </div>
  )
}
