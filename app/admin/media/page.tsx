"use client"
import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function MediaPage() {
  const supabase = createClientComponentClient()
  const [files, setFiles] = useState<FileList | null>(null)
  const [listing, setListing] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const upload = async () => {
    if (!files) return
    setLoading(true)

    for (const file of Array.from(files)) {
      const path = `${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from("media").upload(path, file, { upsert: false })

      if (error) {
        alert(`Upload error: ${error.message}`)
      }
    }

    await load()
    setLoading(false)
  }

  const load = async () => {
    const { data, error } = await supabase.storage.from("media").list("", { limit: 100 })

    if (error) {
      console.error("Load error:", error)
      return
    }

    setListing((data || []).map((x) => x.name))
  }

  const remove = async (name: string) => {
    const { error } = await supabase.storage.from("media").remove([name])

    if (error) {
      alert(`Delete error: ${error.message}`)
    } else {
      await load()
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Media Management</h1>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border space-y-4">
        <div className="space-y-2">
          <label className="block font-medium">Upload Files</label>
          <input
            type="file"
            multiple
            onChange={(e) => setFiles(e.target.files)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <div className="flex gap-2">
            <button
              onClick={upload}
              disabled={loading || !files}
              className="rounded bg-blue-600 text-white px-4 py-2 disabled:opacity-50 hover:bg-blue-700 transition-colors"
            >
              {loading ? "Uploading..." : "Upload"}
            </button>
            <button
              onClick={load}
              className="rounded border px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">Media Files ({listing.length})</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listing.map((name) => (
            <li key={name} className="border rounded p-3 space-y-2">
              <div className="text-sm break-all font-mono">{name}</div>
              <button onClick={() => remove(name)} className="text-red-600 hover:text-red-800 text-sm font-medium">
                Delete
              </button>
            </li>
          ))}
        </ul>
        {listing.length === 0 && <p className="text-gray-500 text-center py-8">No files uploaded yet</p>}
      </div>
    </div>
  )
}
