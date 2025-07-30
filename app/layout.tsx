import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider as NextThemeProvider } from "next-themes"
import { ThemeProvider } from "@/contexts/theme-context"
import { Toaster } from "@/components/ui/sonner"
import { SessionRefresh } from "@/components/session-refresh"
import { Navigation } from "@/components/navigation"

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
  robots: "index, follow",
  generator: "v0.dev",
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
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
              <Navigation />
              <main className="min-h-screen bg-background text-foreground transition-colors duration-300">
                {children}
              </main>
              <Toaster
                position="top-right"
                toastOptions={{
                  className: "bg-background border-border text-foreground",
                }}
              />
            </AuthProvider>
          </ThemeProvider>
        </NextThemeProvider>
      </body>
    </html>
  )
}
