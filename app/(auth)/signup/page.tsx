"use client"

import { SignUp } from "@clerk/nextjs"
import { DynamicLogo } from "@/components/dynamic-logo"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <DynamicLogo className="h-12 w-auto" />
        </div>
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary: "bg-lime-500 text-teal-900 hover:bg-lime-600",
              card: "shadow-2xl",
              headerTitle: "text-2xl font-bold",
              headerSubtitle: "text-gray-600 dark:text-gray-400",
              socialButtonsBlockButton: "border-gray-200 hover:bg-gray-50",
              dividerLine: "bg-gray-200",
              dividerText: "text-gray-500",
              formFieldInput: "border-gray-300 focus:border-lime-500 focus:ring-lime-500",
              footerActionLink: "text-lime-600 hover:text-lime-500",
            },
          }}
          redirectUrl="/dashboard"
          signInUrl="/login"
        />
      </div>
    </div>
  )
}
