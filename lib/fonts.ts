import { Inter } from "next/font/google"

/**
 * Utility font exports.
 * Keeps legacy imports alive without affecting bundle size.
 */
export const fontSans = Inter({ subsets: ["latin"] })
