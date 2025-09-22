"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Smile } from "lucide-react"
import { ALLOWED_EMOJIS } from "@/utils/content-validation"

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  disabled?: boolean
}

export function EmojiPicker({ onEmojiSelect, disabled = false }: EmojiPickerProps) {
  const [open, setOpen] = useState(false)

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji)
    setOpen(false)
  }

  // Group emojis by categories
  const emojiCategories = [
    {
      name: "Smileys & Emotion",
      emojis: ALLOWED_EMOJIS.slice(0, 60)
    },
    {
      name: "Music & Celebration", 
      emojis: ALLOWED_EMOJIS.slice(60)
    }
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-8 w-8 p-0 text-gray-400 hover:text-gray-200"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-gray-800 border-gray-700" 
        align="start"
        side="top"
      >
        <div className="max-h-64 overflow-y-auto">
          {emojiCategories.map((category) => (
            <div key={category.name} className="p-2">
              <h4 className="text-xs font-medium text-gray-400 mb-2">
                {category.name}
              </h4>
              <div className="grid grid-cols-8 gap-1">
                {category.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    className="p-1 text-lg hover:bg-gray-700 rounded transition-colors"
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}