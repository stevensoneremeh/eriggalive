import { Coins } from "lucide-react"
import { cn } from "@/lib/utils"

interface CoinBalanceProps {
  coins?: number
  size?: "sm" | "md" | "lg"
  className?: string
}

export function CoinBalance({ coins = 0, size = "md", className }: CoinBalanceProps) {
  const sizeClasses = {
    sm: "text-xs py-1 px-2",
    md: "text-sm py-1.5 px-3",
    lg: "text-base py-2 px-4",
  }

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 text-yellow-800 dark:text-yellow-300 font-medium rounded-full",
        sizeClasses[size],
        className,
      )}
    >
      <Coins className={cn("text-yellow-600 dark:text-yellow-400", iconSizes[size])} />
      <span>{coins.toLocaleString()}</span>
    </div>
  )
}
