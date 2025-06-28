"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"

const UnifiedNavigation = () => {
  const { data: session } = useSession()

  return (
    <nav className="bg-gray-800 p-4 text-white">
      <div className="container mx-auto flex items-center justify-between">
        {/* Home Logo/Link */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold">My App</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center space-x-4">
          {session ? (
            <>
              <Link href="/profile">Profile</Link>
              <button onClick={() => signOut()} className="hover:text-gray-300">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link href="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default UnifiedNavigation
