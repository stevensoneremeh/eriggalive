import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider as NextThemeProvider } from "next-themes"
import { ThemeProvider } from "@/contexts/theme-context"
import { Toaster } from "@/components/ui/sonner"
import { SessionRefresh } from "@/components/session-refresh"
import { UnifiedNavigation } from "@/components/navigation/unified-navigation"
import { createClient } from "@/lib/supabase/client"
import { SessionContextProvider } from "@supabase/auth-helpers-react"
import { AuthGuard } from "@/components/auth-guard"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Erigga Live - Official Fan Community",
  description:
    "Join the official Erigga fan community. Connect with fans, access exclusive content, and stay updated with the latest from Erigga.",
  keywords: "Erigga, Nigerian music, hip hop, fan community, exclusive content",
  authors: [{ name: "Erigga Live Team" }],
  openGraph: {
    title: "Erigga Live - Official Fan Community",
    description:
      "Join the official Erigga fan community. Connect with fans, access exclusive content, and stay updated with the latest from Erigga.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Erigga Live - Official Fan Community",
    description:
      "Join the official Erigga fan community. Connect with fans, access exclusive content, and stay updated with the latest from Erigga.",
  },
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionContextProvider supabaseClient={supabase}>
          <NextThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange={false}
            storageKey="erigga-theme"
          >
            <ThemeProvider>
              <AuthProvider>
                <SessionRefresh />
                <UnifiedNavigation />
                <AuthGuard>
                  <main className="min-h-screen bg-background text-foreground transition-colors duration-300">
                    {children}
                  </main>
                </AuthGuard>
                <Toaster
                  position="top-right"
                  toastOptions={{
                    className: "bg-background border-border text-foreground",
                  }}
                />
              </AuthProvider>
            </ThemeProvider>
          </NextThemeProvider>
        </SessionContextProvider>
      </body>
    </html>
  )
}
