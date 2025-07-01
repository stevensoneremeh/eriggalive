import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Navigation } from "@/components/navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Erigga Live - Official Fan Platform",
  description:
    "The official platform for Erigga fans. Access exclusive content, music, and connect with the community.",
  keywords: ["Erigga", "Nigerian Music", "Hip Hop", "Rap", "Music Platform"],
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
    title: "Erigga Live - Official Fan Platform",
    description:
      "The official platform for Erigga fans. Access exclusive content, music, and connect with the community.",
    url: "/",
    siteName: "Erigga Live",
    images: [
      {
        url: "/images/og-image.jpg",
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
    description:
      "The official platform for Erigga fans. Access exclusive content, music, and connect with the community.",
    images: ["/images/og-image.jpg"],
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
          <div className="min-h-screen bg-background">
            <Navigation />
            <main className="flex-1">{children}</main>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
