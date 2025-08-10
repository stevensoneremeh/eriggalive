import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { Webhook } from "svix"
import { createClient } from "@/lib/supabase/server"

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    throw new Error("Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local")
  }

  // Get the headers
  const headerPayload = headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(webhookSecret)

  let evt: any

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    })
  } catch (err) {
    console.error("Error verifying webhook:", err)
    return new Response("Error occured", {
      status: 400,
    })
  }

  // Handle the webhook
  const eventType = evt.type
  const supabase = await createClient()

  if (eventType === "user.created") {
    const { id, email_addresses, username, first_name, last_name } = evt.data

    try {
      const { error } = await supabase.from("users").insert({
        auth_user_id: id,
        username: username || email_addresses[0]?.email_address.split("@")[0] || "user",
        full_name: `${first_name || ""} ${last_name || ""}`.trim() || "",
        email: email_addresses[0]?.email_address || "",
        tier: "grassroot",
        coins: 0,
        level: 1,
        points: 0,
        is_verified: false,
        is_active: true,
        is_banned: false,
      })

      if (error) {
        console.error("Error creating user in Supabase:", error)
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
      }

      console.log("User created successfully in Supabase:", id)
    } catch (error) {
      console.error("Error in user.created webhook:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  }

  if (eventType === "user.updated") {
    const { id, email_addresses, username, first_name, last_name } = evt.data

    try {
      const { error } = await supabase
        .from("users")
        .update({
          username: username || email_addresses[0]?.email_address.split("@")[0] || "user",
          full_name: `${first_name || ""} ${last_name || ""}`.trim() || "",
          email: email_addresses[0]?.email_address || "",
        })
        .eq("auth_user_id", id)

      if (error) {
        console.error("Error updating user in Supabase:", error)
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
      }

      console.log("User updated successfully in Supabase:", id)
    } catch (error) {
      console.error("Error in user.updated webhook:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data

    try {
      const { error } = await supabase.from("users").delete().eq("auth_user_id", id)

      if (error) {
        console.error("Error deleting user from Supabase:", error)
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
      }

      console.log("User deleted successfully from Supabase:", id)
    } catch (error) {
      console.error("Error in user.deleted webhook:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  }

  return NextResponse.json({ message: "Webhook processed successfully" })
}
