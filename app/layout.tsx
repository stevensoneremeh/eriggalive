import type React from "react"
import type { Metadata } from "next"
import { inter } from "@/lib/fonts"
import "./globals.css"
import { ThemeProvider } from "@/contexts/theme-context"
import { AuthProvider } from "@/contexts/auth-context"
import { CommunityProvider } from "@/contexts/community-context"
import { RadioProvider } from "@/contexts/radio-context"
import { Toaster } from "@/components/ui/toaster"
import { MainNavigation } from "@/components/navigation/main-navigation"
import { SessionRefresh } from "@/components/session-refresh"
import { PreviewModeIndicator } from "@/components/preview-mode-indicator"

export const metadata: Metadata = {
  title: "Erigga Live - Official Fan Platform",
  description:
    "The official community platform for Erigga fans worldwide. Access exclusive content, connect with other fans, and be part of the movement.",
  keywords: ["Erigga", "Nigerian Music", "Hip Hop", "Fan Community", "Music Platform"],
  authors: [{ name: "Erigga Live Team" }],
  creator: "Erigga Live",
  publisher: "Erigga Live",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://eriggalive.com"),
  openGraph: {
    title: "Erigga Live - Official Fan Platform",
    description: "Join the official Erigga community. Access exclusive music, videos, and connect with fans worldwide.",
    url: "/",
    siteName: "Erigga Live",
    images: [
      {
        url: "/images/hero/erigga1.jpeg",
        width: 1200,
        height: 630,
        alt: "Erigga Live Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Erigga Live - Official Fan Platform",
    description: "Join the official Erigga community. Access exclusive music, videos, and connect with fans worldwide.",
    images: ["/images/hero/erigga1.jpeg"],
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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.className} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <CommunityProvider>
              <RadioProvider>
                <div className="relative min-h-screen bg-background">
                  <MainNavigation />
                  <main className="pt-16">{children}</main>
                  <SessionRefresh />
                  <PreviewModeIndicator />
                  <Toaster />
                </div>
              </RadioProvider>
            </CommunityProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
