"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Mail } from "lucide-react"
import Link from "next/link"

export default function SuccessPageContent() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState<string>("")

  useEffect(() => {
    const emailParam = searchParams.get("email")
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-800">Registration Successful!</CardTitle>
          <CardDescription className="text-gray-600">
            Welcome to EriggaLive! Your account has been created successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {email && (
            <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <Mail className="h-4 w-4" />
              <span>Confirmation sent to: {email}</span>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm text-gray-600 text-center">
              You can now access all features of EriggaLive. Start exploring and connecting with the community!
            </p>

            <div className="flex flex-col space-y-2">
              <Button asChild className="w-full">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>

              <Button variant="outline" asChild className="w-full">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
