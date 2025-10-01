"use client"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import Navigation from "@/components/header"
import { useEffect, useState } from "react"
import type { Mapping } from "@/types/mapping"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Plus, Power, PowerOff } from "lucide-react"

export default function AutomationPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [loadingData, setLoadingData] = useState(true)
  const [data, setData] = useState<Mapping[]>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    actionType: "",
    actionConfig: "{}",
    reactionType: "",
    reactionConfig: "{}",
    reactionDelay: 0,
    is_active: true,
  })

  const fetchData = async () => {
    setLoadingData(true)
    try {
      const response = await api.get<{ mappings: Mapping[] }>({ endpoint: "/mappings" })
      if (response.data) setData(response.data.mappings)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleCreateAutomation = async () => {
    try {
      console.log("Creating automation with data:", formData)
      const payload = {
        name: formData.name,
        description: formData.description,
        action: {
          type: formData.actionType,
          config: JSON.parse(formData.actionConfig),
        },
        reactions: [
          {
            type: formData.reactionType,
            config: JSON.parse(formData.reactionConfig),
            delay: formData.reactionDelay,
          },
        ],
        is_active: formData.is_active,
      }

      await api.post("/mappings", payload)

      // Reset form and close drawer
      setFormData({
        name: "",
        description: "",
        actionType: "",
        actionConfig: "{}",
        reactionType: "",
        reactionConfig: "{}",
        reactionDelay: 0,
        is_active: true,
      })
      setIsDrawerOpen(false)

      // Refresh data
      fetchData()
    } catch (error) {
      console.error("Error creating automation:", error)
      alert("Failed to create automation. Please check your input.")
    }
  }

  const handleDeleteAutomation = async (id: number) => {
    if (!confirm("Are you sure you want to delete this automation?")) return

    try {
      await api.delete(`/api/mapping/${id}`)
      fetchData()
    } catch (error) {
      console.error("Error deleting automation:", error)
      alert("Failed to delete automation.")
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    router.push("/login")
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-jeb-gradient-from to-jeb-gradient-to/50 flex flex-col">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Automations</h1>
            <p className="text-muted-foreground">Manage your automation workflows</p>
          </div>

          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} direction="right">
            <DrawerTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Automation
              </Button>
            </DrawerTrigger>
            <DrawerContent className="h-screen w-full sm:w-[500px] fixed right-0 top-0">
              <DrawerHeader>
                <DrawerTitle>Create New Automation</DrawerTitle>
                <DrawerDescription>Set up a new automation workflow</DrawerDescription>
              </DrawerHeader>

              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="My Automation"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this automation does..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Action</h3>

                  <div className="space-y-2">
                    <Label htmlFor="actionType">Action Type *</Label>
                    <Input
                      id="actionType"
                      placeholder="e.g., webhook, schedule, event"
                      value={formData.actionType}
                      onChange={(e) => setFormData({ ...formData, actionType: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 mt-3">
                    <Label htmlFor="actionConfig">Action Config</Label>
                    <Textarea
                      id="actionConfig"
                      placeholder='{"key": "value"}'
                      value={formData.actionConfig}
                      onChange={(e) => setFormData({ ...formData, actionConfig: e.target.value })}
                      rows={3}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Reaction</h3>

                  <div className="space-y-2">
                    <Label htmlFor="reactionType">Reaction Type *</Label>
                    <Input
                      id="reactionType"
                      placeholder="e.g., email, notification, api_call"
                      value={formData.reactionType}
                      onChange={(e) => setFormData({ ...formData, reactionType: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 mt-3">
                    <Label htmlFor="reactionConfig">Reaction Config
                    </Label>
                    <Textarea
                      id="reactionConfig"
                      placeholder='{"key": "value"}'
                      value={formData.reactionConfig}
                      onChange={(e) => setFormData({ ...formData, reactionConfig: e.target.value })}
                      rows={3}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2 mt-3">
                    <Label htmlFor="reactionDelay">Delay</Label>
                    <Input
                      id="reactionDelay"
                      type="number"
                      min="0"
                      value={formData.reactionDelay}
                      onChange={(e) =>
                        setFormData({ ...formData, reactionDelay: Number.parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                  <Label htmlFor="is_active">Active</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </div>

              <DrawerFooter>
                <Button onClick={handleCreateAutomation}>Create Automation</Button>
                <DrawerClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>

        {loadingData ? (
          <div className="text-center py-12">
            <div className="text-lg text-muted-foreground">Loading automations...</div>
          </div>
        ) : data.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No automations yet</p>
              <p className="text-sm text-muted-foreground">Create your first automation to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.map((mapping) => (
              <Card key={mapping.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{mapping.name}</CardTitle>
                      <CardDescription className="mt-1">{mapping.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {mapping.is_active ? (
                        <Power className="w-4 h-4 text-green-500" />
                      ) : (
                        <PowerOff className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-semibold text-xs text-muted-foreground uppercase mb-1">Action</p>
                      <p className="text-foreground">{mapping.action.type}</p>
                    </div>

                    <div>
                      <p className="font-semibold text-xs text-muted-foreground uppercase mb-1">Reactions</p>
                      <div className="space-y-1">
                        {mapping.reactions.map((reaction, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="text-foreground">{reaction.type}</span>
                            {reaction.delay > 0 && (
                              <span className="text-xs text-muted-foreground">+{reaction.delay}s</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Created {new Date(mapping.created_at.toString()).toLocaleDateString()}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAutomation(mapping.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
