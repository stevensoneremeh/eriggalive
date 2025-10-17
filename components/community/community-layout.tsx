import type { ReactNode } from "react"

interface CommunityLayoutProps {
  leftSidebar: ReactNode
  children: ReactNode
  rightSidebar: ReactNode
}

export function CommunityLayout({ leftSidebar, children, rightSidebar }: CommunityLayoutProps) {
  return (
    <div className="container mx-auto px-2 sm:px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar */}
        <aside className="w-full lg:w-1/4 xl:w-1/5 lg:sticky lg:top-20 self-start order-2 lg:order-1">
          {leftSidebar}
        </aside>

        {/* Main Content */}
        <main className="w-full lg:w-1/2 xl:w-3/5 order-1 lg:order-2">{children}</main>

        {/* Right Sidebar */}
        <aside className="w-full lg:w-1/4 xl:w-1/5 lg:sticky lg:top-20 self-start order-3 lg:order-3">
          {rightSidebar}
        </aside>
      </div>
    </div>
  )
}
