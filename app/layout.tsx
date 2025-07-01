import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { SafeThemeProvider } from "@/contexts/theme-context"
import { UnifiedNavigation } from "@/components/navigation/unified-navigation"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/error-boundary"
import { Suspense } from "react"
import { SimpleLoading } from "@/components/simple-loading"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Erigga Live - Official Fan Platform",
  description: "The official fan platform for Erigga - Music, Community, and Exclusive Content",
  keywords: ["Erigga", "Music", "Nigerian Artist", "Fan Platform", "Community"],
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
    title: "Erigga Live - Official Fan Platform",
    description: "The official fan platform for Erigga - Music, Community, and Exclusive Content",
    url: "/",
    siteName: "Erigga Live",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Erigga Live - Official Fan Platform",
    description: "The official fan platform for Erigga - Music, Community, and Exclusive Content",
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
    google: "your-google-verification-code",
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
          <SafeThemeProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              <AuthProvider>
                <div className="min-h-screen bg-background">
                  {/* Main Navigation - Always Visible */}
                  <Suspense fallback={<SimpleLoading />}>
                    <UnifiedNavigation />
                  </Suspense>

                  {/* Main Content with proper spacing for fixed nav */}
                  <main className="pt-16 pb-20 md:pb-4">
                    <Suspense fallback={<SimpleLoading />}>{children}</Suspense>
                  </main>
                </div>
                <Toaster />
              </AuthProvider>
            </ThemeProvider>
          </SafeThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
