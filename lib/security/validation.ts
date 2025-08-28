import { z } from "zod"
import crypto from "crypto"

// Ticket purchase validation schema
export const ticketPurchaseSchema = z.object({
  eventId: z.string().uuid("Invalid event ID"),
  quantity: z.number().min(1, "Quantity must be at least 1").max(10, "Maximum 10 tickets per purchase"),
  paymentMethod: z.enum(["paystack", "coins", "free"], {
    required_error: "Payment method is required",
  }),
  paymentReference: z.string().optional(),
  amount: z.number().optional(),
  ticketType: z.string().optional(),
  surveyData: z.any().optional(),
})

// Membership purchase validation schema
export const membershipPurchaseSchema = z.object({
  tier: z.enum(["pro", "enterprise"], {
    required_error: "Membership tier is required",
  }),
  paymentMethod: z.enum(["paystack", "coins"]),
  amount: z.number().positive("Amount must be positive"),
})

// QR validation schema
export const qrValidationSchema = z.object({
  qrData: z.string().min(1, "QR data is required"),
  eventId: z.string().uuid("Invalid event ID").optional(),
  scanLocation: z.string().optional(),
})

// Event creation schema
export const eventCreationSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  eventDate: z.string().datetime("Invalid date format"),
  venue: z.string().min(3, "Venue must be at least 3 characters"),
  ticketPrice: z.number().positive("Ticket price must be positive"),
  maxAttendees: z.number().positive("Max attendees must be positive"),
  category: z.string().min(1, "Category is required"),
})

// Rate limiting configuration
export const rateLimits = {
  ticketPurchase: { requests: 5, window: 60000 }, // 5 requests per minute
  qrValidation: { requests: 100, window: 60000 }, // 100 scans per minute
  membershipPurchase: { requests: 3, window: 300000 }, // 3 requests per 5 minutes
  walletOperations: { requests: 10, window: 60000 }, // 10 requests per minute
}

export const generateSecureToken = (userId: string, eventId: string, ticketNumber: string): string => {
  const timestamp = Date.now()
  const randomBytes = crypto.randomBytes(16).toString("hex")
  const payload = `${userId}:${eventId}:${ticketNumber}:${timestamp}`
  const hash = crypto
    .createHash("sha256")
    .update(payload + randomBytes)
    .digest("hex")
  return `${hash.substring(0, 32)}-${timestamp.toString(36)}-${randomBytes.substring(0, 8)}`
}

export const validateSecureToken = (token: string, userId: string, eventId: string, ticketNumber: string): boolean => {
  try {
    const parts = token.split("-")
    if (parts.length !== 3) return false

    const [hash, timestampHex, randomPart] = parts
    const timestamp = Number.parseInt(timestampHex, 36)

    // Check if token is not too old (24 hours)
    const maxAge = 24 * 60 * 60 * 1000
    if (Date.now() - timestamp > maxAge) return false

    return hash.length === 32 && randomPart.length === 8
  } catch {
    return false
  }
}
