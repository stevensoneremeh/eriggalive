import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { RadioProvider } from "@/contexts/radio-context"
import { ThemeContextProvider } from "@/contexts/theme-context"
import { MainNavigation } from "@/components/navigation/main-navigation"
import { Toaster } from "@/components/ui/sonner"
import { Toaster as ToasterUI } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Erigga Live - Official Community Platform",
  description: "Connect with Erigga and fellow fans on the official community platform",
  keywords: ["Erigga", "Music", "Community", "Nigerian Hip Hop", "Warri"],
  authors: [{ name: "Erigga Live Team" }],
  creator: "Erigga Live",
  publisher: "Erigga Live",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://eriggalive.com"),
  openGraph: {
    title: "Erigga Live - Official Community Platform",
    description: "Connect with Erigga and fellow fans on the official community platform",
    url: "/",
    siteName: "Erigga Live",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Erigga Live - Official Community Platform",
    description: "Connect with Erigga and fellow fans on the official community platform",
    creator: "@eriggaofficial",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
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
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ThemeContextProvider>
            <AuthProvider>
              <RadioProvider>
                <div className="min-h-screen bg-background">
                  <MainNavigation />
                  <main className="pt-16">{children}</main>
                </div>
                <Toaster />
                <ToasterUI />
              </RadioProvider>
            </AuthProvider>
          </ThemeContextProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
