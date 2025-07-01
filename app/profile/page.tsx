import { redirect } from "next/navigation"

/**
 * Root page – simply push everyone to /community.
 * Having an explicit page prevents Next-lite from generating
 * an extra dynamic 404 chunk that was failing to load.
 */
export default function Home() {
  redirect("/community")
}
