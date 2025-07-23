import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/contexts/auth-context"
import { CommunityProvider } from "@/contexts/community-context"
import { RadioProvider } from "@/contexts/radio-context"
import { MainNavigation } from "@/components/navigation/main-navigation"
import { FloatingRadioPlayer } from "@/components/floating-radio-player"
import { PreviewModeIndicator } from "@/components/preview-mode-indicator"
import { SessionRefresh } from "@/components/session-refresh"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EriggaLive - Official Fan Platform",
  description: "The official platform for Erigga fans - exclusive content, community, and experiences",
  keywords: ["Erigga", "Music", "Nigeria", "Hip Hop", "Rap", "Exclusive Content"],
  authors: [{ name: "EriggaLive Team" }],
  creator: "EriggaLive",
  publisher: "EriggaLive",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://eriggalive.vercel.app"),
  openGraph: {
    title: "EriggaLive - Official Fan Platform",
    description: "The official platform for Erigga fans - exclusive content, community, and experiences",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://eriggalive.vercel.app",
    siteName: "EriggaLive",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EriggaLive - Official Fan Platform",
    description: "The official platform for Erigga fans - exclusive content, community, and experiences",
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
    generator: 'v0.dev'
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
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
            <CommunityProvider>
              <RadioProvider>
                <div className="relative min-h-screen bg-background">
                  <PreviewModeIndicator />
                  <SessionRefresh />
                  <MainNavigation />
                  <main className="relative">{children}</main>
                  <FloatingRadioPlayer />
                </div>
                <Toaster />
              </RadioProvider>
            </CommunityProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
