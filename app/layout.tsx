import React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Suspense } from "react"
import "./globals.css"
import ErrorBoundary from "@/components/error-boundary"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Erigga Fan Platform",
  description: "The official fan platform for Nigerian rapper Erigga",
  generator: "v0.dev",
}

// Simple loading fallback
function SimpleLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-500"></div>
    </div>
  )
}

// Lazy load components to avoid SSR issues
const UnifiedNavigation = React.lazy(() =>
  import("@/components/navigation/unified-navigation").then((mod) => ({ default: mod.UnifiedNavigation })),
)
const ThemeProvider = React.lazy(() =>
  import("@/contexts/theme-context").then((mod) => ({ default: mod.ThemeProvider })),
)
const AuthProvider = React.lazy(() => import("@/contexts/auth-context").then((mod) => ({ default: mod.AuthProvider })))
const SessionRefresh = React.lazy(() =>
  import("@/components/session-refresh").then((mod) => ({ default: mod.SessionRefresh })),
)
const DynamicLogo = React.lazy(() => import("@/components/dynamic-logo").then((mod) => ({ default: mod.DynamicLogo })))

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <Suspense fallback={<SimpleLoading />}>
            <ThemeProvider>
              <Suspense fallback={<SimpleLoading />}>
                <AuthProvider>
                  <Suspense fallback={<div />}>
                    <SessionRefresh />
                  </Suspense>

                  {/* Unified Navigation */}
                  <Suspense
                    fallback={
                      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur shadow-md">
                        <div className="container mx-auto px-4">
                          <div className="flex h-16 items-center justify-between">
                            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
                          </div>
                        </div>
                      </header>
                    }
                  >
                    <UnifiedNavigation />
                  </Suspense>

                  {/* Main Content */}
                  <main className="pt-16 pb-20 md:pb-0 min-h-screen">
                    <Suspense fallback={<SimpleLoading />}>{children}</Suspense>
                  </main>

                  {/* Footer */}
                  <Suspense fallback={<div className="h-64 bg-muted animate-pulse" />}>
                    <footer className="border-t bg-background/95 backdrop-blur mb-20 md:mb-0">
                      <div className="container mx-auto px-4 py-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                          <div>
                            <Suspense fallback={<div className="h-8 w-24 bg-muted animate-pulse rounded mb-4" />}>
                              <DynamicLogo width={100} height={32} className="mb-4" />
                            </Suspense>
                            <p className="text-sm text-muted-foreground">Street Made, Global Respected</p>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-4">Community</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                              <li>
                                <a href="/community" className="hover:text-primary transition-colors">
                                  Real Talk
                                </a>
                              </li>
                              <li>
                                <a href="/community" className="hover:text-primary transition-colors">
                                  Bars & Battles
                                </a>
                              </li>
                              <li>
                                <a href="/chronicles" className="hover:text-primary transition-colors">
                                  Erigga Chronicles
                                </a>
                              </li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-4">Platform</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                              <li>
                                <a href="/premium" className="hover:text-primary transition-colors">
                                  Join Movement
                                </a>
                              </li>
                              <li>
                                <a href="/vault" className="hover:text-primary transition-colors">
                                  Media Vault
                                </a>
                              </li>
                              <li>
                                <a href="/merch" className="hover:text-primary transition-colors">
                                  Merch Store
                                </a>
                              </li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-4">Support</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                              <li>
                                <a href="/contact" className="hover:text-primary transition-colors">
                                  Contact
                                </a>
                              </li>
                              <li>
                                <a href="/terms" className="hover:text-primary transition-colors">
                                  Terms
                                </a>
                              </li>
                              <li>
                                <a href="/privacy" className="hover:text-primary transition-colors">
                                  Privacy
                                </a>
                              </li>
                            </ul>
                          </div>
                        </div>
                        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
                          <p>&copy; 2024 Erigga Fan Platform. All rights reserved.</p>
                        </div>
                      </div>
                    </footer>
                  </Suspense>
                </AuthProvider>
              </Suspense>
            </ThemeProvider>
          </Suspense>
        </ErrorBoundary>

        {process.env.NODE_ENV === "production" && (
          <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />
        )}
      </body>
    </html>
  )
}
