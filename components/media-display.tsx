"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ImageIcon, Play, Volume2, FileText } from "lucide-react"

interface MediaDisplayProps {
  mediaUrls: string[]
  mediaTypes: string[]
  thumbnailUrls?: string[]
  className?: string
}

export function MediaDisplay({ mediaUrls, mediaTypes, thumbnailUrls, className = "" }: MediaDisplayProps) {
  const [selectedMedia, setSelectedMedia] = useState<number | null>(null)

  if (!mediaUrls.length) return null

  const handleMediaClick = (index: number) => {
    setSelectedMedia(index)
  }

  const handleClose = () => {
    setSelectedMedia(null)
  }

  const getMediaIcon = (type: string) => {
    if (type.startsWith("image")) return <ImageIcon className="h-5 w-5" />
    if (type.startsWith("video")) return <Play className="h-5 w-5" />
    if (type.startsWith("audio")) return <Volume2 className="h-5 w-5" />
    return <FileText className="h-5 w-5" />
  }

  const renderMedia = (url: string, type: string, index: number) => {
    if (type.startsWith("image")) {
      return (
        <div
          key={index}
          className="relative cursor-pointer rounded-md overflow-hidden"
          onClick={() => handleMediaClick(index)}
        >
          <img
            src={url || "/placeholder.svg"}
            alt={`Media ${index + 1}`}
            className="object-cover w-full h-full aspect-square"
          />
        </div>
      )
    }

    if (type.startsWith("video")) {
      return (
        <div
          key={index}
          className="relative cursor-pointer rounded-md overflow-hidden bg-black/10"
          onClick={() => handleMediaClick(index)}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/50 rounded-full p-3">
              <Play className="h-6 w-6 text-white" />
            </div>
          </div>
          <img
            src={thumbnailUrls?.[index] || "/placeholder.svg?height=300&width=300&text=Video"}
            alt={`Video ${index + 1}`}
            className="object-cover w-full h-full aspect-square"
          />
        </div>
      )
    }

    if (type.startsWith("audio")) {
      return (
        <div
          key={index}
          className="relative cursor-pointer rounded-md overflow-hidden bg-gradient-to-br from-orange-500/20 to-gold-400/20 flex items-center justify-center aspect-square"
          onClick={() => handleMediaClick(index)}
        >
          <div className="bg-orange-500/20 rounded-full p-4">
            <Volume2 className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      )
    }

    // Document or other file type
    return (
      <div
        key={index}
        className="relative cursor-pointer rounded-md overflow-hidden bg-muted flex items-center justify-center aspect-square"
        onClick={() => handleMediaClick(index)}
      >
        <div className="flex flex-col items-center justify-center">
          <FileText className="h-8 w-8 mb-2" />
          <span className="text-xs">View Document</span>
        </div>
      </div>
    )
  }

  const renderFullMedia = (url: string, type: string) => {
    if (type.startsWith("image")) {
      return (
        <img src={url || "/placeholder.svg"} alt="Full size media" className="max-h-[80vh] max-w-full object-contain" />
      )
    }

    if (type.startsWith("video")) {
      return <video src={url} controls autoPlay className="max-h-[80vh] max-w-full" />
    }

    if (type.startsWith("audio")) {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <Volume2 className="h-16 w-16 text-orange-500 mb-4" />
          <audio src={url} controls autoPlay className="w-full" />
        </div>
      )
    }

    // Document or other file type
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <FileText className="h-16 w-16 mb-4" />
        <p className="mb-4">This document cannot be previewed.</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-orange-500 hover:bg-orange-600 text-black px-4 py-2 rounded-md"
        >
          Download Document
        </a>
      </div>
    )
  }

  // Determine grid columns based on number of media items
  const gridCols =
    mediaUrls.length === 1
      ? "grid-cols-1"
      : mediaUrls.length === 2
        ? "grid-cols-2"
        : mediaUrls.length >= 3
          ? "grid-cols-3"
          : ""

  return (
    <>
      <div className={`grid ${gridCols} gap-2 mt-3 ${className}`}>
        {mediaUrls.map((url, index) => renderMedia(url, mediaTypes[index], index))}
      </div>

      {selectedMedia !== null && (
        <Dialog open={selectedMedia !== null} onOpenChange={handleClose}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background/95 backdrop-blur-sm">
            <DialogHeader className="sr-only">
              <DialogTitle>Media Viewer</DialogTitle>
            </DialogHeader>
            <div className="p-4 flex items-center justify-center">
              {renderFullMedia(mediaUrls[selectedMedia], mediaTypes[selectedMedia])}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}