import { signout } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"

export function LogoutButton() {
  return (
    <form action={signout}>
      <Button type="submit" variant="outline" size="sm">
        Sign Out
      </Button>
    </form>
  )
}
