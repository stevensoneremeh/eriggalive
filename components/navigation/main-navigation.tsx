import { Archive, Home, LayoutDashboard, Settings } from "lucide-react"
import type { MainNavItem } from "@/types"

interface MainNavProps {
  items?: MainNavItem[]
}

export function MainNav({ items }: MainNavProps) {
  return (
    <div className="flex gap-6 md:gap-10">
      <Archive className="h-6 w-6" />
      <Home className="h-6 w-6" />
      <LayoutDashboard className="h-6 w-6" />
      <Settings className="h-6 w-6" />
      {items?.length
        ? items.map(
            (item, index) =>
              item.href && (
                <a
                  className="flex items-center text-sm font-medium transition-colors hover:text-foreground/80 sm:text-base"
                  key={index}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {item.title}
                </a>
              ),
          )
        : null}
    </div>
  )
}
