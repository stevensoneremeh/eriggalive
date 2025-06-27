"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useOrganization } from "@clerk/nextjs"
import { createPost } from "@/lib/actions/community"

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  content: z.string().min(10, {
    message: "Content must be at least 10 characters.",
  }),
  communityId: z.string().min(1, {
    message: "Community ID is required.",
  }),
})

function CreatePostForm() {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const { organization } = useOrganization()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      communityId: organization?.id || "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await createPost({
        title: values.title,
        content: values.content,
        communityId: values.communityId,
        authorId: organization?.id || "",
        path: pathname,
      })

      router.push(`/community/${organization?.id}`)
      router.refresh()

      toast({
        title: "Post created successfully!",
      })
    } catch (error) {
      console.error("Error creating post:", error)
      toast({
        title: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!isMounted) {
    return null
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full flex-col gap-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter post title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter post content" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="communityId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Community</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a community" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={organization?.id || ""}>{organization?.name || "Current Community"}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Create Post</Button>
      </form>
    </Form>
  )
}

export default CreatePostForm
export { CreatePostForm }
