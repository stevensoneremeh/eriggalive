import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import "./globals.css"
import { Navigation } from "@/components/navigation"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/contexts/theme-context"
import ErrorBoundary from "@/components/error-boundary"

export const metadata: Metadata = {
  title: "Erigga Fan Platform - Street Made, Global Respected",
  description:
    "The official fan platform for Nigerian rapper Erigga. Join the community, access exclusive content, and connect with real fans.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              <Navigation />
              <main>{children}</main>
              <footer className="border-t border-orange-500/20 bg-background/95 backdrop-blur">
                <div className="container mx-auto px-4 py-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                      <div className="font-street text-2xl text-gradient mb-4">ERIGGA</div>
                      <p className="text-sm text-muted-foreground">Street Made, Global Respected</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-4">Community</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>
                          <a href="/community" className="hover:text-orange-500">
                            Real Talk
                          </a>
                        </li>
                        <li>
                          <a href="/community" className="hover:text-orange-500">
                            Bars & Battles
                          </a>
                        </li>
                        <li>
                          <a href="/chronicles" className="hover:text-orange-500">
                            Erigga Chronicles
                          </a>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-4">Platform</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>
                          <a href="/premium" className="hover:text-orange-500">
                            Join Movement
                          </a>
                        </li>
                        <li>
                          <a href="/vault" className="hover:text-orange-500">
                            Media Vault
                          </a>
                        </li>
                        <li>
                          <a href="/merch" className="hover:text-orange-500">
                            Merch Store
                          </a>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-4">Support</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>
                          <a href="/contact" className="hover:text-orange-500">
                            Contact
                          </a>
                        </li>
                        <li>
                          <a href="/terms" className="hover:text-orange-500">
                            Terms
                          </a>
                        </li>
                        <li>
                          <a href="/privacy" className="hover:text-orange-500">
                            Privacy
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="border-t border-orange-500/20 mt-8 pt-8 text-center text-sm text-muted-foreground">
                    <p>
                      &copy; 2024 Erigga Fan Platform. All rights reserved. Built with street energy and premium
                      functionality.
                    </p>
                  </div>
                </div>
              </footer>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>

        {/* Paystack Script - Load with strategy="lazyOnload" to prevent blocking */}
        <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />
      </body>
    </html>
  )
}
