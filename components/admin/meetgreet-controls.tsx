"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Video, 
  Users, 
  Clock, 
  Play, 
  Square, 
  Trash2, 
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface MeetGreetSession {
  id: string
  user_id: string
  payment_reference: string
  amount: number
  currency: string
  payment_status: string
  session_room_id: string | null
  session_status: string
  expires_at: string
  created_at: string
  user_profiles?: {
    full_name: string
    email: string
  }
}

// This interface is for the new grid layout, assuming new fields are added to the 'meetgreet_sessions' table
interface AdminSessionGridItem {
  id: string;
  title: string;
  status: 'active' | 'scheduled' | 'completed';
  scheduled_date: string;
  scheduled_time: string;
  duration: number;
  participants_count: number;
}


export function MeetGreetControls() {
  const [sessions, setSessions] = useState<MeetGreetSession[]>([])
  const [adminSessions, setAdminSessions] = useState<AdminSessionGridItem[]>([]) // State for the new grid view
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    checkAdminPermissions()
    loadSessions()
    loadAdminSessions() // Load data for the new grid view

    // Set up real-time updates
    const supabase = createClient()
    const channel = supabase
      .channel('meetgreet_admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meetgreet_payments' },
        () => {
          loadSessions()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const checkAdminPermissions = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return
      
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('role, is_super_admin')
        .eq('auth_user_id', user.id)
        .single()
      
      if (error) {
        console.error('Error checking admin permissions:', error)
        return
      }
      
      setIsSuperAdmin(userProfile?.role === 'super_admin' || userProfile?.is_super_admin === true)
    } catch (error) {
      console.error('Error in admin permission check:', error)
    }
  }

  const loadSessions = async () => {
    try {
      const supabase = createClient()

      // Enhanced query to include admin information
      const { data, error } = await supabase
        .from('meetgreet_payments')
        .select(`
          *,
          users:user_id (
            full_name,
            email,
            username
          ),
          admin_user:admin_user_id (
            full_name,
            email,
            username
          )
        `)
        .eq('payment_status', 'completed')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform data to match expected interface
      const formattedSessions = (data || []).map(session => ({
        ...session,
        user_profiles: session.users
      }))

      setSessions(formattedSessions)
    } catch (error) {
      console.error('Error loading sessions:', error)
      toast({
        title: "Error",
        description: "Failed to load Meet & Greet sessions",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Function to load data for the admin dashboard grid
  const loadAdminSessions = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('meetgreet_sessions') // Assuming a new table or a different query for admin view
        .select('*')
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      // Map the data to the AdminSessionGridItem interface
      const formattedSessions = (data || []).map((session: any) => ({
        id: session.id,
        title: session.title || 'Untitled Session',
        status: session.status || 'scheduled',
        scheduled_date: session.scheduled_date,
        scheduled_time: session.scheduled_time,
        duration: session.duration || 30,
        participants_count: session.participants_count || 0,
      }));

      setAdminSessions(formattedSessions);

    } catch (error) {
      console.error('Error loading admin sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load admin dashboard sessions",
        variant: "destructive"
      });
    }
  };


  const startSession = async (sessionId: string) => {
    setActionLoading(sessionId)

    try {
      const timestamp = Date.now()
      const roomId = `erigga-meetgreet-${timestamp}`
      const adminRoomId = `${roomId}_admin`
      const supabase = createClient()

      // Update session with both user and admin room IDs
      const { error } = await supabase
        .from('meetgreet_payments')
        .update({
          session_room_id: roomId,
          admin_session_room_id: adminRoomId,
          session_status: 'active',
          session_start_time: new Date().toISOString(),
          requires_admin_approval: true
        })
        .eq('id', sessionId)

      if (error) throw error

      // Log admin action
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: adminUser } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()
        
        if (adminUser) {
          await supabase.rpc('log_admin_action', {
            admin_id: adminUser.id,
            action: 'start_meetgreet_session',
            resource_type: 'meetgreet_payment',
            resource_id: sessionId,
            new_values: { 
              session_room_id: roomId, 
              admin_session_room_id: adminRoomId,
              session_status: 'active' 
            }
          })
        }
      }

      toast({
        title: "Session Started",
        description: "Meet & Greet session is now live with admin monitoring!",
      })

      await loadSessions()
    } catch (error) {
      console.error('Error starting session:', error)
      toast({
        title: "Error",
        description: "Failed to start session",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const endSession = async (sessionId: string) => {
    setActionLoading(sessionId)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('meetgreet_payments')
        .update({
          session_status: 'completed',
          session_end_time: new Date().toISOString()
        })
        .eq('id', sessionId)

      if (error) throw error

      toast({
        title: "Session Ended",
        description: "Meet & Greet session has been completed",
      })

      await loadSessions()
    } catch (error) {
      console.error('Error ending session:', error)
      toast({
        title: "Error", 
        description: "Failed to end session",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const cancelSession = async (sessionId: string) => {
    setActionLoading(sessionId)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('meetgreet_payments')
        .update({
          session_status: 'cancelled'
        })
        .eq('id', sessionId)

      if (error) throw error

      toast({
        title: "Session Cancelled",
        description: "Meet & Greet session has been cancelled",
      })

      await loadSessions()
    } catch (error) {
      console.error('Error cancelling session:', error)
      toast({
        title: "Error",
        description: "Failed to cancel session", 
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Scheduled</Badge>
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Live</Badge>
      case 'completed':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Completed</Badge>
      case 'cancelled':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">Cancelled</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Meet & Greet Sessions</h2>
          {isSuperAdmin && (
            <p className="text-sm text-blue-600 font-medium mt-1">
              Super Admin Access - All sessions monitored by info@eriggalive.com
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span className="text-sm text-gray-600">Scheduled</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-sm text-gray-600">Active</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span className="text-sm text-gray-600">Completed</span>
          </div>
          {isSuperAdmin && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <span className="text-sm text-gray-600">Admin Monitored</span>
            </div>
          )}
        </div>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Sessions</h3>
            <p className="text-gray-500">No Meet & Greet sessions are currently scheduled.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 shadow-sm"
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {session.user_profiles?.full_name || 'Unknown User'}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {session.user_profiles?.email}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(session.session_status)}
                      <p className="text-sm text-gray-500 mt-1">
                        {formatCurrency(session.amount, session.currency)}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 block">Payment Ref:</span>
                      <span className="font-mono text-xs">{session.payment_reference}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Created:</span>
                      <span>{formatDateTime(session.created_at)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Expires:</span>
                      <span>{formatDateTime(session.expires_at)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Room ID:</span>
                      <span className="font-mono text-xs">
                        {session.session_room_id || 'Not set'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-4 border-t">
                    {session.session_status === 'scheduled' && (
                      <>
                        <Button
                          onClick={() => startSession(session.id)}
                          disabled={actionLoading === session.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start Session
                        </Button>
                        <Button
                          onClick={() => cancelSession(session.id)}
                          disabled={actionLoading === session.id}
                          variant="destructive"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </>
                    )}

                    {session.session_status === 'active' && (
                      <>
                        <div className="flex items-center space-x-2 text-green-600 font-medium">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span>Session Live</span>
                        </div>
                        <Button
                          onClick={() => endSession(session.id)}
                          disabled={actionLoading === session.id}
                          variant="outline"
                        >
                          <Square className="w-4 h-4 mr-2" />
                          End Session
                        </Button>
                        {session.session_room_id && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              // In production, this would open the room in a new window
                              toast({
                                title: "Room ID",
                                description: `Room: ${session.session_room_id}`,
                              })
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Room
                          </Button>
                        )}
                      </>
                    )}

                    {(session.session_status === 'completed' || session.session_status === 'cancelled') && (
                      <div className="flex items-center space-x-2 text-gray-500">
                        {session.session_status === 'completed' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="capitalize">{session.session_status}</span>
                      </div>
                    )}

                    {actionLoading === session.id && (
                      <div className="flex items-center space-x-2 text-blue-600">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSessions.map((session) => (
          <Card key={session.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{session.title}</CardTitle>
                <div className={`w-3 h-3 rounded-full ${
                  session.status === 'active' ? 'bg-green-400' :
                  session.status === 'scheduled' ? 'bg-yellow-400' : 'bg-gray-400'
                }`}></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <div>Date: {new Date(session.scheduled_date).toLocaleDateString()}</div>
                  <div>Time: {session.scheduled_time}</div>
                  <div>Duration: {session.duration} minutes</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {session.participants_count || 0} participants
                  </span>
                  <Button size="sm" variant="outline">
                    Manage
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button
          onClick={loadSessions}
          variant="outline"
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? "Loading..." : "Refresh Sessions"}
        </Button>
      </div>
    </div>
  )
}