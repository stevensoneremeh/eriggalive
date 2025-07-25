import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { RadioProvider } from "@/contexts/radio-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { SessionRefresh } from "@/components/session-refresh"
import { MainNavigation } from "@/components/navigation/main-navigation"
import { FloatingRadioPlayer } from "@/components/floating-radio-player"

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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <RadioProvider>
              <SessionRefresh />
              <MainNavigation />
              <main className="min-h-screen">{children}</main>
              <FloatingRadioPlayer />
              <Toaster />
            </RadioProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
