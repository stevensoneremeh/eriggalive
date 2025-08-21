"use client"
import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Upload,
  Trash2,
  Download,
  Search,
  Grid,
  List,
  ImageIcon,
  Video,
  Music,
  FileText,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface MediaFile {
  name: string
  id: string
  created_at: string
  updated_at: string
  last_accessed_at: string
  metadata: {
    size: number
    mimetype: string
    cacheControl: string
  }
}

export default function MediaPage() {
  const supabase = createClientComponentClient()
  const [files, setFiles] = useState<File[]>([])
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])

  const loadMediaFiles = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.storage.from("media").list("", {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      })

      if (error) {
        console.error("Load error:", error)
        toast.error("Failed to load media files")
        return
      }

      setMediaFiles(data || [])
    } catch (error) {
      console.error("Load error:", error)
      toast.error("Failed to load media files")
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async () => {
    if (!files.length) return

    setUploading(true)
    let successCount = 0
    let errorCount = 0

    try {
      for (const file of files) {
        const path = `admin/${Date.now()}-${file.name}`
        const { error } = await supabase.storage.from("media").upload(path, file, {
          upsert: false,
          cacheControl: "3600",
        })

        if (error) {
          console.error(`Upload error for ${file.name}:`, error)
          errorCount++
        } else {
          successCount++
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} file(s)`)
        await loadMediaFiles()
        setFiles([])
        // Reset file input
        const fileInput = document.getElementById("file-input") as HTMLInputElement
        if (fileInput) fileInput.value = ""
      }

      if (errorCount > 0) {
        toast.error(`Failed to upload ${errorCount} file(s)`)
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleFileDelete = async (fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return

    try {
      const { error } = await supabase.storage.from("media").remove([fileName])

      if (error) {
        console.error("Delete error:", error)
        toast.error(`Failed to delete ${fileName}`)
      } else {
        toast.success(`Deleted ${fileName}`)
        await loadMediaFiles()
        setSelectedFiles((prev) => prev.filter((f) => f !== fileName))
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Delete failed")
    }
  }

  const handleBulkDelete = async () => {
    if (!selectedFiles.length) return

    if (!confirm(`Are you sure you want to delete ${selectedFiles.length} selected file(s)?`)) return

    try {
      const { error } = await supabase.storage.from("media").remove(selectedFiles)

      if (error) {
        console.error("Bulk delete error:", error)
        toast.error("Failed to delete selected files")
      } else {
        toast.success(`Deleted ${selectedFiles.length} file(s)`)
        await loadMediaFiles()
        setSelectedFiles([])
      }
    } catch (error) {
      console.error("Bulk delete error:", error)
      toast.error("Bulk delete failed")
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith("image/")) return <ImageIcon className="h-5 w-5" />
    if (mimeType?.startsWith("video/")) return <Video className="h-5 w-5" />
    if (mimeType?.startsWith("audio/")) return <Music className="h-5 w-5" />
    return <FileText className="h-5 w-5" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getPublicUrl = (fileName: string) => {
    const { data } = supabase.storage.from("media").getPublicUrl(fileName)
    return data.publicUrl
  }

  const filteredFiles = mediaFiles.filter((file) => file.name.toLowerCase().includes(searchQuery.toLowerCase()))

  useEffect(() => {
    loadMediaFiles()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Media Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Upload and manage media files</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
            {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
          <Button variant="outline" onClick={loadMediaFiles} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Upload Files
          </CardTitle>
          <CardDescription>Upload images, videos, audio files, and documents to the media library</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                id="file-input"
                type="file"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="cursor-pointer"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleFileUpload} disabled={uploading || !files.length} className="min-w-[120px]">
                {uploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </div>

          {files.length > 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {files.length} file(s) selected: {files.map((f) => f.name).join(", ")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {selectedFiles.length > 0 && (
          <Button variant="destructive" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected ({selectedFiles.length})
          </Button>
        )}
      </div>

      {/* Media Files */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Media Files ({filteredFiles.length})</span>
            <Badge variant="secondary">
              {formatFileSize(filteredFiles.reduce((acc, file) => acc + (file.metadata?.size || 0), 0))} total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No files found</p>
              <p className="text-gray-400 text-sm">Upload some files to get started</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredFiles.map((file) => (
                <div key={file.name} className="group relative border rounded-lg p-3 hover:shadow-md transition-shadow">
                  <div className="absolute top-2 left-2">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFiles((prev) => [...prev, file.name])
                        } else {
                          setSelectedFiles((prev) => prev.filter((f) => f !== file.name))
                        }
                      }}
                      className="rounded"
                    />
                  </div>

                  <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-md mb-3 flex items-center justify-center overflow-hidden">
                    {file.metadata?.mimetype?.startsWith("image/") ? (
                      <img
                        src={getPublicUrl(file.name) || "/placeholder.svg"}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400">{getFileIcon(file.metadata?.mimetype)}</div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.metadata?.size || 0)}</p>
                    <p className="text-xs text-gray-400">{new Date(file.created_at).toLocaleDateString()}</p>
                  </div>

                  <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(getPublicUrl(file.name), "_blank")}
                      className="flex-1"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleFileDelete(file.name)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFiles.map((file) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFiles((prev) => [...prev, file.name])
                        } else {
                          setSelectedFiles((prev) => prev.filter((f) => f !== file.name))
                        }
                      }}
                      className="rounded"
                    />
                    {getFileIcon(file.metadata?.mimetype)}
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.metadata?.size || 0)} • {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => window.open(getPublicUrl(file.name), "_blank")}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleFileDelete(file.name)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
