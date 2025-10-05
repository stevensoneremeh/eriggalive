<<<<<<< HEAD
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & {
    separator?: React.ReactNode
  }
>(({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />)
Breadcrumb.displayName = "Breadcrumb"

const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<"ol">
=======
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { ChevronRight, MoreHorizontal } from 'lucide-react'

import { cn } from '@/lib/utils'

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<'nav'> & {
    separator?: React.ReactNode
  }
>(({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />)
Breadcrumb.displayName = 'Breadcrumb'

const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<'ol'>
>>>>>>> new
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
<<<<<<< HEAD
      "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
      className
=======
      'flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5',
      className,
>>>>>>> new
    )}
    {...props}
  />
))
<<<<<<< HEAD
BreadcrumbList.displayName = "BreadcrumbList"

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("inline-flex items-center gap-1.5", className)}
    {...props}
  />
))
BreadcrumbItem.displayName = "BreadcrumbItem"

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & {
    asChild?: boolean
  }
>(({ asChild, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"
=======
BreadcrumbList.displayName = 'BreadcrumbList'

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<'li'>
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn('inline-flex items-center gap-1.5', className)}
    {...props}
  />
))
BreadcrumbItem.displayName = 'BreadcrumbItem'

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<'a'> & {
    asChild?: boolean
  }
>(({ asChild, className, ...props }, ref) => {
  const Comp = asChild ? Slot : 'a'
>>>>>>> new

  return (
    <Comp
      ref={ref}
<<<<<<< HEAD
      className={cn("transition-colors hover:text-foreground", className)}
=======
      className={cn('transition-colors hover:text-foreground', className)}
>>>>>>> new
      {...props}
    />
  )
})
<<<<<<< HEAD
BreadcrumbLink.displayName = "BreadcrumbLink"

const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
=======
BreadcrumbLink.displayName = 'BreadcrumbLink'

const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<'span'>
>>>>>>> new
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
<<<<<<< HEAD
    className={cn("font-normal text-foreground", className)}
    {...props}
  />
))
BreadcrumbPage.displayName = "BreadcrumbPage"
=======
    className={cn('font-normal text-foreground', className)}
    {...props}
  />
))
BreadcrumbPage.displayName = 'BreadcrumbPage'
>>>>>>> new

const BreadcrumbSeparator = ({
  children,
  className,
  ...props
<<<<<<< HEAD
}: React.ComponentProps<"li">) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn("[&>svg]:w-3.5 [&>svg]:h-3.5", className)}
=======
}: React.ComponentProps<'li'>) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn('[&>svg]:w-3.5 [&>svg]:h-3.5', className)}
>>>>>>> new
    {...props}
  >
    {children ?? <ChevronRight />}
  </li>
)
<<<<<<< HEAD
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"
=======
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator'
>>>>>>> new

const BreadcrumbEllipsis = ({
  className,
  ...props
<<<<<<< HEAD
}: React.ComponentProps<"span">) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn("flex h-9 w-9 items-center justify-center", className)}
=======
}: React.ComponentProps<'span'>) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn('flex h-9 w-9 items-center justify-center', className)}
>>>>>>> new
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
)
<<<<<<< HEAD
BreadcrumbEllipsis.displayName = "BreadcrumbElipssis"
=======
BreadcrumbEllipsis.displayName = 'BreadcrumbElipssis'
>>>>>>> new

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
