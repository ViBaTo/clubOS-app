'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useCurrentUser } from '@/app/lib/auth'
import { getSupabaseClient } from '@/app/lib/supabaseClient'
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

interface NotificationBellProps {
  className?: string
}

export function NotificationBell({ className }: NotificationBellProps) {
  const { user } = useCurrentUser()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notifOpen, setNotifOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Load notifications from API
  const loadNotifications = useCallback(async (showLoading = false) => {
    if (!user) {
      setUnreadCount(0)
      setNotifications([])
      return
    }

    try {
      if (showLoading) setIsLoading(true)

      // Get unread count and latest notifications in parallel
      const [unreadRes, notificationsRes] = await Promise.all([
        fetch('/api/notifications/unread', { 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        }),
        fetch('/api/notifications', { 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
      ])

      if (unreadRes.ok) {
        const unreadData: UnreadCountResponse = await unreadRes.json()
        setUnreadCount(unreadData.unreadCount || 0)
      }

      if (notificationsRes.ok) {
        const notifData: NotificationListResponse = await notificationsRes.json()
        setNotifications(Array.isArray(notifData.items) ? notifData.items : [])
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [user])

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationId })
      })

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, read_at: new Date().toISOString() }
              : n
          )
        )
        // Decrease unread count if notification was unread
        setUnreadCount(prev => {
          const notification = notifications.find(n => n.id === notificationId)
          return notification && !notification.read_at ? Math.max(0, prev - 1) : prev
        })
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  // Mark all as read when dropdown opens
  const handleDropdownOpen = async (open: boolean) => {
    setNotifOpen(open)
    
    if (open) {
      // Refresh notifications when opening
      await loadNotifications(true)
      
      // Mark all as read
      try {
        const response = await fetch('/api/notifications/mark-read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ markAllAsRead: true })
        })

        if (response.ok) {
          setUnreadCount(0)
          setNotifications(prev => 
            prev.map(n => ({ 
              ...n, 
              read_at: n.read_at || new Date().toISOString() 
            }))
          )
        }
      } catch (error) {
        console.error('Failed to mark all notifications as read:', error)
      }
    }
  }

  // Setup polling and realtime subscriptions
  useEffect(() => {
    let stopped = false
    let pollInterval: NodeJS.Timeout | null = null

    const setupSubscriptions = async () => {
      if (!user) return

      // Initial load
      await loadNotifications()

      // Setup polling (fallback)
      pollInterval = setInterval(() => {
        if (!stopped) {
          loadNotifications()
        }
      }, 30000) // Poll every 30 seconds

      // Setup Supabase Realtime
      try {
        const supabase = getSupabaseClient()
        
        const channel = supabase
          .channel('notifications')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              console.log('Notification change:', payload)
              if (!stopped) {
                loadNotifications()
              }
            }
          )
          .subscribe()

        return () => {
          channel.unsubscribe()
        }
      } catch (error) {
        console.error('Failed to setup realtime subscription:', error)
      }
    }

    setupSubscriptions()

    return () => {
      stopped = true
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [user, loadNotifications])

  // Don't render if no user
  if (!user) {
    return null
  }

  // Format notification for display
  const formatNotification = (notification: Notification) => {
    const timeAgo = getTimeAgo(notification.created_at)
    const isUnread = !notification.read_at

    return (
      <div 
        key={notification.id}
        className={cn(
          'px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors border-l-2',
          isUnread ? 'border-l-[#14B8A6] bg-[#14B8A6]/5' : 'border-l-transparent'
        )}
        onClick={() => {
          if (isUnread) {
            markAsRead(notification.id)
          }
          // Handle navigation based on notification type
          handleNotificationClick(notification)
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className={cn(
              'text-sm font-medium truncate',
              isUnread ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {notification.title}
            </div>
            {notification.message && (
              <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {notification.message}
              </div>
            )}
          </div>
          {isUnread && (
            <div className="w-2 h-2 bg-[#14B8A6] rounded-full flex-shrink-0 mt-1.5" />
          )}
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">
          {timeAgo}
        </div>
      </div>
    )
  }

  return (
    <DropdownMenu 
      open={notifOpen} 
      onOpenChange={handleDropdownOpen}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'relative text-[#1E40AF] hover:bg-[#1E40AF]/5 font-medium rounded-lg transition-all duration-150',
            className
          )}
        >
          <MaterialIcon name="notifications" className="text-xl" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-h-4 px-1 bg-destructive text-destructive-foreground rounded-full text-[10px] leading-4 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
              <span className="sr-only">
                {unreadCount} notifications
              </span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 p-0 overflow-hidden"
        sideOffset={8}
      >
        {/* Header */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-foreground">
                Notificaciones
              </div>
              <div className="text-xs text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} sin leer` : 'Al día'}
              </div>
            </div>
            {isLoading && (
              <div className="w-4 h-4 border-2 border-muted border-t-[#14B8A6] rounded-full animate-spin" />
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center">
              <MaterialIcon 
                name="notifications_off" 
                className="text-2xl text-muted-foreground/50 mb-2" 
              />
              <div className="text-sm text-muted-foreground">
                No hay notificaciones
              </div>
            </div>
          ) : (
            <div className="py-1">
              {notifications.slice(0, 5).map(formatNotification)}
              
              {notifications.length > 5 && (
                <>
                  <DropdownMenuSeparator />
                  <Link 
                    href="/configuracion/notificaciones"
                    className="block px-3 py-2 text-xs text-[#14B8A6] hover:bg-muted/50 text-center font-medium"
                  >
                    Ver todas las notificaciones ({notifications.length})
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Link 
                href="/configuracion/notificaciones"
                className="block w-full text-center text-xs text-muted-foreground hover:text-foreground py-1"
              >
                Gestionar notificaciones
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Helper function to get time ago string
function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Ahora'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays}d`
  }

  return date.toLocaleDateString('es-ES', { 
    day: 'numeric', 
    month: 'short' 
  })
}

// Handle notification click navigation
function handleNotificationClick(notification: Notification) {
  switch (notification.type) {
    case 'join_request':
      // Navigate to pending invitations page
      window.location.href = '/configuracion/solicitudes-acceso'
      break
    case 'invitation_approved':
    case 'invitation_rejected':
      // Could navigate to a specific page or just stay
      break
    default:
      // Default behavior - could navigate to notifications page
      break
  }
}