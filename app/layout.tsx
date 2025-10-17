import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
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

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Erigga Live - Official Fan Platform",
  description: "The official fan platform for Erigga - Music, Community, and Exclusive Content",
  generator: "v0.dev",
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
        </ErrorBoundary>
      </body>
    </html>
  )
}
