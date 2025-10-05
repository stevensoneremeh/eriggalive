<<<<<<< HEAD
"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
=======
'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { VariantProps, cva } from 'class-variance-authority'
import { PanelLeft } from 'lucide-react'

import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
>>>>>>> new
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
<<<<<<< HEAD
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar:state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContext = {
  state: "expanded" | "collapsed"
=======
} from '@/components/ui/tooltip'

const SIDEBAR_COOKIE_NAME = 'sidebar:state'
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = '16rem'
const SIDEBAR_WIDTH_MOBILE = '18rem'
const SIDEBAR_WIDTH_ICON = '3rem'
const SIDEBAR_KEYBOARD_SHORTCUT = 'b'

type SidebarContext = {
  state: 'expanded' | 'collapsed'
>>>>>>> new
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
<<<<<<< HEAD
    throw new Error("useSidebar must be used within a SidebarProvider.")
=======
    throw new Error('useSidebar must be used within a SidebarProvider.')
>>>>>>> new
  }

  return context
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
<<<<<<< HEAD
  React.ComponentProps<"div"> & {
=======
  React.ComponentProps<'div'> & {
>>>>>>> new
    defaultOpen?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
<<<<<<< HEAD
    ref
=======
    ref,
>>>>>>> new
  ) => {
    const isMobile = useIsMobile()
    const [openMobile, setOpenMobile] = React.useState(false)

    // This is the internal state of the sidebar.
    // We use openProp and setOpenProp for control from outside the component.
    const [_open, _setOpen] = React.useState(defaultOpen)
    const open = openProp ?? _open
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
<<<<<<< HEAD
        const openState = typeof value === "function" ? value(open) : value
=======
        const openState = typeof value === 'function' ? value(open) : value
>>>>>>> new
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }

        // This sets the cookie to keep the sidebar state.
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
      },
<<<<<<< HEAD
      [setOpenProp, open]
=======
      [setOpenProp, open],
>>>>>>> new
    )

    // Helper to toggle the sidebar.
    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((open) => !open)
        : setOpen((open) => !open)
    }, [isMobile, setOpen, setOpenMobile])

    // Adds a keyboard shortcut to toggle the sidebar.
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault()
          toggleSidebar()
        }
      }

<<<<<<< HEAD
      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
=======
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
>>>>>>> new
    }, [toggleSidebar])

    // We add a state so that we can do data-state="expanded" or "collapsed".
    // This makes it easier to style the sidebar with Tailwind classes.
<<<<<<< HEAD
    const state = open ? "expanded" : "collapsed"
=======
    const state = open ? 'expanded' : 'collapsed'
>>>>>>> new

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
<<<<<<< HEAD
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
=======
      [
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      ],
>>>>>>> new
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            style={
              {
<<<<<<< HEAD
                "--sidebar-width": SIDEBAR_WIDTH,
                "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
=======
                '--sidebar-width': SIDEBAR_WIDTH,
                '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
>>>>>>> new
                ...style,
              } as React.CSSProperties
            }
            className={cn(
<<<<<<< HEAD
              "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar",
              className
=======
              'group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar',
              className,
>>>>>>> new
            )}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    )
<<<<<<< HEAD
  }
)
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right"
    variant?: "sidebar" | "floating" | "inset"
    collapsible?: "offcanvas" | "icon" | "none"
=======
  },
)
SidebarProvider.displayName = 'SidebarProvider'

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    side?: 'left' | 'right'
    variant?: 'sidebar' | 'floating' | 'inset'
    collapsible?: 'offcanvas' | 'icon' | 'none'
>>>>>>> new
  }
>(
  (
    {
<<<<<<< HEAD
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
=======
      side = 'left',
      variant = 'sidebar',
      collapsible = 'offcanvas',
>>>>>>> new
      className,
      children,
      ...props
    },
<<<<<<< HEAD
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

    if (collapsible === "none") {
      return (
        <div
          className={cn(
            "flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground",
            className
=======
    ref,
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

    if (collapsible === 'none') {
      return (
        <div
          className={cn(
            'flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground',
            className,
>>>>>>> new
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      )
    }

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="w-[--sidebar-width] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
            style={
              {
<<<<<<< HEAD
                "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
=======
                '--sidebar-width': SIDEBAR_WIDTH_MOBILE,
>>>>>>> new
              } as React.CSSProperties
            }
            side={side}
          >
            <div className="flex h-full w-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      )
    }

    return (
      <div
        ref={ref}
        className="group peer hidden md:block text-sidebar-foreground"
        data-state={state}
<<<<<<< HEAD
        data-collapsible={state === "collapsed" ? collapsible : ""}
=======
        data-collapsible={state === 'collapsed' ? collapsible : ''}
>>>>>>> new
        data-variant={variant}
        data-side={side}
      >
        {/* This is what handles the sidebar gap on desktop */}
        <div
          className={cn(
<<<<<<< HEAD
            "duration-200 relative h-svh w-[--sidebar-width] bg-transparent transition-[width] ease-linear",
            "group-data-[collapsible=offcanvas]:w-0",
            "group-data-[side=right]:rotate-180",
            variant === "floating" || variant === "inset"
              ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]"
              : "group-data-[collapsible=icon]:w-[--sidebar-width-icon]"
=======
            'duration-200 relative h-svh w-[--sidebar-width] bg-transparent transition-[width] ease-linear',
            'group-data-[collapsible=offcanvas]:w-0',
            'group-data-[side=right]:rotate-180',
            variant === 'floating' || variant === 'inset'
              ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]'
              : 'group-data-[collapsible=icon]:w-[--sidebar-width-icon]',
>>>>>>> new
          )}
        />
        <div
          className={cn(
<<<<<<< HEAD
            "duration-200 fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] ease-linear md:flex",
            side === "left"
              ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
              : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
            // Adjust the padding for floating and inset variants.
            variant === "floating" || variant === "inset"
              ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]"
              : "group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l",
            className
=======
            'duration-200 fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] ease-linear md:flex',
            side === 'left'
              ? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
              : 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
            // Adjust the padding for floating and inset variants.
            variant === 'floating' || variant === 'inset'
              ? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]'
              : 'group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l',
            className,
>>>>>>> new
          )}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow"
          >
            {children}
          </div>
        </div>
      </div>
    )
<<<<<<< HEAD
  }
)
Sidebar.displayName = "Sidebar"
=======
  },
)
Sidebar.displayName = 'Sidebar'
>>>>>>> new

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
<<<<<<< HEAD
      className={cn("h-7 w-7", className)}
=======
      className={cn('h-7 w-7', className)}
>>>>>>> new
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
<<<<<<< HEAD
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarRail = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
=======
SidebarTrigger.displayName = 'SidebarTrigger'

const SidebarRail = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'>
>>>>>>> new
>(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      ref={ref}
      data-sidebar="rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
<<<<<<< HEAD
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex",
        "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className
=======
        'absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex',
        '[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize',
        '[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize',
        'group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar',
        '[[data-side=left][data-collapsible=offcanvas]_&]:-right-2',
        '[[data-side=right][data-collapsible=offcanvas]_&]:-left-2',
        className,
>>>>>>> new
      )}
      {...props}
    />
  )
})
<<<<<<< HEAD
SidebarRail.displayName = "SidebarRail"

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"main">
=======
SidebarRail.displayName = 'SidebarRail'

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'main'>
>>>>>>> new
>(({ className, ...props }, ref) => {
  return (
    <main
      ref={ref}
      className={cn(
<<<<<<< HEAD
        "relative flex min-h-svh flex-1 flex-col bg-background",
        "peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow",
        className
=======
        'relative flex min-h-svh flex-1 flex-col bg-background',
        'peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow',
        className,
>>>>>>> new
      )}
      {...props}
    />
  )
})
<<<<<<< HEAD
SidebarInset.displayName = "SidebarInset"
=======
SidebarInset.displayName = 'SidebarInset'
>>>>>>> new

const SidebarInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      data-sidebar="input"
      className={cn(
<<<<<<< HEAD
        "h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        className
=======
        'h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
        className,
>>>>>>> new
      )}
      {...props}
    />
  )
})
<<<<<<< HEAD
SidebarInput.displayName = "SidebarInput"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
=======
SidebarInput.displayName = 'SidebarInput'

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>>>>>>> new
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="header"
<<<<<<< HEAD
      className={cn("flex flex-col gap-2 p-2", className)}
=======
      className={cn('flex flex-col gap-2 p-2', className)}
>>>>>>> new
      {...props}
    />
  )
})
<<<<<<< HEAD
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
=======
SidebarHeader.displayName = 'SidebarHeader'

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>>>>>>> new
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="footer"
<<<<<<< HEAD
      className={cn("flex flex-col gap-2 p-2", className)}
=======
      className={cn('flex flex-col gap-2 p-2', className)}
>>>>>>> new
      {...props}
    />
  )
})
<<<<<<< HEAD
SidebarFooter.displayName = "SidebarFooter"
=======
SidebarFooter.displayName = 'SidebarFooter'
>>>>>>> new

const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  return (
    <Separator
      ref={ref}
      data-sidebar="separator"
<<<<<<< HEAD
      className={cn("mx-2 w-auto bg-sidebar-border", className)}
=======
      className={cn('mx-2 w-auto bg-sidebar-border', className)}
>>>>>>> new
      {...props}
    />
  )
})
<<<<<<< HEAD
SidebarSeparator.displayName = "SidebarSeparator"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
=======
SidebarSeparator.displayName = 'SidebarSeparator'

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>>>>>>> new
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn(
<<<<<<< HEAD
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className
=======
        'flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden',
        className,
>>>>>>> new
      )}
      {...props}
    />
  )
})
<<<<<<< HEAD
SidebarContent.displayName = "SidebarContent"

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
=======
SidebarContent.displayName = 'SidebarContent'

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>>>>>>> new
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="group"
<<<<<<< HEAD
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
=======
      className={cn('relative flex w-full min-w-0 flex-col p-2', className)}
>>>>>>> new
      {...props}
    />
  )
})
<<<<<<< HEAD
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div"
=======
SidebarGroup.displayName = 'SidebarGroup'

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'div'
>>>>>>> new

  return (
    <Comp
      ref={ref}
      data-sidebar="group-label"
      className={cn(
<<<<<<< HEAD
        "duration-200 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opa] ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className
=======
        'duration-200 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opa] ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
        'group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0',
        className,
>>>>>>> new
      )}
      {...props}
    />
  )
})
<<<<<<< HEAD
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarGroupAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
=======
SidebarGroupLabel.displayName = 'SidebarGroupLabel'

const SidebarGroupAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
>>>>>>> new

  return (
    <Comp
      ref={ref}
      data-sidebar="group-action"
      className={cn(
<<<<<<< HEAD
        "absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "group-data-[collapsible=icon]:hidden",
        className
=======
        'absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
        // Increases the hit area of the button on mobile.
        'after:absolute after:-inset-2 after:md:hidden',
        'group-data-[collapsible=icon]:hidden',
        className,
>>>>>>> new
      )}
      {...props}
    />
  )
})
<<<<<<< HEAD
SidebarGroupAction.displayName = "SidebarGroupAction"

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
=======
SidebarGroupAction.displayName = 'SidebarGroupAction'

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>>>>>>> new
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="group-content"
<<<<<<< HEAD
    className={cn("w-full text-sm", className)}
    {...props}
  />
))
SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
=======
    className={cn('w-full text-sm', className)}
    {...props}
  />
))
SidebarGroupContent.displayName = 'SidebarGroupContent'

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<'ul'>
>>>>>>> new
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
<<<<<<< HEAD
    className={cn("flex w-full min-w-0 flex-col gap-1", className)}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
=======
    className={cn('flex w-full min-w-0 flex-col gap-1', className)}
    {...props}
  />
))
SidebarMenu.displayName = 'SidebarMenu'

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<'li'>
>>>>>>> new
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
<<<<<<< HEAD
    className={cn("group/menu-item relative", className)}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:!p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
=======
    className={cn('group/menu-item relative', className)}
    {...props}
  />
))
SidebarMenuItem.displayName = 'SidebarMenuItem'

const sidebarMenuButtonVariants = cva(
  'peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        outline:
          'bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]',
      },
      size: {
        default: 'h-8 text-sm',
        sm: 'h-7 text-xs',
        lg: 'h-12 text-sm group-data-[collapsible=icon]:!p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
>>>>>>> new
)

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
<<<<<<< HEAD
  React.ComponentProps<"button"> & {
=======
  React.ComponentProps<'button'> & {
>>>>>>> new
    asChild?: boolean
    isActive?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    {
      asChild = false,
      isActive = false,
<<<<<<< HEAD
      variant = "default",
      size = "default",
=======
      variant = 'default',
      size = 'default',
>>>>>>> new
      tooltip,
      className,
      ...props
    },
<<<<<<< HEAD
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
=======
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button'
>>>>>>> new
    const { isMobile, state } = useSidebar()

    const button = (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
        {...props}
      />
    )

    if (!tooltip) {
      return button
    }

<<<<<<< HEAD
    if (typeof tooltip === "string") {
=======
    if (typeof tooltip === 'string') {
>>>>>>> new
      tooltip = {
        children: tooltip,
      }
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
<<<<<<< HEAD
          hidden={state !== "collapsed" || isMobile}
=======
          hidden={state !== 'collapsed' || isMobile}
>>>>>>> new
          {...tooltip}
        />
      </Tooltip>
    )
<<<<<<< HEAD
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
=======
  },
)
SidebarMenuButton.displayName = 'SidebarMenuButton'

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'> & {
>>>>>>> new
    asChild?: boolean
    showOnHover?: boolean
  }
>(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
<<<<<<< HEAD
  const Comp = asChild ? Slot : "button"
=======
  const Comp = asChild ? Slot : 'button'
>>>>>>> new

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-action"
      className={cn(
<<<<<<< HEAD
        "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
          "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
        className
=======
        'absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0',
        // Increases the hit area of the button on mobile.
        'after:absolute after:-inset-2 after:md:hidden',
        'peer-data-[size=sm]/menu-button:top-1',
        'peer-data-[size=default]/menu-button:top-1.5',
        'peer-data-[size=lg]/menu-button:top-2.5',
        'group-data-[collapsible=icon]:hidden',
        showOnHover &&
          'group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0',
        className,
>>>>>>> new
      )}
      {...props}
    />
  )
})
<<<<<<< HEAD
SidebarMenuAction.displayName = "SidebarMenuAction"

const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
=======
SidebarMenuAction.displayName = 'SidebarMenuAction'

const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>>>>>>> new
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="menu-badge"
    className={cn(
<<<<<<< HEAD
      "absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground select-none pointer-events-none",
      "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
      "peer-data-[size=sm]/menu-button:top-1",
      "peer-data-[size=default]/menu-button:top-1.5",
      "peer-data-[size=lg]/menu-button:top-2.5",
      "group-data-[collapsible=icon]:hidden",
      className
=======
      'absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground select-none pointer-events-none',
      'peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground',
      'peer-data-[size=sm]/menu-button:top-1',
      'peer-data-[size=default]/menu-button:top-1.5',
      'peer-data-[size=lg]/menu-button:top-2.5',
      'group-data-[collapsible=icon]:hidden',
      className,
>>>>>>> new
    )}
    {...props}
  />
))
<<<<<<< HEAD
SidebarMenuBadge.displayName = "SidebarMenuBadge"

const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
=======
SidebarMenuBadge.displayName = 'SidebarMenuBadge'

const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
>>>>>>> new
    showIcon?: boolean
  }
>(({ className, showIcon = false, ...props }, ref) => {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`
  }, [])

  return (
    <div
      ref={ref}
      data-sidebar="menu-skeleton"
<<<<<<< HEAD
      className={cn("rounded-md h-8 flex gap-2 px-2 items-center", className)}
=======
      className={cn('rounded-md h-8 flex gap-2 px-2 items-center', className)}
>>>>>>> new
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 flex-1 max-w-[--skeleton-width]"
        data-sidebar="menu-skeleton-text"
        style={
          {
<<<<<<< HEAD
            "--skeleton-width": width,
=======
            '--skeleton-width': width,
>>>>>>> new
          } as React.CSSProperties
        }
      />
    </div>
  )
})
<<<<<<< HEAD
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton"

const SidebarMenuSub = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
=======
SidebarMenuSkeleton.displayName = 'SidebarMenuSkeleton'

const SidebarMenuSub = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<'ul'>
>>>>>>> new
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu-sub"
    className={cn(
<<<<<<< HEAD
      "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",
      "group-data-[collapsible=icon]:hidden",
      className
=======
      'mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5',
      'group-data-[collapsible=icon]:hidden',
      className,
>>>>>>> new
    )}
    {...props}
  />
))
<<<<<<< HEAD
SidebarMenuSub.displayName = "SidebarMenuSub"

const SidebarMenuSubItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ ...props }, ref) => <li ref={ref} {...props} />)
SidebarMenuSubItem.displayName = "SidebarMenuSubItem"

const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<"a"> & {
    asChild?: boolean
    size?: "sm" | "md"
    isActive?: boolean
  }
>(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"
=======
SidebarMenuSub.displayName = 'SidebarMenuSub'

const SidebarMenuSubItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<'li'>
>(({ ...props }, ref) => <li ref={ref} {...props} />)
SidebarMenuSubItem.displayName = 'SidebarMenuSubItem'

const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<'a'> & {
    asChild?: boolean
    size?: 'sm' | 'md'
    isActive?: boolean
  }
>(({ asChild = false, size = 'md', isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : 'a'
>>>>>>> new

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
<<<<<<< HEAD
        "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className
=======
        'flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground',
        'data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground',
        size === 'sm' && 'text-xs',
        size === 'md' && 'text-sm',
        'group-data-[collapsible=icon]:hidden',
        className,
>>>>>>> new
      )}
      {...props}
    />
  )
})
<<<<<<< HEAD
SidebarMenuSubButton.displayName = "SidebarMenuSubButton"
=======
SidebarMenuSubButton.displayName = 'SidebarMenuSubButton'
>>>>>>> new

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
