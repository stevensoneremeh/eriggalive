"use client"

import { useState, useTransition, type FormEvent } from "react"
import { createPost } from "@/lib/community-actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { CommunityCategory } from "@/types/database"

interface Props {
  categories: CommunityCategory[]
}
export function CreatePostForm({ categories }: Props) {
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createPost(formData)
      if (!res?.success) setErrorMsg(res.error ?? "Something went wrong")
      else {
        setErrorMsg(null)
        e.currentTarget.reset()
      }
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border p-4 shadow-sm bg-white/80 backdrop-blur">
      <Textarea name="content" placeholder="Share something…" rows={4} required />
      <Select name="categoryId" required>
        <SelectTrigger>
          <SelectValue placeholder="Choose category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((c) => (
            <SelectItem key={c.id} value={String(c.id)}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Posting…" : "Post"}
      </Button>
    </form>
  )
}
