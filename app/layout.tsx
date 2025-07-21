import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { AblyProvider } from "@/contexts/ably-context"
import { Toaster } from "@/components/ui/toaster"
import { Navigation } from "@/components/navigation"
import { FloatingRadioPlayer } from "@/components/floating-radio-player"
import { SessionRefresh } from "@/components/session-refresh"
import { PreviewModeIndicator } from "@/components/preview-mode-indicator"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Erigga Live - Official Community Platform",
  description: "Join the official Erigga community platform for exclusive content, live events, and fan interactions.",
  keywords: "Erigga, music, community, live events, Nigerian artist, hip hop",
  authors: [{ name: "Erigga Live Team" }],
  creator: "Erigga Live",
  publisher: "Erigga Live",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://eriggalive.vercel.app"),
  openGraph: {
    title: "Erigga Live - Official Community Platform",
    description:
      "Join the official Erigga community platform for exclusive content, live events, and fan interactions.",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://eriggalive.vercel.app",
    siteName: "Erigga Live",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Erigga Live - Official Community Platform",
    description:
      "Join the official Erigga community platform for exclusive content, live events, and fan interactions.",
    creator: "@erigga",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <AblyProvider>
              <div className="min-h-screen bg-background">
                <PreviewModeIndicator />
                <Navigation />
                <main className="flex-1">{children}</main>
                <FloatingRadioPlayer />
                <SessionRefresh />
              </div>
              <Toaster />
            </AblyProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
