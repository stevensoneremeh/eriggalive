import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { MainNavigation } from "@/components/navigation/main-navigation"
import { Toaster } from "@/components/ui/sonner"
import { ErrorBoundary } from "@/components/error-boundary"
import { Suspense } from "react"
import { SimpleLoading } from "@/components/simple-loading"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Erigga Live - Official Fan Platform",
  description: "The official fan platform for Erigga - Music, Community, and Exclusive Content",
  generator: "Next.js",
  applicationName: "Erigga Live",
  keywords: ["Erigga", "Music", "Community", "Nigerian Music", "Hip Hop"],
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
                {/* Main Navigation with Framer Motion */}
                <Suspense fallback={<SimpleLoading />}>
                  <MainNavigation />
                </Suspense>

                {/* Main Content */}
                <main>
                  <Suspense fallback={<SimpleLoading />}>{children}</Suspense>
                </main>
              </div>
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
