"use client"

import { useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createCommunityPostAction } from "@/lib/community-actions" // Updated import
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import type { CommunityCategory } from "@/types/database"

const formSchema = z
  .object({
    content: z.string().min(1, { message: "Content cannot be empty unless media is provided." }).max(5000).optional(),
    categoryId: z.string().min(1, { message: "Please select a category." }),
    mediaFile: z.custom<FileList>((val) => val instanceof FileList, "Please upload a file.").optional(),
  })
  .refine((data) => data.content || data.mediaFile?.[0], {
    message: "Either content or a media file must be provided.",
    path: ["content"], // Show error on content field or a general form error
  })

interface CreatePostFormProps {
  categories: CommunityCategory[]
  onPostCreated?: (newPost: any) => void // Callback after successful post creation
}

export function CreatePostFormFinal({ categories, onPostCreated }: CreatePostFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
      categoryId: "",
      mediaFile: undefined,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    const formData = new FormData()
    if (values.content) formData.append("content", values.content)
    formData.append("categoryId", values.categoryId)
    if (values.mediaFile && values.mediaFile[0]) {
      formData.append("mediaFile", values.mediaFile[0])
    }

    if (!values.content && (!values.mediaFile || !values.mediaFile[0])) {
      toast({
        title: "Cannot create empty post",
        description: "Please provide some content or upload a media file.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    const result = await createCommunityPostAction(formData)
    setIsSubmitting(false)

    if (result.success) {
      toast({
        title: "Post created successfully!",
      })
      form.reset()
      if (fileInputRef.current) {
        fileInputRef.current.value = "" // Clear file input
      }
      if (onPostCreated && result.post) {
        onPostCreated(result.post)
      } else {
        // Fallback to router.refresh() if no callback, or if you want to ensure full page data refresh
        router.refresh() // Or revalidatePath can be called from server action
      }
    } else {
      toast({
        title: "Something went wrong!",
        description: result.error || "Failed to create post.",
        variant: "destructive",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4 border rounded-lg bg-card">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What's on your mind?</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Share your thoughts, bars, or stories..."
                  className="resize-none min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mediaFile"
            render={({ field: { onChange, value, ...restField } }) => (
              <FormItem>
                <FormLabel>Upload Media (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept="image/*,audio/*,video/*"
                    onChange={(event) => {
                      onChange(event.target.files)
                    }}
                    ref={fileInputRef}
                    className="pt-[5px]" // Minor style adjustment for file input
                    {...restField}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Posting..." : "Create Post"}
        </Button>
      </form>
    </Form>
  )
}
