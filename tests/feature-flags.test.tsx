import { render, screen, waitFor } from "@/lib/testing/test-utils"
import { useFeatureFlag, useFeatureFlags } from "@/contexts/feature-flags-context"
import { testUtils } from "@/lib/testing/test-utils"

// Test component that uses feature flags
function TestComponent() {
  const isEnhancedUI = useFeatureFlag("enhanced_community_ui")
  const { flags, isLoading } = useFeatureFlags()

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <div data-testid="enhanced-ui">{isEnhancedUI ? "Enhanced UI Enabled" : "Enhanced UI Disabled"}</div>
      <div data-testid="flags-count">Flags loaded: {Object.keys(flags).length}</div>
    </div>
  )
}

describe("Feature Flags", () => {
  beforeEach(() => {
    testUtils.resetMocks()
  })

  it("should render with feature flag enabled", async () => {
    testUtils.mockFeatureFlag("enhanced_community_ui", true)

    render(<TestComponent />)

    await waitFor(() => {
      expect(screen.getByTestId("enhanced-ui")).toHaveTextContent("Enhanced UI Enabled")
    })
  })

  it("should render with feature flag disabled", async () => {
    testUtils.mockFeatureFlag("enhanced_community_ui", false)

    render(<TestComponent />)

    await waitFor(() => {
      expect(screen.getByTestId("enhanced-ui")).toHaveTextContent("Enhanced UI Disabled")
    })
  })

  it("should handle loading state", () => {
    render(<TestComponent />)
    expect(screen.getByText("Loading...")).toBeInTheDocument()
  })
})
