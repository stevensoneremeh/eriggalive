import { LayoutDashboard, Settings, Users, Coins } from "lucide-react"

export const navigationConfig = {
  main: [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      description: "Your dashboard overview",
    },
    {
      name: "Users",
      href: "/users",
      icon: Users,
      description: "Manage your users",
    },
    {
      name: "Coins",
      href: "/coins",
      icon: Coins,
      description: "Manage your Erigga Coins",
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      description: "Manage your settings",
    },
  ],
}
