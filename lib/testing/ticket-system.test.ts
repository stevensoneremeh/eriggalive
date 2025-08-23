// Test utilities for the ticketing system
import { describe, it, expect, beforeEach, jest } from "@jest/globals"

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
    update: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  })),
  auth: {
    getUser: jest.fn(() =>
      Promise.resolve({
        data: { user: { id: "test-user-id", email: "test@example.com" } },
        error: null,
      }),
    ),
  },
}

describe("Ticket System Security", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should validate ticket purchase data", async () => {
    const { ticketPurchaseSchema } = await import("../security/validation")

    const validData = {
      eventId: "123e4567-e89b-12d3-a456-426614174000",
      quantity: 2,
      paymentMethod: "paystack" as const,
      totalAmount: 10000,
      userEmail: "test@example.com",
      userName: "Test User",
    }

    const result = ticketPurchaseSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it("should reject invalid ticket purchase data", async () => {
    const { ticketPurchaseSchema } = await import("../security/validation")

    const invalidData = {
      eventId: "invalid-uuid",
      quantity: 0,
      paymentMethod: "invalid" as any,
      totalAmount: -100,
      userEmail: "invalid-email",
      userName: "A",
    }

    const result = ticketPurchaseSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it("should enforce rate limiting", async () => {
    const { withRateLimit } = await import("../security/middleware")

    const identifier = "test-user"

    // First request should be allowed
    const first = withRateLimit("ticketPurchase", identifier)
    expect(first.allowed).toBe(true)

    // Simulate multiple requests
    for (let i = 0; i < 5; i++) {
      withRateLimit("ticketPurchase", identifier)
    }

    // Should be rate limited now
    const limited = withRateLimit("ticketPurchase", identifier)
    expect(limited.allowed).toBe(false)
  })
})

describe("QR Code Security", () => {
  it("should validate QR data format", async () => {
    const { qrValidationSchema } = await import("../security/validation")

    const validQR = {
      qrData: "TICKET_123e4567-e89b-12d3-a456-426614174000_SECURE_TOKEN",
      eventId: "123e4567-e89b-12d3-a456-426614174000",
      scanLocation: "Main Entrance",
    }

    const result = qrValidationSchema.safeParse(validQR)
    expect(result.success).toBe(true)
  })

  it("should reject empty QR data", async () => {
    const { qrValidationSchema } = await import("../security/validation")

    const invalidQR = {
      qrData: "",
      eventId: "123e4567-e89b-12d3-a456-426614174000",
    }

    const result = qrValidationSchema.safeParse(invalidQR)
    expect(result.success).toBe(false)
  })
})

// Integration test helpers
export const testHelpers = {
  createMockEvent: () => ({
    id: "123e4567-e89b-12d3-a456-426614174000",
    title: "Test Event",
    description: "Test event description",
    event_date: new Date().toISOString(),
    venue: "Test Venue",
    ticket_price: 5000,
    max_attendees: 100,
    category: "concert",
  }),

  createMockTicket: () => ({
    id: "123e4567-e89b-12d3-a456-426614174001",
    event_id: "123e4567-e89b-12d3-a456-426614174000",
    user_id: "test-user-id",
    qr_code: "TICKET_123_SECURE_TOKEN",
    status: "valid",
    purchase_date: new Date().toISOString(),
  }),

  createMockUser: () => ({
    id: "test-user-id",
    email: "test@example.com",
    user_metadata: {
      full_name: "Test User",
    },
  }),
}
