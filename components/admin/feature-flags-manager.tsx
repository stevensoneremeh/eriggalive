"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { createClient } from "@/lib/supabase/client"
import { Flag, Plus, Trash2, Edit, Save, X } from "lucide-react"
import type { FeatureFlag } from "@/lib/feature-flags/types"

export function FeatureFlagsManager() {
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [editingFlag, setEditingFlag] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadFlags()
  }, [])

  const loadFlags = async () => {
    try {
      const { data, error } = await supabase.from("feature_flags").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setFlags(data || [])
    } catch (error) {
      console.error("Error loading feature flags:", error)
    } finally {
      setLoading(false)
    }
  }

  const createFlag = async (flagData: Partial<FeatureFlag>) => {
    try {
      const { data, error } = await supabase
        .from("feature_flags")
        .insert([
          {
            ...flagData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) throw error
      setFlags((prev) => [data, ...prev])
      setShowCreateForm(false)
    } catch (error) {
      console.error("Error creating feature flag:", error)
    }
  }

  const updateFlag = async (id: string, updates: Partial<FeatureFlag>) => {
    try {
      const { data, error } = await supabase
        .from("feature_flags")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      setFlags((prev) => prev.map((flag) => (flag.id === id ? data : flag)))
      setEditingFlag(null)
    } catch (error) {
      console.error("Error updating feature flag:", error)
    }
  }

  const deleteFlag = async (id: string) => {
    if (!confirm("Are you sure you want to delete this feature flag?")) return

    try {
      const { error } = await supabase.from("feature_flags").delete().eq("id", id)

      if (error) throw error
      setFlags((prev) => prev.filter((flag) => flag.id !== id))
    } catch (error) {
      console.error("Error deleting feature flag:", error)
    }
  }

  const toggleFlag = async (id: string, enabled: boolean) => {
    await updateFlag(id, { enabled })
  }

  if (loading) {
    return <div className="text-center py-8">Loading feature flags...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Feature Flags</h2>
          <p className="text-muted-foreground">Manage feature rollouts and A/B tests</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Flag
        </Button>
      </div>

      {showCreateForm && <CreateFlagForm onSubmit={createFlag} onCancel={() => setShowCreateForm(false)} />}

      <div className="grid gap-4">
        {flags.map((flag) => (
          <Card key={flag.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4" />
                <CardTitle className="text-lg">{flag.name}</CardTitle>
                <Badge variant={flag.enabled ? "default" : "secondary"}>{flag.enabled ? "Enabled" : "Disabled"}</Badge>
                <Badge variant="outline">{flag.environment}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={flag.enabled} onCheckedChange={(enabled) => toggleFlag(flag.id, enabled)} />
                <Button variant="ghost" size="sm" onClick={() => setEditingFlag(flag.id)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteFlag(flag.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {editingFlag === flag.id ? (
                <EditFlagForm
                  flag={flag}
                  onSubmit={(updates) => updateFlag(flag.id, updates)}
                  onCancel={() => setEditingFlag(null)}
                />
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{flag.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span>Rollout: {flag.rollout_percentage}%</span>
                    {flag.user_segments && flag.user_segments.length > 0 && (
                      <span>Segments: {flag.user_segments.join(", ")}</span>
                    )}
                    {flag.expires_at && <span>Expires: {new Date(flag.expires_at).toLocaleDateString()}</span>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function CreateFlagForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: Partial<FeatureFlag>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    enabled: false,
    rollout_percentage: 100,
    environment: "development" as const,
    user_segments: [] as string[],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Feature Flag</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="id">Flag ID</Label>
              <Input
                id="id"
                value={formData.id}
                onChange={(e) => setFormData((prev) => ({ ...prev, id: e.target.value }))}
                placeholder="feature_new_ui"
                required
              />
            </div>
            <div>
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="New UI Design"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Enable the new UI design for testing"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="environment">Environment</Label>
              <Select
                value={formData.environment}
                onValueChange={(value: any) => setFormData((prev) => ({ ...prev, environment: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="all">All Environments</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Rollout Percentage: {formData.rollout_percentage}%</Label>
              <Slider
                value={[formData.rollout_percentage]}
                onValueChange={([value]) => setFormData((prev) => ({ ...prev, rollout_percentage: value }))}
                max={100}
                step={5}
                className="mt-2"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(enabled) => setFormData((prev) => ({ ...prev, enabled }))}
            />
            <Label htmlFor="enabled">Enable immediately</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              Create Flag
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function EditFlagForm({
  flag,
  onSubmit,
  onCancel,
}: {
  flag: FeatureFlag
  onSubmit: (updates: Partial<FeatureFlag>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: flag.name,
    description: flag.description,
    rollout_percentage: flag.rollout_percentage,
    environment: flag.environment,
    expires_at: flag.expires_at || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="edit-name">Display Name</Label>
        <Input
          id="edit-name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="edit-description">Description</Label>
        <Textarea
          id="edit-description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Rollout Percentage: {formData.rollout_percentage}%</Label>
          <Slider
            value={[formData.rollout_percentage]}
            onValueChange={([value]) => setFormData((prev) => ({ ...prev, rollout_percentage: value }))}
            max={100}
            step={5}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="edit-expires">Expires At (optional)</Label>
          <Input
            id="edit-expires"
            type="datetime-local"
            value={formData.expires_at}
            onChange={(e) => setFormData((prev) => ({ ...prev, expires_at: e.target.value }))}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  )
}
