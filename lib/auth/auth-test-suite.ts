import { enhancedAuthService } from "./enhanced-auth-service"
import { DeviceDetection } from "./device-detection"

interface TestResult {
  test: string
  passed: boolean
  error?: string
  duration: number
}

export class AuthTestSuite {
  private testResults: TestResult[] = []

  async runAllTests(): Promise<TestResult[]> {
    this.testResults = []

    await this.testLogin()
    await this.testSessionValidation()
    await this.testTokenRefresh()
    await this.testConcurrentSessions()
    await this.testRememberMe()
    await this.testLogout()

    return this.testResults
  }

  private async testLogin(): Promise<void> {
    const startTime = Date.now()
    try {
      const result = await enhancedAuthService.login({
        email: "test@example.com",
        password: "testpassword123",
        rememberMe: false,
        deviceInfo: DeviceDetection.getDeviceInfo(),
        ipAddress: "127.0.0.1",
      })

      this.testResults.push({
        test: "Login Test",
        passed: result.success,
        error: result.error,
        duration: Date.now() - startTime,
      })
    } catch (error) {
      this.testResults.push({
        test: "Login Test",
        passed: false,
        error: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - startTime,
      })
    }
  }

  private async testSessionValidation(): Promise<void> {
    const startTime = Date.now()
    try {
      // First login to get a session
      const loginResult = await enhancedAuthService.login({
        email: "test@example.com",
        password: "testpassword123",
        rememberMe: false,
        deviceInfo: DeviceDetection.getDeviceInfo(),
        ipAddress: "127.0.0.1",
      })

      if (loginResult.success && loginResult.session) {
        const validationResult = await enhancedAuthService.validateSession(loginResult.session.sessionToken)

        this.testResults.push({
          test: "Session Validation Test",
          passed: validationResult.success,
          error: validationResult.error,
          duration: Date.now() - startTime,
        })
      } else {
        this.testResults.push({
          test: "Session Validation Test",
          passed: false,
          error: "Failed to create session for validation test",
          duration: Date.now() - startTime,
        })
      }
    } catch (error) {
      this.testResults.push({
        test: "Session Validation Test",
        passed: false,
        error: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - startTime,
      })
    }
  }

  private async testTokenRefresh(): Promise<void> {
    const startTime = Date.now()
    try {
      // First login to get tokens
      const loginResult = await enhancedAuthService.login({
        email: "test@example.com",
        password: "testpassword123",
        rememberMe: false,
        deviceInfo: DeviceDetection.getDeviceInfo(),
        ipAddress: "127.0.0.1",
      })

      if (loginResult.success && loginResult.tokens) {
        const refreshResult = await enhancedAuthService.refreshToken(loginResult.tokens.refreshToken)

        this.testResults.push({
          test: "Token Refresh Test",
          passed: refreshResult.success,
          error: refreshResult.error,
          duration: Date.now() - startTime,
        })
      } else {
        this.testResults.push({
          test: "Token Refresh Test",
          passed: false,
          error: "Failed to get tokens for refresh test",
          duration: Date.now() - startTime,
        })
      }
    } catch (error) {
      this.testResults.push({
        test: "Token Refresh Test",
        passed: false,
        error: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - startTime,
      })
    }
  }

  private async testConcurrentSessions(): Promise<void> {
    const startTime = Date.now()
    try {
      const sessions = []

      // Create 4 sessions to test the 3-session limit
      for (let i = 0; i < 4; i++) {
        const result = await enhancedAuthService.login({
          email: "test@example.com",
          password: "testpassword123",
          rememberMe: false,
          deviceInfo: {
            ...DeviceDetection.getDeviceInfo(),
            browser: `TestBrowser${i}`,
          },
          ipAddress: "127.0.0.1",
        })

        if (result.success) {
          sessions.push(result)
        }
      }

      // Check that only 3 sessions are active
      const userSessions = await enhancedAuthService.getUserSessions("1") // Assuming test user ID is 1
      const activeSessions = userSessions.filter((s) => s.isActive)

      this.testResults.push({
        test: "Concurrent Sessions Limit Test",
        passed: activeSessions.length <= 3,
        error: activeSessions.length > 3 ? `Too many active sessions: ${activeSessions.length}` : undefined,
        duration: Date.now() - startTime,
      })
    } catch (error) {
      this.testResults.push({
        test: "Concurrent Sessions Limit Test",
        passed: false,
        error: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - startTime,
      })
    }
  }

  private async testRememberMe(): Promise<void> {
    const startTime = Date.now()
    try {
      const result = await enhancedAuthService.login({
        email: "test@example.com",
        password: "testpassword123",
        rememberMe: true,
        deviceInfo: DeviceDetection.getDeviceInfo(),
        ipAddress: "127.0.0.1",
      })

      const passed =
        result.success && result.session?.rememberMe === true && result.tokens?.expiresIn === 30 * 24 * 60 * 60 * 1000 // 30 days

      this.testResults.push({
        test: "Remember Me Test",
        passed,
        error: !passed ? "Remember me functionality not working correctly" : undefined,
        duration: Date.now() - startTime,
      })
    } catch (error) {
      this.testResults.push({
        test: "Remember Me Test",
        passed: false,
        error: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - startTime,
      })
    }
  }

  private async testLogout(): Promise<void> {
    const startTime = Date.now()
    try {
      // First login
      const loginResult = await enhancedAuthService.login({
        email: "test@example.com",
        password: "testpassword123",
        rememberMe: false,
        deviceInfo: DeviceDetection.getDeviceInfo(),
        ipAddress: "127.0.0.1",
      })

      if (loginResult.success && loginResult.session) {
        const logoutResult = await enhancedAuthService.logout(loginResult.session.sessionToken, loginResult.user?.id)

        // Verify session is deactivated
        const validationResult = await enhancedAuthService.validateSession(loginResult.session.sessionToken)

        this.testResults.push({
          test: "Logout Test",
          passed: logoutResult.success && !validationResult.success,
          error: !logoutResult.success
            ? "Logout failed"
            : validationResult.success
              ? "Session still active after logout"
              : undefined,
          duration: Date.now() - startTime,
        })
      } else {
        this.testResults.push({
          test: "Logout Test",
          passed: false,
          error: "Failed to create session for logout test",
          duration: Date.now() - startTime,
        })
      }
    } catch (error) {
      this.testResults.push({
        test: "Logout Test",
        passed: false,
        error: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - startTime,
      })
    }
  }

  generateReport(): string {
    const totalTests = this.testResults.length
    const passedTests = this.testResults.filter((r) => r.passed).length
    const failedTests = totalTests - passedTests
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0)

    let report = `
🔐 AUTHENTICATION SYSTEM TEST REPORT
=====================================

📊 SUMMARY:
- Total Tests: ${totalTests}
- Passed: ${passedTests} ✅
- Failed: ${failedTests} ❌
- Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%
- Total Duration: ${totalDuration}ms

📋 DETAILED RESULTS:
`

    this.testResults.forEach((result) => {
      report += `
${result.passed ? "✅" : "❌"} ${result.test}
   Duration: ${result.duration}ms
   ${result.error ? `Error: ${result.error}` : "Status: PASSED"}
`
    })

    return report
  }
}

export const authTestSuite = new AuthTestSuite()
