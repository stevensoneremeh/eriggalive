import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { RadioProvider } from "@/contexts/radio-context"
import { Toaster } from "@/components/ui/sonner"
import { MainNavigation } from "@/components/navigation/main-navigation"
import { FloatingRadioPlayer } from "@/components/floating-radio-player"
import { SessionRefresh } from "@/components/session-refresh"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Erigga Live - Official Fan Platform",
  description:
    "Connect with Erigga and fellow fans. Access exclusive content, join tier-based communities, and experience the ultimate fan platform.",
  keywords: "Erigga, Nigerian music, hip hop, fan platform, exclusive content",
  authors: [{ name: "Erigga Live Team" }],
  creator: "Erigga Live",
  publisher: "Erigga Live",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://erigga-live.vercel.app"),
  openGraph: {
    title: "Erigga Live - Official Fan Platform",
    description: "Connect with Erigga and fellow fans. Access exclusive content, join tier-based communities.",
    url: "/",
    siteName: "Erigga Live",
    images: [
      {
        url: "/images/hero/erigga1.jpeg",
        width: 1200,
        height: 630,
        alt: "Erigga Live Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Erigga Live - Official Fan Platform",
    description: "Connect with Erigga and fellow fans. Access exclusive content, join tier-based communities.",
    images: ["/images/hero/erigga1.jpeg"],
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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/images/loggotrans-light.png" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <RadioProvider>
              <div className="min-h-screen bg-background">
                <MainNavigation />
                <main className="pt-16">{children}</main>
                <FloatingRadioPlayer />
                <SessionRefresh />
              </div>
              <Toaster />
            </RadioProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
