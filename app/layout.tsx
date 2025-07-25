import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { SessionRefresh } from "@/components/session-refresh";
import { MainNavigation } from "@/components/navigation/main-navigation";
import { inter } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Erigga Live - Official Fan Platform",
  description: "Connect with Erigga and fellow fans on the official platform",
  manifest: "/manifest.json",
  themeColor: "#000000",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  generator: "eriggalive.com",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <SessionRefresh />
            <MainNavigation />
            <main className="pt-16">{children}</main>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
