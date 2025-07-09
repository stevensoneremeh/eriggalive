import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { MainNavigation } from "@/components/navigation/main-navigation"
import { Toaster } from "@/components/ui/sonner"
import { PreviewModeIndicator } from "@/components/preview-mode-indicator"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EriggaLive - Official Fan Platform",
  description: "The official fan platform for Erigga - Connect, Chat, and Experience exclusive content",
  keywords: ["Erigga", "Nigerian Music", "Hip Hop", "Fan Platform", "Music Community"],
  authors: [{ name: "EriggaLive Team" }],
  creator: "EriggaLive",
  publisher: "EriggaLive",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "EriggaLive - Official Fan Platform",
    description: "The official fan platform for Erigga - Connect, Chat, and Experience exclusive content",
    url: "/",
    siteName: "EriggaLive",
    images: [
      {
        url: "/images/hero/erigga1.jpeg",
        width: 1200,
        height: 630,
        alt: "EriggaLive Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EriggaLive - Official Fan Platform",
    description: "The official fan platform for Erigga - Connect, Chat, and Experience exclusive content",
    images: ["/images/hero/erigga1.jpeg"],
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
            <div className="min-h-screen bg-background">
              <MainNavigation />
              <main className="pb-16 md:pb-0">{children}</main>
              <PreviewModeIndicator />
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
