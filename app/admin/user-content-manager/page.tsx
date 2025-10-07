
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Home, Image, Calendar, ShoppingBag, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function UserContentManager() {
  const [activeTab, setActiveTab] = useState('homepage')
  const [content, setContent] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)

  useEffect(() => {
    fetchContent(activeTab)
  }, [activeTab])

  const fetchContent = async (type: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/user-content?type=${type}`)
      const data = await response.json()
      setContent(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error('Failed to load content')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (id: string, data: any) => {
    try {
      const response = await fetch('/api/admin/user-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeTab, id, data }),
      })

      if (response.ok) {
        toast.success('Content updated successfully')
        fetchContent(activeTab)
        setEditing(null)
      } else {
        toast.error('Failed to update content')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const tabs = [
    { id: 'homepage', label: 'Homepage', icon: Home },
    { id: 'media', label: 'Media Vault', icon: Image },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'merchandise', label: 'Merchandise', icon: ShoppingBag },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Content Manager</h1>
        <p className="text-muted-foreground">Manage all user-facing content from one place</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger key={tab.id} value={tab.id}>
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : content.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No content available for {tab.label.toLowerCase()}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {content.map((item) => (
                  <Card key={item.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {item.title || item.name || `Item ${item.id}`}
                      </CardTitle>
                      <CardDescription>
                        {editing === item.id ? 'Editing...' : 'Click Edit to modify'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {editing === item.id ? (
                        <EditForm
                          item={item}
                          type={activeTab}
                          onSave={(data) => handleUpdate(item.id, data)}
                          onCancel={() => setEditing(null)}
                        />
                      ) : (
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            {item.description || item.content || 'No description'}
                          </div>
                          <Button onClick={() => setEditing(item.id)} variant="outline">
                            Edit
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function EditForm({ item, type, onSave, onCancel }: any) {
  const [formData, setFormData] = useState(item)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label>{type === 'merchandise' ? 'Name' : 'Title'}</Label>
          <Input
            value={formData.title || formData.name || ''}
            onChange={(e) => setFormData({ ...formData, [type === 'merchandise' ? 'name' : 'title']: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={formData.description || formData.content || ''}
            onChange={(e) => setFormData({ ...formData, [formData.content !== undefined ? 'content' : 'description']: e.target.value })}
            rows={4}
          />
        </div>

        {type === 'homepage' && (
          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.is_active || false}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label>Active</Label>
          </div>
        )}

        {type === 'media' && (
          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.is_public || false}
              onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
            />
            <Label>Public</Label>
          </div>
        )}

        {type === 'merchandise' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Price</Label>
              <Input
                type="number"
                value={formData.price || 0}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Stock</Label>
              <Input
                type="number"
                value={formData.stock_quantity || 0}
                onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit">Save Changes</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
