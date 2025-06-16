import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/contexts/theme-context"
import { AuthProvider } from "@/contexts/auth-context"
import { Navigation } from "@/components/navigation"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/error-boundary"
import { PreviewModeIndicator } from "@/components/preview-mode-indicator"
import { SessionRefresh } from "@/components/session-refresh"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Erigga Fan Platform",
  description:
    "Official fan platform for Erigga - Access exclusive content, connect with fans, and support your favorite artist",
  keywords: ["Erigga", "music", "fan platform", "exclusive content", "Nigerian music"],
  authors: [{ name: "Erigga Fan Platform Team" }],
  creator: "Erigga Fan Platform",
  publisher: "Erigga Fan Platform",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://eriggalive.vercel.app",
    title: "Erigga Fan Platform",
    description: "Official fan platform for Erigga - Access exclusive content and connect with fans",
    siteName: "Erigga Fan Platform",
  },
  twitter: {
    card: "summary_large_image",
    title: "Erigga Fan Platform",
    description: "Official fan platform for Erigga - Access exclusive content and connect with fans",
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
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              <div className="relative flex min-h-screen flex-col">
                <Navigation />
                <main className="flex-1">{children}</main>
                <SessionRefresh />
                <PreviewModeIndicator />
              </div>
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
