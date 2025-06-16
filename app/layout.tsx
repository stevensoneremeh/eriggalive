import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/error-boundary"
import { PreviewModeIndicator } from "@/components/preview-mode-indicator"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Erigga Fan Platform",
  description:
    "Official fan platform for Erigga - Access exclusive content, connect with fans, and stay updated with the latest from the Paper Boi himself.",
  keywords: ["Erigga", "Nigerian Music", "Hip Hop", "Fan Platform", "Music Community"],
  authors: [{ name: "Erigga Fan Platform Team" }],
  openGraph: {
    title: "Erigga Fan Platform",
    description: "Official fan platform for Erigga - Access exclusive content and connect with fans",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Erigga Fan Platform",
    description: "Official fan platform for Erigga - Access exclusive content and connect with fans",
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
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
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <AuthProvider>
              <div className="min-h-screen bg-background">
                {children}
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
