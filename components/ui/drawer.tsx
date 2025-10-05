<<<<<<< HEAD
"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"
=======
'use client'

import * as React from 'react'
import { Drawer as DrawerPrimitive } from 'vaul'

import { cn } from '@/lib/utils'
>>>>>>> new

const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
)
<<<<<<< HEAD
Drawer.displayName = "Drawer"
=======
Drawer.displayName = 'Drawer'
>>>>>>> new

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
<<<<<<< HEAD
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
=======
    className={cn('fixed inset-0 z-50 bg-black/80', className)}
>>>>>>> new
    {...props}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
<<<<<<< HEAD
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
        className
=======
        'fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background',
        className,
>>>>>>> new
      )}
      {...props}
    >
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
))
<<<<<<< HEAD
DrawerContent.displayName = "DrawerContent"
=======
DrawerContent.displayName = 'DrawerContent'
>>>>>>> new

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
<<<<<<< HEAD
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props}
  />
)
DrawerHeader.displayName = "DrawerHeader"
=======
    className={cn('grid gap-1.5 p-4 text-center sm:text-left', className)}
    {...props}
  />
)
DrawerHeader.displayName = 'DrawerHeader'
>>>>>>> new

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
<<<<<<< HEAD
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
)
DrawerFooter.displayName = "DrawerFooter"
=======
    className={cn('mt-auto flex flex-col gap-2 p-4', className)}
    {...props}
  />
)
DrawerFooter.displayName = 'DrawerFooter'
>>>>>>> new

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
<<<<<<< HEAD
      "text-lg font-semibold leading-none tracking-tight",
      className
=======
      'text-lg font-semibold leading-none tracking-tight',
      className,
>>>>>>> new
    )}
    {...props}
  />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
<<<<<<< HEAD
    className={cn("text-sm text-muted-foreground", className)}
=======
    className={cn('text-sm text-muted-foreground', className)}
>>>>>>> new
    {...props}
  />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
