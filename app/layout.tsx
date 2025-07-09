import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/contexts/theme-context"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/sonner"
import { MainNavigation } from "@/components/navigation/main-navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Erigga Live - Official Fan Platform",
  description:
    "Join the official Erigga fan community. Access exclusive content, connect with fans, and support your favorite artist.",
  keywords: "Erigga, Nigerian music, fan platform, exclusive content, community",
  authors: [{ name: "Erigga Live Team" }],
  openGraph: {
    title: "Erigga Live - Official Fan Platform",
    description: "Join the official Erigga fan community",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Erigga Live - Official Fan Platform",
    description: "Join the official Erigga fan community",
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
        <ThemeProvider>
          <AuthProvider>
            <div className="min-h-screen bg-background">
              <MainNavigation />
              <main>{children}</main>
              <Toaster />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
