"use client"

import { Sidebar, SidebarContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { MessageCircle, Users } from "lucide-react"

/**
 * Compact sidebar for all chat pages.
 *  – General Chat
 *  – Freebies Chat
 *  (Extend freely with more rooms.)
 */
export function ChatSidebar() {
  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/chat/general">
                <MessageCircle className="shrink-0" />
                <span>General</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/chat/freebies">
                <Users className="shrink-0" />
                <span>Freebies</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}

export default ChatSidebar
