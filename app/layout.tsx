import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
<<<<<<< HEAD
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/contexts/theme-context"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/error-boundary"
=======
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { SafeThemeProvider } from "@/contexts/theme-context"
import { ShoutOutProvider } from "@/contexts/shout-out-context"
import { LiveStreamProvider } from "@/contexts/live-stream-context"
import { UnifiedNavigation } from "@/components/navigation/unified-navigation"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/error-boundary"
import { Suspense } from "react"
import { SimpleLoading } from "@/components/simple-loading"
import { GlobalMiniPlayer } from "@/components/radio/global-mini-player"
>>>>>>> new

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Erigga Live - Official Fan Platform",
<<<<<<< HEAD
  description:
    "The official fan platform for Erigga - Connect with the community, access exclusive content, and experience Nigerian hip-hop like never before.",
  keywords: ["Erigga", "Nigerian Hip-Hop", "Music", "Fan Platform", "Community"],
  authors: [{ name: "Erigga Live Team" }],
  creator: "Erigga Live",
  publisher: "Erigga Live",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "Erigga Live - Official Fan Platform",
    description:
      "The official fan platform for Erigga - Connect with the community, access exclusive content, and experience Nigerian hip-hop like never before.",
    url: "/",
    siteName: "Erigga Live",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Erigga Live - Official Fan Platform",
    description:
      "The official fan platform for Erigga - Connect with the community, access exclusive content, and experience Nigerian hip-hop like never before.",
    creator: "@EriggaLive",
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
=======
  description: "The official fan platform for Erigga - Music, Community, and Exclusive Content",
  generator: "v0.dev",
>>>>>>> new
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
<<<<<<< HEAD
          <ThemeProvider>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
=======
          <SafeThemeProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              <AuthProvider>
                <ShoutOutProvider>
                  <LiveStreamProvider>
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
                    <GlobalMiniPlayer />
                    <Toaster />
                  </LiveStreamProvider>
                </ShoutOutProvider>
              </AuthProvider>
            </ThemeProvider>
          </SafeThemeProvider>
>>>>>>> new
        </ErrorBoundary>
      </body>
    </html>
  )
}
