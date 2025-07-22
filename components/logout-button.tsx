import { signout } from "@/app/auth/actions"

export function LogoutButton() {
  return (
    <form action={signout}>
      <button type="submit" className="text-sm text-gray-700 hover:text-gray-900">
        Sign out
      </button>
    </form>
  )
}
