import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { SafeThemeProvider } from "@/contexts/theme-context"
import { UnifiedNavigation } from "@/components/navigation/unified-navigation"
import { Toaster } from "@/components/ui/toast"
import { ErrorBoundary } from "@/components/error-boundary"
import { Suspense } from "react"
import { SimpleLoading } from "@/components/simple-loading"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Erigga Live - Official Fan Platform",
  description: "The official fan platform for Erigga - Music, Community, and Exclusive Content",
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
                  <Suspense fallback={<SimpleLoading />}>
                    <UnifiedNavigation />
                  </Suspense>
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
