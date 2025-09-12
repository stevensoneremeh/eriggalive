import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("conversationId")

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get internal user ID - try both table structures
    let internalUserId = null
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", user.id)
      .single()

    if (userProfile) {
      internalUserId = userProfile.id
    } else {
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("auth_user_id", user.id)
        .single()
      
      if (userData) {
        internalUserId = userData.id
      }
    }

    if (!internalUserId) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    if (conversationId) {
      // Get messages for specific conversation - try both schemas
      let messages: any[] = []
      
      try {
        const { data: userProfileMessages, error: profileError } = await supabase
          .from("messages")
          .select(`
            *,
            sender:user_profiles!messages_sender_id_fkey(id, username, full_name, avatar_url)
          `)
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true })

        if (userProfileMessages && userProfileMessages.length > 0) {
          messages = userProfileMessages
        } else {
          throw profileError || new Error("No messages with user_profiles")
        }
      } catch (userProfileError) {
        const { data: userMessages, error: userError } = await supabase
          .from("messages")
          .select(`
            *,
            sender:users!messages_sender_id_fkey(id, username, full_name, avatar_url)
          `)
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true })

        if (userError) {
          console.error("Error fetching messages:", userError)
          return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
        }
        messages = userMessages || []
      }

      return NextResponse.json({ success: true, messages })
    } else {
      // Get conversations for user via participants table
      const { data: conversations, error: conversationsError } = await supabase
        .from("conversation_participants")
        .select(`
          conversation_id,
          conversations!inner(*, last_message:messages(content, created_at))
        `)
        .eq("user_id", internalUserId)
        .order("conversations.updated_at", { ascending: false })

      if (conversationsError) {
        console.error("Error fetching conversations:", conversationsError)
        return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
      }

      // Flatten conversation data
      const flatConversations = (conversations || []).map(item => item.conversations)
      return NextResponse.json({ success: true, conversations: flatConversations })
    }
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { conversationId, content, recipientId } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 })
    }

    // Get user profile
    let userProfile = null
    const { data: userProfileData } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", user.id)
      .single()
    
    if (userProfileData) {
      userProfile = userProfileData
    } else {
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("auth_user_id", user.id)
        .single()
      
      if (userData) {
        userProfile = userData
      }
    }

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    let finalConversationId = conversationId

    // If no conversation ID, create new conversation with recipient
    if (!finalConversationId && recipientId) {
      const { data: newConversation, error: conversationError } = await supabase
        .from("conversations")
        .insert({
          type: "direct",
          title: "Direct Message",
          created_by: userProfile.id,
        })
        .select("id")
        .single()

      if (conversationError) {
        console.error("Error creating conversation:", conversationError)
        return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
      }

      finalConversationId = newConversation.id

      // Add participants
      await supabase.from("conversation_participants").insert([
        { conversation_id: finalConversationId, user_id: userProfile.id },
        { conversation_id: finalConversationId, user_id: recipientId },
      ])
    }

    // Create message
    const { data: newMessage, error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: finalConversationId,
        sender_id: userProfile.id,
        content: content.trim(),
        message_type: "text",
      })
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, username, full_name, avatar_url)
      `)
      .single()

    if (messageError) {
      console.error("Error creating message:", messageError)
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }

    // Update conversation timestamp
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", finalConversationId)

    return NextResponse.json({ success: true, message: newMessage })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}