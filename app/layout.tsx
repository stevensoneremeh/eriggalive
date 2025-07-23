import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { AblyProvider } from "@/contexts/ably-context"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "Erigga Live - Community Hub",
  description: "Connect with fellow fans in the ultimate Erigga community experience",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AblyProvider>
            {children}
            <Toaster />
          </AblyProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
