import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { MainNavigation } from "@/components/navigation/main-navigation"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Erigga Live - Official Fan Platform",
  description:
    "Join the official Erigga fan community. Access exclusive content, connect with fans, and support your favorite artist.",
  keywords: "Erigga, Nigerian music, hip hop, fan community, exclusive content",
  authors: [{ name: "Erigga Live Team" }],
  creator: "Erigga Live",
  publisher: "Erigga Live",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://eriggalive.vercel.app"),
  openGraph: {
    title: "Erigga Live - Official Fan Platform",
    description:
      "Join the official Erigga fan community. Access exclusive content, connect with fans, and support your favorite artist.",
    url: "/",
    siteName: "Erigga Live",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Erigga Live - Official Fan Platform",
    description:
      "Join the official Erigga fan community. Access exclusive content, connect with fans, and support your favorite artist.",
    creator: "@eriggalive",
  },
  robots: {
    index: true,
    follow: true,
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
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f97316" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Erigga Live" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.className} min-h-screen bg-background font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <div className="relative flex min-h-screen flex-col">
              <MainNavigation />
              <main className="flex-1 pt-16">{children}</main>
            </div>
            <Toaster />
            <SonnerToaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
