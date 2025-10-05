import type React from "react"
import { render, type RenderOptions } from "@testing-library/react"
import { FeatureFlagsProvider } from "@/contexts/feature-flags-context"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "next-themes"
import jest from "jest" // Import jest to fix the undeclared variable error

// Mock feature flags for testing
const mockFeatureFlags = {
  enhanced_community_ui: true,
  improved_radio_shoutouts: true,
  wallet_balance_fixes: true,
  event_pricing_fixes: true,
  beta_features: false,
  premium_features: true,
}

// Mock auth context for testing
const mockAuthContext = {
  user: {
    id: "test-user-id",
    email: "test@example.com",
    user_metadata: { full_name: "Test User" },
  },
  profile: {
    id: "test-profile-id",
    tier: "pro",
    role: "user",
    coins: 1000,
  },
  isAuthenticated: true,
  loading: false,
  signIn: jest.fn(),
  signOut: jest.fn(),
  signUp: jest.fn(),
}

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <AuthProvider value={mockAuthContext}>
        <FeatureFlagsProvider>{children}</FeatureFlagsProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

const customRender = (ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, { wrapper: AllTheProviders, ...options })

// Test utilities
export const testUtils = {
  // Mock feature flag responses
  mockFeatureFlag: (flagKey: string, enabled: boolean) => {
    mockFeatureFlags[flagKey as keyof typeof mockFeatureFlags] = enabled
  },

  // Reset all mocks
  resetMocks: () => {
    jest.clearAllMocks()
    Object.keys(mockFeatureFlags).forEach((key) => {
      mockFeatureFlags[key as keyof typeof mockFeatureFlags] = false
    })
  },

  // Create mock event data
  createMockEvent: (overrides = {}) => ({
    id: "test-event-id",
    title: "Test Event",
    description: "Test event description",
    event_date: new Date().toISOString(),
    venue: "Test Venue",
    ticket_price_naira: 20000,
    ticket_price_coins: 10000,
    max_capacity: 100,
    current_attendance: 50,
    ...overrides,
  }),

  // Create mock user data
  createMockUser: (overrides = {}) => ({
    id: "test-user-id",
    email: "test@example.com",
    user_metadata: { full_name: "Test User" },
    ...overrides,
  }),

  // Create mock transaction data
  createMockTransaction: (overrides = {}) => ({
    id: "test-transaction-id",
    user_id: "test-user-id",
    type: "purchase",
    amount_naira: 20000,
    status: "completed",
    created_at: new Date().toISOString(),
    ...overrides,
  }),
}

// Re-export everything
export * from "@testing-library/react"
export { customRender as render }
