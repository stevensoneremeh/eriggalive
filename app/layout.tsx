import { Toaster } from "@/components/ui/sonner"
import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { FixedNavigation } from "@/components/navigation/fixed-navigation"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <RadioProvider>
              <div className="relative flex min-h-screen flex-col">
                <FixedNavigation />
                <main className="flex-1">{children}</main>
                <FloatingRadioPlayer />
              </div>
              <Toaster />
            </RadioProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
