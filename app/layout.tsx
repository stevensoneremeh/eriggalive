import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { AblyProvider } from "@/contexts/ably-context"
import { Toaster } from "@/components/ui/toaster"
import { SessionRefresh } from "@/components/session-refresh"
import { RadioProvider } from "@/contexts/radio-context"
import { FloatingRadioPlayer } from "@/components/floating-radio-player"
import { PreviewModeIndicator } from "@/components/preview-mode-indicator"
import { InstallPrompt } from "@/components/pwa/install-prompt"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EriggaLive - Official Community Platform",
  description: "Join the official Erigga community platform for exclusive content, live chats, and more.",
  manifest: "/manifest.json",
  themeColor: "#000000",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <AblyProvider>
              <RadioProvider>
                <SessionRefresh />
                <PreviewModeIndicator />
                <InstallPrompt />
                {children}
                <FloatingRadioPlayer />
                <Toaster />
              </RadioProvider>
            </AblyProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
