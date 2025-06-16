import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navigation } from "@/components/navigation"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/contexts/theme-context"
import { ErrorBoundary } from "@/components/error-boundary"
import { SessionRefresh } from "@/components/session-refresh"
import { Toaster } from "@/components/ui/toaster"
import { PreviewModeIndicator } from "@/components/preview-mode-indicator"
import { DynamicLogo } from "@/components/dynamic-logo"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Erigga Fan Platform",
  description: "The official fan platform for Nigerian rapper Erigga",
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
          <ThemeProvider>
            <AuthProvider>
              <SessionRefresh />
              <div className="min-h-screen flex flex-col">
                <Navigation />
                <main className="flex-1 pt-16">{children}</main>
              </div>
              <footer className="border-t bg-background/95 backdrop-blur">
                <div className="container mx-auto px-4 py-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                      <DynamicLogo width={100} height={32} className="mb-4" />
                      <p className="text-sm text-muted-foreground">Street Made, Global Respected</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-4">Community</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>
                          <a href="/community" className="hover:text-primary glow-text transition-colors">
                            Real Talk
                          </a>
                        </li>
                        <li>
                          <a href="/community" className="hover:text-primary glow-text transition-colors">
                            Bars & Battles
                          </a>
                        </li>
                        <li>
                          <a href="/chronicles" className="hover:text-primary glow-text transition-colors">
                            Erigga Chronicles
                          </a>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-4">Platform</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>
                          <a href="/premium" className="hover:text-primary glow-text transition-colors">
                            Join Movement
                          </a>
                        </li>
                        <li>
                          <a href="/vault" className="hover:text-primary glow-text transition-colors">
                            Media Vault
                          </a>
                        </li>
                        <li>
                          <a href="/merch" className="hover:text-primary glow-text transition-colors">
                            Merch Store
                          </a>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-4">Support</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>
                          <a href="/contact" className="hover:text-primary glow-text transition-colors">
                            Contact
                          </a>
                        </li>
                        <li>
                          <a href="/terms" className="hover:text-primary glow-text transition-colors">
                            Terms
                          </a>
                        </li>
                        <li>
                          <a href="/privacy" className="hover:text-primary glow-text transition-colors">
                            Privacy
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
                    <p>
                      &copy; 2024 Erigga Fan Platform. All rights reserved. Built with street energy and premium
                      functionality.
                    </p>
                  </div>
                </div>
              </footer>
              <PreviewModeIndicator />
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
