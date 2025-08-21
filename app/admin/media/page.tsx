"use client"
import { useState, useEffect, useCallback } from "react"
import type React from "react"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, RefreshCw, Trash2, ImageIcon, File } from "lucide-react"
import { cn } from "@/lib/utils"

interface MediaFile {
  name: string
  size?: number
  created_at?: string
  metadata?: any
}

export default function MediaPage() {
  const supabase = createClientComponentClient()
  const [files, setFiles] = useState<FileList | null>(null)
  const [listing, setListing] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFiles(e.dataTransfer.files)
    }
  }, [])

  const upload = async () => {
    if (!files) return
    setLoading(true)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const path = `${Date.now()}-${file.name}`
        const { error } = await supabase.storage.from("media").upload(path, file, { upsert: false })

        if (error) {
          throw new Error(`Upload error for ${file.name}: ${error.message}`)
        }
        return path
      })

      await Promise.all(uploadPromises)
      await load()
      setFiles(null)

      // Reset file input
      const fileInput = document.getElementById("file-input") as HTMLInputElement
      if (fileInput) fileInput.value = ""
    } catch (error) {
      console.error("Upload error:", error)
      alert(`Upload failed: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const load = async () => {
    try {
      const { data, error } = await supabase.storage.from("media").list("", {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      })

      if (error) {
        console.error("Load error:", error)
        return
      }

      setListing(data || [])
    } catch (error) {
      console.error("Load error:", error)
    }
  }

  const remove = async (name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    try {
      const { error } = await supabase.storage.from("media").remove([name])

      if (error) {
        alert(`Delete error: ${error.message}`)
      } else {
        await load()
      }
    } catch (error) {
      console.error("Delete error:", error)
    }
  }

  const getFileUrl = (fileName: string) => {
    const { data } = supabase.storage.from("media").getPublicUrl(fileName)
    return data.publicUrl
  }

  const isImage = (fileName: string) => {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Media Management</h1>
        <Button onClick={load} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              "hover:border-primary hover:bg-primary/5",
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-lg font-medium">{dragActive ? "Drop files here" : "Drag and drop files here"}</p>
              <p className="text-sm text-muted-foreground">or</p>
              <input
                id="file-input"
                type="file"
                multiple
                onChange={(e) => setFiles(e.target.files)}
                className="hidden"
              />
              <Button variant="outline" onClick={() => document.getElementById("file-input")?.click()}>
                Choose Files
              </Button>
            </div>
          </div>

          {files && files.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium">Selected files:</p>
              <ul className="text-sm space-y-1">
                {Array.from(files).map((file, index) => (
                  <li key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span>{file.name}</span>
                    <span className="text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={upload} disabled={loading || !files || files.length === 0} className="flex-1">
              {loading ? "Uploading..." : `Upload ${files?.length || 0} file(s)`}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Media Files ({listing.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {listing.length === 0 ? (
            <div className="text-center py-12">
              <File className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No files uploaded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {listing.map((file) => (
                <Card key={file.name} className="overflow-hidden">
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    {isImage(file.name) ? (
                      <img
                        src={getFileUrl(file.name) || "/placeholder.svg"}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <p className="text-sm font-medium truncate" title={file.name}>
                        {file.name}
                      </p>
                      {file.size && <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>}
                      <Button onClick={() => remove(file.name)} variant="destructive" size="sm" className="w-full">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
