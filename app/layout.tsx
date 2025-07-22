import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { AblyProvider } from "@/contexts/ably-context"
import { Toaster } from "@/components/ui/toaster"
import { Navigation } from "@/components/navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Erigga Live - Community Hub",
  description: "Connect with fellow fans in the ultimate Erigga community experience",
  keywords: ["Erigga", "Music", "Community", "Chat", "Nigerian Hip Hop"],
  authors: [{ name: "Erigga Live Team" }],
  creator: "Erigga Live",
  publisher: "Erigga Live",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://eriggalive.vercel.app"),
  openGraph: {
    title: "Erigga Live - Community Hub",
    description: "Connect with fellow fans in the ultimate Erigga community experience",
    url: "/",
    siteName: "Erigga Live",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Erigga Live - Community Hub",
    description: "Connect with fellow fans in the ultimate Erigga community experience",
    creator: "@eriggalive",
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
    google: "your-google-verification-code",
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
          <AuthProvider>
            <AblyProvider>
              <div className="min-h-screen bg-background">
                <Navigation />
                <main className="pt-16">{children}</main>
              </div>
              <Toaster />
            </AblyProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
