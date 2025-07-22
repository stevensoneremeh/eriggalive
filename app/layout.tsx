import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/contexts/theme-context"
import { AuthProvider } from "@/contexts/auth-context"
import { RadioProvider } from "@/contexts/radio-context"
import { MainNavigation } from "@/components/navigation/main-navigation"
import { FloatingRadioPlayer } from "@/components/floating-radio-player"
import { Toaster } from "@/components/ui/sonner"
import { PreviewModeIndicator } from "@/components/preview-mode-indicator"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EriggaLive - Official Fan Platform",
  description:
    "The official fan platform for Nigerian rapper Erigga. Join the community, access exclusive content, and connect with fellow fans.",
  keywords: "Erigga, Nigerian rapper, hip hop, music, fan platform, community",
  authors: [{ name: "EriggaLive Team" }],
  creator: "EriggaLive",
  publisher: "EriggaLive",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://eriggalive.vercel.app"),
  openGraph: {
    title: "EriggaLive - Official Fan Platform",
    description: "The official fan platform for Nigerian rapper Erigga",
    url: "/",
    siteName: "EriggaLive",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EriggaLive - Official Fan Platform",
    description: "The official fan platform for Nigerian rapper Erigga",
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
      <body className={cn(inter.className, "antialiased")}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <RadioProvider>
              <div className="relative min-h-screen bg-background">
                <MainNavigation />
                <main className={cn("pt-16 pb-20 md:pb-4")}>{children}</main>
                <FloatingRadioPlayer />
                <PreviewModeIndicator />
                <Toaster position="top-right" />
              </div>
            </RadioProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
