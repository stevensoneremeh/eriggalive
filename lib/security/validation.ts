import { z } from "zod"

// Ticket purchase validation schema
export const ticketPurchaseSchema = z.object({
  eventId: z.string().uuid("Invalid event ID"),
  quantity: z.number().min(1, "Quantity must be at least 1").max(10, "Maximum 10 tickets per purchase"),
  paymentMethod: z.enum(["paystack", "coins"], {
    required_error: "Payment method is required",
  }),
  totalAmount: z.number().positive("Total amount must be positive"),
  userEmail: z.string().email("Invalid email address"),
  userName: z.string().min(2, "Name must be at least 2 characters"),
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
