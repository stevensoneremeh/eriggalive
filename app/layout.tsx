import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { cn } from "@/lib/utils"
import { fontSans } from "@/lib/fonts"
import { ThemeProvider } from "@/components/providers"
import { AuthProvider } from "@/components/providers/auth-provider"
import { Toaster } from "@/components/ui/toaster"
import { Navigation } from "@/components/navigation"
import { SessionRefresh } from "@/components/session-refresh"
import { PreviewModeIndicator } from "@/components/preview-mode-indicator"
import { InstallPrompt } from "@/components/install-prompt"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        <ThemeProvider>
          <AuthProvider>
            <Toaster />
            <Navigation /> {/* Always render navigation */}
            <main className="pt-16">
              {" "}
              {/* Add padding-top to account for fixed navigation */}
              {children}
            </main>
            <SessionRefresh />
            <PreviewModeIndicator />
            <InstallPrompt />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
