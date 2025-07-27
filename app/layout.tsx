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
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <NextThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ThemeProvider>
            <AuthProvider>
              <SessionRefresh />
              <UnifiedNavigation />
              <main className="pt-16 pb-20 md:pb-0">{children}</main>
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
        </NextThemeProvider>
      </body>
    </html>
  )
}
