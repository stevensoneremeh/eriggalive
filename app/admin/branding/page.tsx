"use client"
import { useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function BrandingPage() {
  const supabase = createClient()
  const [hex, setHex] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  const extractColor = (): string => {
    const img = imgRef.current
    if (!img) return "#111111"

    const canvas = document.createElement("canvas")
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight

    const ctx = canvas.getContext("2d")
    if (!ctx) return "#111111"

    ctx.drawImage(img, 0, 0)
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)

    // Simple average color extraction
    let r = 0,
      g = 0,
      b = 0,
      count = 0
    for (let i = 0; i < data.length; i += 4 * 16) {
      // sample every 16px
      r += data[i]
      g += data[i + 1]
      b += data[i + 2]
      count++
    }

    r = Math.round(r / count)
    g = Math.round(g / count)
    b = Math.round(b / count)

    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`
  }

  const onUpload = async (file: File) => {
    setLoading(true)

    try {
      const path = `branding/logo-dark-${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage
        .from("media")
        .upload(path, file, { upsert: false, contentType: file.type })

      if (error) {
        alert(`Upload error: ${error.message}`)
        return
      }

      const { data: pub } = await supabase.storage.from("media").getPublicUrl(path)

      const url = pub?.publicUrl
      if (!url) {
        alert("Failed to get public URL")
        return
      }

      // Wait for image to load then extract color
      setTimeout(async () => {
        const color = extractColor()
        setHex(color)

        const response = await fetch("/api/branding/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dark_logo_url: url, dark_bg_hex: color }),
        })

        if (response.ok) {
          alert("Branding updated successfully!")
        } else {
          alert("Failed to update branding")
        }
      }, 500)
    } catch (error) {
      console.error("Upload error:", error)
      alert("Upload failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Branding Management</h1>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border space-y-4">
        <div className="space-y-2">
          <label className="block font-medium">Upload Dark Theme Logo</label>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upload a logo optimized for dark backgrounds. The system will automatically extract the dominant color for
            the dark theme background.
          </p>

          <input
            type="file"
            accept="image/*"
            disabled={loading}
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return

              const reader = new FileReader()
              reader.onload = () => {
                if (imgRef.current) {
                  imgRef.current.src = reader.result as string
                }
              }
              reader.readAsDataURL(f)

              await onUpload(f)
            }}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />

          <img ref={imgRef} alt="" className="hidden" />

          {hex && (
            <div className="flex items-center gap-2 text-sm">
              <span>Detected dark background color:</span>
              <span style={{ backgroundColor: hex }} className="px-3 py-1 rounded text-white font-mono">
                {hex}
              </span>
            </div>
          )}

          {loading && <p className="text-blue-600">Processing upload...</p>}
        </div>
      </div>
    </div>
  )
}