'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useCurrentUser } from '@/app/lib/auth'
// import { useToast } from '@/hooks/use-toast' // Not available
import type { 
  Notification, 
  NotificationListResponse,
  UnreadCountResponse 
} from '@/app/types/notifications'

const MaterialIcon = ({
  name,
  className = '',
  filled = false
}: {
  name: string
  className?: string
  filled?: boolean
}) => (
  <span
    className={cn(
      'material-symbols-outlined select-none',
      filled && 'material-symbols-filled',
      className
    )}
    style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
  >
    {name}
  </span>
)

export default function NotificationsPage() {
  const { user } = useCurrentUser()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!user) return

    try {
      setIsLoading(true)

      const [notificationsRes, unreadRes] = await Promise.all([
        fetch('/api/notifications?limit=50', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        }),
        fetch('/api/notifications/unread', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        })
      ])

      if (notificationsRes.ok) {
        const data: NotificationListResponse = await notificationsRes.json()
        setNotifications(Array.isArray(data.items) ? data.items : [])
      }

      if (unreadRes.ok) {
        const unreadData: UnreadCountResponse = await unreadRes.json()
        setUnreadCount(unreadData.unreadCount || 0)
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Filter notifications based on search and filters
  useEffect(() => {
    let filtered = notifications

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(query) ||
        (n.message && n.message.toLowerCase().includes(query))
      )
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === typeFilter)
    }

    // Status filter
    if (statusFilter === 'read') {
      filtered = filtered.filter(n => n.read_at)
    } else if (statusFilter === 'unread') {
      filtered = filtered.filter(n => !n.read_at)
    }

    setFilteredNotifications(filtered)
  }, [notifications, searchQuery, typeFilter, statusFilter])

  // Mark notification as read/unread
  const toggleReadStatus = async (notificationId: string, currentReadStatus: boolean) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          notificationId,
          markAsRead: !currentReadStatus 
        })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, read_at: !currentReadStatus ? new Date().toISOString() : null }
              : n
          )
        )
        
        // Update unread count
        setUnreadCount(prev => 
          currentReadStatus ? prev + 1 : Math.max(0, prev - 1)
        )
      }
    } catch (error) {
      console.error('Failed to toggle notification read status:', error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  // Handle invitation approval
  const handleApprove = async (notification: Notification) => {
    try {
      setApprovingId(notification.id)
      
      // Extract invitation_id from notification data
      let invitationId: string | undefined
      try {
        const notificationData = typeof notification.data === 'string' 
          ? JSON.parse(notification.data) 
          : notification.data
        invitationId = notificationData?.invitation_id
      } catch (error) {
        console.error('Error parsing notification data:', error)
        invitationId = undefined
      }
      
      if (!invitationId) {
        setMessage({ text: "Invitation ID not found", type: "error" })
        setTimeout(() => setMessage(null), 5000)
        return
      }

      const response = await fetch('/api/invitations/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error approving request')
      }

      setMessage({ text: "Request approved. User notified by email.", type: "success" })
      setTimeout(() => setMessage(null), 5000)
      
      // Mark notification as read
      setNotifications(prev => 
        prev.map(n => 
          n.id === notification.id 
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      )
      
      // Refresh notifications
      loadNotifications()
      
    } catch (error: any) {
      console.error('Error:', error)
      setMessage({ text: error.message || "Operation failed", type: "error" })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setApprovingId(null)
    }
  }

  // Handle invitation rejection
  const handleReject = async (notification: Notification) => {
    try {
      setRejectingId(notification.id)
      
      // Extract invitation_id from notification data
      let invitationId: string | undefined
      try {
        const notificationData = typeof notification.data === 'string' 
          ? JSON.parse(notification.data) 
          : notification.data
        invitationId = notificationData?.invitation_id
      } catch (error) {
        console.error('Error parsing notification data:', error)
        invitationId = undefined
      }
      
      if (!invitationId) {
        setMessage({ text: "Invitation ID not found", type: "error" })
        setTimeout(() => setMessage(null), 5000)
        return
      }

      const response = await fetch('/api/invitations/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          invitationId,
          reason: 'Rejected by administrator'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error rejecting request')
      }

      setMessage({ text: "Request rejected.", type: "success" })
      setTimeout(() => setMessage(null), 5000)
      
      // Mark notification as read
      setNotifications(prev => 
        prev.map(n => 
          n.id === notification.id 
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      )
      
      // Refresh notifications
      loadNotifications()
      
    } catch (error: any) {
      console.error('Error:', error)
      setMessage({ text: error.message || "Operation failed", type: "error" })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setRejectingId(null)
    }
  }

  // Load notifications on mount
  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  // Format time
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Now'
    
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d`
    
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  // Get notification icon and color
  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'join_request':
        return { icon: 'person_add', color: 'bg-blue-500' }
      case 'invitation_approved':
        return { icon: 'check_circle', color: 'bg-green-500' }
      case 'invitation_rejected':
        return { icon: 'cancel', color: 'bg-red-500' }
      case 'payment_received':
        return { icon: 'payments', color: 'bg-emerald-500' }
      case 'system':
        return { icon: 'settings', color: 'bg-gray-500' }
      default:
        return { icon: 'notifications', color: 'bg-primary' }
    }
  }

  // Get type label
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      join_request: 'Access Request',
      invitation_approved: 'Invitation Approved',
      invitation_rejected: 'Invitation Rejected',
      payment_received: 'Payment Received',
      system: 'System'
    }
    return labels[type] || type
  }

  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const isUnread = !notification.read_at
    const { icon, color } = getNotificationStyle(notification.type)
    const isAccessRequest = notification.type === 'join_request'
    const isPending = !notification.read_at

    return (
      <Card className={cn(
        'transition-all duration-200 hover:shadow-md border-l-4',
        isUnread ? 'border-l-[#14B8A6] bg-[#14B8A6]/5' : 'border-l-border'
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white', color)}>
              <MaterialIcon name={icon} className="text-lg" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className={cn(
                  'font-medium text-sm leading-tight',
                  isUnread ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {notification.title}
                </h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="secondary" className="text-xs">
                    {getTypeLabel(notification.type)}
                  </Badge>
                  {isUnread && (
                    <div className="w-2 h-2 bg-[#14B8A6] rounded-full" />
                  )}
                </div>
              </div>
              
              {notification.message && (
                <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                  {notification.message}
                </p>
              )}
              
              {/* Action buttons for access requests */}
              {isAccessRequest && isPending && (
                <div className="flex gap-2 mb-3 flex-wrap">
                  <Button
                    onClick={() => handleApprove(notification)}
                    disabled={approvingId === notification.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed h-8"
                    size="sm"
                  >
                    {approvingId === notification.id ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Approving...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <MaterialIcon name="check" className="text-sm" />
                        Approve
                      </div>
                    )}
                  </Button>

                  <Button
                    onClick={() => handleReject(notification)}
                    disabled={rejectingId === notification.id}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed h-8"
                    size="sm"
                  >
                    {rejectingId === notification.id ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Rejecting...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <MaterialIcon name="close" className="text-sm" />
                        Reject
                      </div>
                    )}
                  </Button>

                  <Button
                    onClick={() => router.push('/settings/access-requests')}
                    variant="outline"
                    className="px-4 py-2 text-sm font-medium h-8"
                    size="sm"
                  >
                    <div className="flex items-center gap-2">
                      <MaterialIcon name="arrow_forward" className="text-sm" />
                      View Details
                    </div>
                  </Button>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {formatTime(notification.created_at)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleReadStatus(notification.id, isUnread)}
                  className="text-xs h-6 px-2"
                >
                  {isUnread ? 'Mark as read' : 'Mark as unread'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Message Banner */}
      {message && (
        <Card className={cn(
          'border-l-4',
          message.type === 'success' ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MaterialIcon 
                name={message.type === 'success' ? 'check_circle' : 'error'} 
                className={cn(
                  'text-lg',
                  message.type === 'success' ? 'text-green-600' : 'text-red-600'
                )} 
              />
              <p className={cn(
                'font-medium',
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              )}>
                {message.text}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMessage(null)}
                className="ml-auto h-6 px-2"
              >
                <MaterialIcon name="close" className="text-sm" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">
            Manage all your notifications
          </p>
        </div>
        
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline">
            <MaterialIcon name="mark_email_read" className="mr-2 text-lg" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#14B8A6]/10 rounded-full flex items-center justify-center">
                <MaterialIcon name="notifications" className="text-[#14B8A6] text-lg" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-semibold">{notifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                <MaterialIcon name="mark_email_unread" className="text-blue-500 text-lg" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unread</p>
                <p className="text-xl font-semibold">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                <MaterialIcon name="mark_email_read" className="text-green-500 text-lg" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Read</p>
                <p className="text-xl font-semibold">{notifications.length - unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="join_request">Access Requests</SelectItem>
                <SelectItem value="invitation_approved">Invitations Approved</SelectItem>
                <SelectItem value="invitation_rejected">Invitations Rejected</SelectItem>
                <SelectItem value="payment_received">Payments Received</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-muted border-t-[#14B8A6] rounded-full animate-spin" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MaterialIcon name="notifications_off" className="text-4xl text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg mb-2">
                {searchQuery || typeFilter !== 'all' || statusFilter !== 'all' 
                  ? 'No notifications found' 
                  : 'No notifications'
                }
              </h3>
              <p className="text-muted-foreground">
                {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search filters'
                  : 'Notifications will appear here when you receive them'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map(notification => (
            <NotificationCard key={notification.id} notification={notification} />
          ))
        )}
      </div>

      {/* Load more button if there are more notifications */}
      {!isLoading && notifications.length >= 50 && (
        <div className="text-center">
          <Button variant="outline" onClick={loadNotifications}>
            <MaterialIcon name="refresh" className="mr-2 text-lg" />
            Load more notifications
          </Button>
        </div>
      )}
    </div>
  )
}