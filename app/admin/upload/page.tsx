"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Upload, Music, Video, Camera, Plus, X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function AdminUploadPage() {
  const [albumForm, setAlbumForm] = useState({
    title: "",
    description: "",
    type: "album",
    release_date: "",
    cover_url: "",
    is_premium: false,
    required_tier: "street_rep",
  })

  const [trackForm, setTrackForm] = useState({
    title: "",
    artist: "Erigga",
    featuring: "",
    duration: "",
    album_id: "",
    track_number: 1,
    lyrics: "",
    cover_url: "",
    audio_url: "",
    is_premium: false,
    required_tier: "street_rep",
    release_date: "",
  })

  const [videoForm, setVideoForm] = useState({
    title: "",
    description: "",
    video_url: "",
    thumbnail_url: "",
    duration: "",
    is_premium: false,
    required_tier: "street_rep",
    release_date: "",
  })

  const [galleryForm, setGalleryForm] = useState({
    title: "",
    description: "",
    image_url: "",
    category: "",
    is_premium: false,
    required_tier: "street_rep",
  })

  const [streamingLinks, setStreamingLinks] = useState([{ platform: "", url: "" }])

  const { profile } = useAuth()

  // Check if user has admin privileges
  if (!profile || profile.tier === "street_rep") {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="font-street text-4xl text-gradient mb-4">ACCESS DENIED</h1>
          <p className="text-muted-foreground">You need Warri Elite or Erigma Circle access to upload content.</p>
        </div>
      </div>
    )
  }

  const addStreamingLink = () => {
    setStreamingLinks([...streamingLinks, { platform: "", url: "" }])
  }

  const removeStreamingLink = (index: number) => {
    setStreamingLinks(streamingLinks.filter((_, i) => i !== index))
  }

  const updateStreamingLink = (index: number, field: string, value: string) => {
    const updated = [...streamingLinks]
    updated[index] = { ...updated[index], [field]: value }
    setStreamingLinks(updated)
  }

  const handleAlbumSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Handle album upload
    console.log("Album upload:", albumForm, streamingLinks)
    alert("Album uploaded successfully!")
  }

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Handle track upload
    console.log("Track upload:", trackForm, streamingLinks)
    alert("Track uploaded successfully!")
  }

  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Handle video upload
    console.log("Video upload:", videoForm)
    alert("Video uploaded successfully!")
  }

  const handleGallerySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Handle gallery upload
    console.log("Gallery upload:", galleryForm)
    alert("Gallery item uploaded successfully!")
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="font-street text-4xl md:text-6xl text-gradient mb-4">CONTENT UPLOAD</h1>
          <p className="text-muted-foreground">Add new albums, tracks, videos, and gallery content</p>
        </div>

        <Tabs defaultValue="album" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-card/50 border border-orange-500/20 mb-8">
            <TabsTrigger value="album" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black">
              <Music className="h-4 w-4 mr-2" />
              Album
            </TabsTrigger>
            <TabsTrigger value="track" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black">
              <Upload className="h-4 w-4 mr-2" />
              Track
            </TabsTrigger>
            <TabsTrigger value="video" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black">
              <Video className="h-4 w-4 mr-2" />
              Video
            </TabsTrigger>
            <TabsTrigger value="gallery" className="data-[state=active]:bg-orange-500 data-[state=active]:text-black">
              <Camera className="h-4 w-4 mr-2" />
              Gallery
            </TabsTrigger>
          </TabsList>

          {/* Album Upload */}
          <TabsContent value="album">
            <Card className="bg-card/50 border-orange-500/20">
              <CardHeader>
                <CardTitle>Upload Album</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAlbumSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="album-title">Album Title</Label>
                      <Input
                        id="album-title"
                        value={albumForm.title}
                        onChange={(e) => setAlbumForm({ ...albumForm, title: e.target.value })}
                        placeholder="Enter album title"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="album-type">Album Type</Label>
                      <Select
                        value={albumForm.type}
                        onValueChange={(value) => setAlbumForm({ ...albumForm, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="album">Album</SelectItem>
                          <SelectItem value="ep">EP</SelectItem>
                          <SelectItem value="mixtape">Mixtape</SelectItem>
                          <SelectItem value="single">Single</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="album-date">Release Date</Label>
                      <Input
                        id="album-date"
                        type="date"
                        value={albumForm.release_date}
                        onChange={(e) => setAlbumForm({ ...albumForm, release_date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="album-cover">Cover Image URL</Label>
                      <Input
                        id="album-cover"
                        value={albumForm.cover_url}
                        onChange={(e) => setAlbumForm({ ...albumForm, cover_url: e.target.value })}
                        placeholder="Enter cover image URL"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="album-description">Description</Label>
                    <Textarea
                      id="album-description"
                      value={albumForm.description}
                      onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })}
                      placeholder="Enter album description"
                      rows={3}
                    />
                  </div>

                  {/* Premium Settings */}
                  <div className="space-y-4 p-4 bg-orange-500/10 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="album-premium"
                        checked={albumForm.is_premium}
                        onCheckedChange={(checked) => setAlbumForm({ ...albumForm, is_premium: checked })}
                      />
                      <Label htmlFor="album-premium">Premium Content</Label>
                    </div>

                    {albumForm.is_premium && (
                      <div className="space-y-2">
                        <Label>Required Tier</Label>
                        <Select
                          value={albumForm.required_tier}
                          onValueChange={(value) => setAlbumForm({ ...albumForm, required_tier: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select required tier" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="warri_elite">Warri Elite</SelectItem>
                            <SelectItem value="erigma_circle">Erigma Circle</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Streaming Links */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Streaming Links</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addStreamingLink}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Link
                      </Button>
                    </div>

                    {streamingLinks.map((link, index) => (
                      <div key={index} className="flex gap-2">
                        <Select
                          value={link.platform}
                          onValueChange={(value) => updateStreamingLink(index, "platform", value)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Platform" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spotify">Spotify</SelectItem>
                            <SelectItem value="apple_music">Apple Music</SelectItem>
                            <SelectItem value="audiomack">Audiomack</SelectItem>
                            <SelectItem value="youtube_music">YouTube Music</SelectItem>
                            <SelectItem value="boomplay">Boomplay</SelectItem>
                            <SelectItem value="deezer">Deezer</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Streaming URL"
                          value={link.url}
                          onChange={(e) => updateStreamingLink(index, "url", e.target.value)}
                          className="flex-1"
                        />
                        <Button type="button" variant="outline" size="sm" onClick={() => removeStreamingLink(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-black">
                    Upload Album
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Track Upload */}
          <TabsContent value="track">
            <Card className="bg-card/50 border-orange-500/20">
              <CardHeader>
                <CardTitle>Upload Track</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTrackSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="track-title">Track Title</Label>
                      <Input
                        id="track-title"
                        value={trackForm.title}
                        onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })}
                        placeholder="Enter track title"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="track-artist">Artist</Label>
                      <Input
                        id="track-artist"
                        value={trackForm.artist}
                        onChange={(e) => setTrackForm({ ...trackForm, artist: e.target.value })}
                        placeholder="Artist name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="track-featuring">Featuring (Optional)</Label>
                      <Input
                        id="track-featuring"
                        value={trackForm.featuring}
                        onChange={(e) => setTrackForm({ ...trackForm, featuring: e.target.value })}
                        placeholder="Featured artists"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="track-duration">Duration</Label>
                      <Input
                        id="track-duration"
                        value={trackForm.duration}
                        onChange={(e) => setTrackForm({ ...trackForm, duration: e.target.value })}
                        placeholder="e.g., 3:45"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="track-number">Track Number</Label>
                      <Input
                        id="track-number"
                        type="number"
                        value={trackForm.track_number}
                        onChange={(e) => setTrackForm({ ...trackForm, track_number: Number.parseInt(e.target.value) })}
                        min="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="track-date">Release Date</Label>
                      <Input
                        id="track-date"
                        type="date"
                        value={trackForm.release_date}
                        onChange={(e) => setTrackForm({ ...trackForm, release_date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="track-cover">Cover Image URL</Label>
                      <Input
                        id="track-cover"
                        value={trackForm.cover_url}
                        onChange={(e) => setTrackForm({ ...trackForm, cover_url: e.target.value })}
                        placeholder="Enter cover image URL"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="track-audio">Audio File URL</Label>
                      <Input
                        id="track-audio"
                        value={trackForm.audio_url}
                        onChange={(e) => setTrackForm({ ...trackForm, audio_url: e.target.value })}
                        placeholder="Enter audio file URL"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="track-lyrics">Lyrics (Optional)</Label>
                    <Textarea
                      id="track-lyrics"
                      value={trackForm.lyrics}
                      onChange={(e) => setTrackForm({ ...trackForm, lyrics: e.target.value })}
                      placeholder="Enter track lyrics"
                      rows={6}
                    />
                  </div>

                  {/* Premium Settings */}
                  <div className="space-y-4 p-4 bg-orange-500/10 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="track-premium"
                        checked={trackForm.is_premium}
                        onCheckedChange={(checked) => setTrackForm({ ...trackForm, is_premium: checked })}
                      />
                      <Label htmlFor="track-premium">Premium Content</Label>
                    </div>

                    {trackForm.is_premium && (
                      <div className="space-y-2">
                        <Label>Required Tier</Label>
                        <Select
                          value={trackForm.required_tier}
                          onValueChange={(value) => setTrackForm({ ...trackForm, required_tier: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select required tier" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="warri_elite">Warri Elite</SelectItem>
                            <SelectItem value="erigma_circle">Erigma Circle</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-black">
                    Upload Track
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Video Upload */}
          <TabsContent value="video">
            <Card className="bg-card/50 border-orange-500/20">
              <CardHeader>
                <CardTitle>Upload Video</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVideoSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="video-title">Video Title</Label>
                      <Input
                        id="video-title"
                        value={videoForm.title}
                        onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                        placeholder="Enter video title"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="video-duration">Duration</Label>
                      <Input
                        id="video-duration"
                        value={videoForm.duration}
                        onChange={(e) => setVideoForm({ ...videoForm, duration: e.target.value })}
                        placeholder="e.g., 4:15"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="video-url">Video URL</Label>
                      <Input
                        id="video-url"
                        value={videoForm.video_url}
                        onChange={(e) => setVideoForm({ ...videoForm, video_url: e.target.value })}
                        placeholder="Enter video URL"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="video-thumbnail">Thumbnail URL</Label>
                      <Input
                        id="video-thumbnail"
                        value={videoForm.thumbnail_url}
                        onChange={(e) => setVideoForm({ ...videoForm, thumbnail_url: e.target.value })}
                        placeholder="Enter thumbnail URL"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="video-date">Release Date</Label>
                      <Input
                        id="video-date"
                        type="date"
                        value={videoForm.release_date}
                        onChange={(e) => setVideoForm({ ...videoForm, release_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="video-description">Description</Label>
                    <Textarea
                      id="video-description"
                      value={videoForm.description}
                      onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                      placeholder="Enter video description"
                      rows={3}
                    />
                  </div>

                  {/* Premium Settings */}
                  <div className="space-y-4 p-4 bg-orange-500/10 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="video-premium"
                        checked={videoForm.is_premium}
                        onCheckedChange={(checked) => setVideoForm({ ...videoForm, is_premium: checked })}
                      />
                      <Label htmlFor="video-premium">Premium Content</Label>
                    </div>

                    {videoForm.is_premium && (
                      <div className="space-y-2">
                        <Label>Required Tier</Label>
                        <Select
                          value={videoForm.required_tier}
                          onValueChange={(value) => setVideoForm({ ...videoForm, required_tier: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select required tier" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="warri_elite">Warri Elite</SelectItem>
                            <SelectItem value="erigma_circle">Erigma Circle</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-black">
                    Upload Video
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gallery Upload */}
          <TabsContent value="gallery">
            <Card className="bg-card/50 border-orange-500/20">
              <CardHeader>
                <CardTitle>Upload Gallery Item</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGallerySubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gallery-title">Title</Label>
                      <Input
                        id="gallery-title"
                        value={galleryForm.title}
                        onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })}
                        placeholder="Enter image title"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gallery-category">Category</Label>
                      <Select
                        value={galleryForm.category}
                        onValueChange={(value) => setGalleryForm({ ...galleryForm, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Behind The Scenes">Behind The Scenes</SelectItem>
                          <SelectItem value="Live Shows">Live Shows</SelectItem>
                          <SelectItem value="Photoshoot">Photoshoot</SelectItem>
                          <SelectItem value="Studio">Studio</SelectItem>
                          <SelectItem value="Personal">Personal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="gallery-image">Image URL</Label>
                      <Input
                        id="gallery-image"
                        value={galleryForm.image_url}
                        onChange={(e) => setGalleryForm({ ...galleryForm, image_url: e.target.value })}
                        placeholder="Enter image URL"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gallery-description">Description</Label>
                    <Textarea
                      id="gallery-description"
                      value={galleryForm.description}
                      onChange={(e) => setGalleryForm({ ...galleryForm, description: e.target.value })}
                      placeholder="Enter image description"
                      rows={3}
                    />
                  </div>

                  {/* Premium Settings */}
                  <div className="space-y-4 p-4 bg-orange-500/10 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="gallery-premium"
                        checked={galleryForm.is_premium}
                        onCheckedChange={(checked) => setGalleryForm({ ...galleryForm, is_premium: checked })}
                      />
                      <Label htmlFor="gallery-premium">Premium Content</Label>
                    </div>

                    {galleryForm.is_premium && (
                      <div className="space-y-2">
                        <Label>Required Tier</Label>
                        <Select
                          value={galleryForm.required_tier}
                          onValueChange={(value) => setGalleryForm({ ...galleryForm, required_tier: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select required tier" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="warri_elite">Warri Elite</SelectItem>
                            <SelectItem value="erigma_circle">Erigma Circle</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-black">
                    Upload Gallery Item
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
