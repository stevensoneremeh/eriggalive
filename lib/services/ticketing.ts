// Server-only ticketing service functions
import { createClient } from "@/lib/supabase/server"
import { createHash, randomBytes } from "crypto"
import type { Event, Ticket, Wallet } from "@/lib/types/ticketing"

export class TicketingService {
  private supabase = createClient()

  // Generate secure QR token
  generateQRToken(): { token: string; hash: string } {
    const token = randomBytes(32).toString("hex")
    const secret = process.env.QR_TOKEN_SIGNING_SECRET!
    const hash = createHash("sha256")
      .update(token + secret)
      .digest("hex")
    return { token, hash }
  }

  // Verify QR token
  verifyQRToken(token: string, hash: string): boolean {
    const secret = process.env.QR_TOKEN_SIGNING_SECRET!
    const expectedHash = createHash("sha256")
      .update(token + secret)
      .digest("hex")
    return hash === expectedHash
  }

  // Get current active event
  async getCurrentEvent(): Promise<Event | null> {
    const { data: settings } = await this.supabase
      .from("settings")
      .select("value_json")
      .eq("key", "current_event_id")
      .single()

    if (!settings?.value_json || settings.value_json === "null") {
      return null
    }

    const eventId = settings.value_json as string
    const { data: event } = await this.supabase
      .from("events_v2")
      .select("*")
      .eq("id", eventId)
      .eq("status", "active")
      .single()

    return event
  }

  // Get event capacity remaining
  async getEventCapacityRemaining(eventId: string): Promise<number> {
    const { data } = await this.supabase.rpc("get_event_capacity_remaining", { p_event_id: eventId })

    return data || 0
  }

  // Create ticket after successful payment
  async createTicket(eventId: string, userId: string, purchaseId: string): Promise<Ticket> {
    const { token, hash } = this.generateQRToken()

    const { data: ticket, error } = await this.supabase
      .from("tickets")
      .insert({
        event_id: eventId,
        user_id: userId,
        purchase_id: purchaseId,
        qr_token_hash: hash,
        status: "unused",
      })
      .select()
      .single()

    if (error) throw error
    return ticket
  }

  // Get user wallet
  async getUserWallet(userId: string): Promise<Wallet> {
    const { data: wallet, error } = await this.supabase.from("wallets").select("*").eq("user_id", userId).single()

    if (error && error.code === "PGRST116") {
      // Wallet doesn't exist, create it
      const { data: newWallet, error: createError } = await this.supabase
        .from("wallets")
        .insert({ user_id: userId, balance_coins: 0 })
        .select()
        .single()

      if (createError) throw createError
      return newWallet
    }

    if (error) throw error
    return wallet
  }

  // Credit wallet with coins
  async creditWallet(userId: string, amount: number, reason: string, refId?: string): Promise<boolean> {
    const { data, error } = await this.supabase.rpc("credit_wallet", {
      p_user_id: userId,
      p_amount: amount,
      p_reason: reason,
      p_ref_id: refId || null,
    })

    if (error) throw error
    return data
  }

  // Debit wallet with coins
  async debitWallet(userId: string, amount: number, reason: string, refId?: string): Promise<boolean> {
    const { data, error } = await this.supabase.rpc("debit_wallet", {
      p_user_id: userId,
      p_amount: amount,
      p_reason: reason,
      p_ref_id: refId || null,
    })

    if (error) throw error
    return data
  }

  // Admit ticket (for admin scanner)
  async admitTicket(
    ticketId: string,
    adminUserId: string,
    deviceFingerprint?: string,
  ): Promise<{
    success: boolean
    ticket: Ticket | null
    warnings: string[]
  }> {
    const warnings: string[] = []

    // Get ticket with event info
    const { data: ticket, error: ticketError } = await this.supabase
      .from("tickets")
      .select(`
        *,
        event:events_v2(title, venue, starts_at),
        user:auth.users(email)
      `)
      .eq("id", ticketId)
      .single()

    if (ticketError || !ticket) {
      return { success: false, ticket: null, warnings: ["Ticket not found"] }
    }

    // Check if already admitted
    if (ticket.status === "admitted") {
      warnings.push("Ticket already admitted")
      return { success: false, ticket, warnings }
    }

    // Check if ticket is valid
    if (ticket.status !== "unused") {
      warnings.push(`Ticket status is ${ticket.status}`)
      return { success: false, ticket, warnings }
    }

    // Update ticket status
    const { data: updatedTicket, error: updateError } = await this.supabase
      .from("tickets")
      .update({
        status: "admitted",
        admitted_at: new Date().toISOString(),
      })
      .eq("id", ticketId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // Log the scan
    await this.supabase.from("scan_logs").insert({
      ticket_id: ticketId,
      admin_user_id: adminUserId,
      scan_result: "admitted",
      device_fingerprint: deviceFingerprint,
      scanned_at: new Date().toISOString(),
    })

    return { success: true, ticket: updatedTicket, warnings }
  }
}

export const ticketingService = new TicketingService()
