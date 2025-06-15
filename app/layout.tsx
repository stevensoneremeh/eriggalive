import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider as CustomThemeProvider } from "@/contexts/theme-context"
import { AuthErrorBoundary } from "@/components/auth-error-boundary"
import { Navigation } from "@/components/navigation"
import { Toaster } from "@/components/ui/toaster"
import { Suspense } from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Erigga Fan Platform",
  description: "The official fan platform for Erigga - Connect, engage, and experience exclusive content",
  keywords: ["Erigga", "music", "fan platform", "Nigerian music", "hip hop"],
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
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "Erigga Fan Platform",
    description: "The official fan platform for Erigga",
    siteName: "Erigga Fan Platform",
  },
  twitter: {
    card: "summary_large_image",
    title: "Erigga Fan Platform",
    description: "The official fan platform for Erigga",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
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
      <head>
        <meta name="theme-color" content="#84cc16" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <AuthErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
            <CustomThemeProvider>
              <Suspense
                fallback={
                  <div className="flex min-h-screen items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-500"></div>
                  </div>
                }
              >
                <AuthProvider>
                  <div className="min-h-screen flex flex-col">
                    <Navigation />
                    <main className="flex-1 pt-16">{children}</main>
                    <footer className="border-t bg-background/95 backdrop-blur">
                      <div className="container mx-auto px-4 py-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                          <div>
                            <h4 className="font-semibold mb-4">Erigga Fan Platform</h4>
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
                  </div>
                  <Toaster />
                </AuthProvider>
              </Suspense>
            </CustomThemeProvider>
          </ThemeProvider>
        </AuthErrorBoundary>
      </body>
    </html>
  )
}
