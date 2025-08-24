// Paystack utility functions for membership system

export interface PaystackInitializeRequest {
  email: string
  amount: number // in kobo
  reference: string
  currency?: string
  callback_url?: string
  metadata?: Record<string, any>
}

export interface PaystackInitializeResponse {
  status: boolean
  message: string
  data: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

export interface PaystackVerifyResponse {
  status: boolean
  message: string
  data: {
    id: number
    domain: string
    status: string
    reference: string
    amount: number
    message: string | null
    gateway_response: string
    paid_at: string
    created_at: string
    channel: string
    currency: string
    ip_address: string
    metadata: Record<string, any>
    customer: {
      id: number
      first_name: string | null
      last_name: string | null
      email: string
      customer_code: string
      phone: string | null
      metadata: Record<string, any>
      risk_action: string
    }
  }
}

export class PaystackService {
  private secretKey: string
  private baseUrl = "https://api.paystack.co"

  constructor(secretKey: string) {
    this.secretKey = secretKey
  }

  async initializeTransaction(payload: PaystackInitializeRequest): Promise<PaystackInitializeResponse> {
    const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Paystack initialization failed: ${errorData.message || response.statusText}`)
    }

    return await response.json()
  }

  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    const response = await fetch(`${this.baseUrl}/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Paystack verification failed: ${errorData.message || response.statusText}`)
    }

    return await response.json()
  }

  static validateWebhookSignature(payload: string, signature: string, secretKey: string): boolean {
    const crypto = require("crypto")
    const hash = crypto.createHmac("sha512", secretKey).update(payload).digest("hex")
    return hash === signature
  }
}

// Utility functions
export const createPaystackService = () => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) {
    throw new Error("Paystack secret key not configured")
  }
  return new PaystackService(secretKey)
}

export const generateMembershipReference = (tierCode: string, userId: string): string => {
  return `membership_${tierCode.toLowerCase()}_${userId.slice(-8)}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
}

export const isTestMode = (): boolean => {
  return process.env.PAYSTACK_SECRET_KEY?.startsWith("sk_test_") || process.env.NODE_ENV === "development"
}
