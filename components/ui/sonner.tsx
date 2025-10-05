<<<<<<< HEAD
"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
=======
'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner } from 'sonner'
>>>>>>> new

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
<<<<<<< HEAD
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
=======
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
>>>>>>> new
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
<<<<<<< HEAD
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
=======
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
>>>>>>> new
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
