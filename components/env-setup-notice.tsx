"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, ExternalLink, Settings } from "lucide-react"

export function EnvSetupNotice() {
  const [showSetup, setShowSetup] = useState(false)

  const hasSupabaseEnv = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (hasSupabaseEnv) {
    return null
  }

  const envTemplate = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Database
DATABASE_URL=your_database_url_here

# Authentication
JWT_SECRET=your_jwt_secret_here
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000`

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Environment Setup Required
          </CardTitle>
          <CardDescription>This project requires Supabase configuration to work properly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              The app is running in demo mode with mock data. To enable full functionality, please configure your
              environment variables.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h3 className="font-semibold">Quick Setup Steps:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>
                Create a new Supabase project at{" "}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  supabase.com <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>Copy your project URL and anon key from the API settings</li>
              <li>
                Create a <code className="bg-gray-100 px-1 rounded">.env.local</code> file in your project root
              </li>
              <li>Add the environment variables below</li>
              <li>Restart your development server</li>
            </ol>
          </div>

          {showSetup && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Environment Variables Template:</h4>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(envTemplate)}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">{envTemplate}</pre>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={() => setShowSetup(!showSetup)}>
              {showSetup ? "Hide Setup" : "Show Setup Instructions"}
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
