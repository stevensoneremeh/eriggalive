// lib/community-actions-ultra-safe.ts

import { auth } from "@/auth"
import { db } from "@/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

const CreateCommunitySchema = z.object({
  name: z.string().min(3).max(255),
})

export async function createCommunity(formData: FormData) {
  const session = await auth()

  if (!session?.user) {
    return redirect("/auth/signin")
  }

  const result = CreateCommunitySchema.safeParse({
    name: formData.get("name"),
  })

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors }
  }

  try {
    await db.community.create({
      data: {
        name: result.data.name,
        creatorId: session.user.id,
      },
    })
  } catch (e: any) {
    if (e.code === "P2002") {
      return { errors: { name: ["Community name already taken."] } }
    }
    return { message: "Failed to create community." }
  }

  revalidatePath("/")
  redirect("/")
}

const UpdateCommunitySchema = z.object({
  name: z.string().min(3).max(255),
})

export async function updateCommunity(id: string, formData: FormData) {
  const session = await auth()

  if (!session?.user) {
    return redirect("/auth/signin")
  }

  const result = UpdateCommunitySchema.safeParse({
    name: formData.get("name"),
  })

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors }
  }

  try {
    await db.community.update({
      where: {
        id,
        creatorId: session.user.id,
      },
      data: {
        name: result.data.name,
      },
    })
  } catch (e: any) {
    if (e.code === "P2002") {
      return { errors: { name: ["Community name already taken."] } }
    }
    return { message: "Failed to update community." }
  }

  revalidatePath("/")
  redirect("/")
}

export async function deleteCommunity(id: string) {
  const session = await auth()

  if (!session?.user) {
    return redirect("/auth/signin")
  }

  try {
    await db.community.delete({
      where: {
        id,
        creatorId: session.user.id,
      },
    })
  } catch (e: any) {
    return { message: "Failed to delete community." }
  }

  revalidatePath("/")
  redirect("/")
}
