import type { ReactNode } from "react"

interface CommunityLayoutProps {
  leftSidebar: ReactNode
  children: ReactNode
  rightSidebar: ReactNode
}

export function CommunityLayout({ leftSidebar, children, rightSidebar }: CommunityLayoutProps) {
  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 h-full">
        {/* Left Sidebar */}
        <aside className="w-full lg:w-1/4 xl:w-1/5 lg:sticky lg:top-20 self-start order-2 lg:order-1 min-h-0">
          <div className="h-full overflow-hidden rounded-xl lg:rounded-2xl">{leftSidebar}</div>
        </aside>

        {/* Main Content */}
        <main className="w-full lg:w-1/2 xl:w-3/5 order-1 lg:order-2 min-h-0 flex-1">
          <div className="h-full overflow-hidden rounded-xl lg:rounded-2xl">{children}</div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-full lg:w-1/4 xl:w-1/5 lg:sticky lg:top-20 self-start order-3 lg:order-3 min-h-0">
          <div className="h-full overflow-hidden rounded-xl lg:rounded-2xl">{rightSidebar}</div>
        </aside>
      </div>
    </div>
  )
}
