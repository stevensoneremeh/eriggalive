"use server"

import { auth } from "@/auth"
import { db } from "@/db"
import { redirect } from "next/navigation"
import { z } from "zod"

/* --------- utility ------------------------------------------------------- */
async function revalidateRoot() {
  const { revalidatePath } = await import("next/cache")
  revalidatePath("/")
}

/* --------- community CRUD for admins/moderators -------------------------- */
const nameSchema = z.object({ name: z.string().min(3).max(255) })

export async function createCommunity(formData: FormData) {
  const session = await auth()
  if (!session?.user) redirect("/auth/signin")

  const parsed = nameSchema.safeParse({ name: formData.get("name") })
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  try {
    await db.community.create({ data: { name: parsed.data.name, creatorId: session.user.id } })
    await revalidateRoot()
    redirect("/")
  } catch (e: any) {
    if (e.code === "P2002") return { errors: { name: ["Community name already taken."] } }
    return { message: "Failed to create community." }
  }
}

export async function updateCommunity(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) redirect("/auth/signin")

  const parsed = nameSchema.safeParse({ name: formData.get("name") })
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  try {
    await db.community.update({
      where: { id, creatorId: session.user.id },
      data: { name: parsed.data.name },
    })
    await revalidateRoot()
    redirect("/")
  } catch (e: any) {
    if (e.code === "P2002") return { errors: { name: ["Community name already taken."] } }
    return { message: "Failed to update community." }
  }
}

export async function deleteCommunity(id: string) {
  const session = await auth()
  if (!session?.user) redirect("/auth/signin")

  try {
    await db.community.delete({ where: { id, creatorId: session.user.id } })
    await revalidateRoot()
    redirect("/")
  } catch (e: any) {
    return { message: "Failed to delete community." }
  }
}

/* --------- Re-export main post actions so older imports keep working ------ */
export {
  createCommunityPostAction as createPost,
  voteOnPostAction as voteOnPost,
  bookmarkPost,
  createCommunityPostAction,
  voteOnPostAction,
  bookmarkPost as bookmarkPostAction,
  fetchCommunityPosts,
} from "./community-actions-final-fix"
