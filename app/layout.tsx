import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { RadioProvider } from "@/contexts/radio-context"
import { MainNavigation } from "@/components/navigation/main-navigation"
import { FloatingRadioPlayer } from "@/components/floating-radio-player"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Erigga Meet & Greet",
  description: "Official Erigga fan platform",
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
              <div className="min-h-screen bg-background">
                <MainNavigation />
                <main className="pt-16">{children}</main>
                <FloatingRadioPlayer />
                <Toaster />
              </div>
            </RadioProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
