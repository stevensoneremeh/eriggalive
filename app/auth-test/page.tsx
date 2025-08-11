import { AuthTest } from "@/components/auth-test"

export default function AuthTestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Authentication System Test</h1>
          <p className="text-muted-foreground">
            This page tests the complete authentication flow including sign in, sign up, and sign out functionality.
          </p>
        </div>
        <AuthTest />
      </div>
    </div>
  )
}
