'use client'

import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useCurrentUser } from '@/app/lib/auth'
import { getSupabaseClient } from '@/app/lib/supabaseClient'

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

export function Navbar() {
  const { user } = useCurrentUser()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<any[]>([])
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    let stopped = false
    const load = async () => {
      try {
        if (!user) {
          setUnreadCount(0)
          setNotifications([])
          return
        }
        const res = await fetch('/api/notifications', { cache: 'no-store' })
        if (!res.ok) return
        const j = await res.json()
        if (!stopped) {
          setUnreadCount(Number(j.unreadCount ?? 0))
          if (Array.isArray(j.items)) setNotifications(j.items)
        }
      } catch (_) {
        // ignore
      }
    }
    load()
    const id = setInterval(load, 30000)
    return () => {
      stopped = true
      clearInterval(id)
    }
  }, [user])

  const handleLogout = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    // Optional: hard refresh to clear any client state
    window.location.href = '/login'
  }

  return (
    <header className='sticky top-0 z-30 bg-card border-b border-border'>
      <div className='flex items-center justify-between h-14 px-4 md:h-16 md:px-6'>
        {/* Mobile: Minimal header */}
        <div className='flex items-center gap-3 md:hidden'>
          <span className='font-semibold text-lg'>ClubOS</span>
        </div>

        {/* Desktop: Full header with search */}
        <div className='hidden md:flex items-center gap-4 flex-1'>
          {/* Search bar - Desktop only */}
          <div className='flex-1 max-w-md mx-4'>
            <div className='relative'>
              <MaterialIcon
                name='search'
                className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-lg'
              />
              <Input
                placeholder='Buscar...'
                className='pl-10 bg-input border-border'
              />
            </div>
          </div>
        </div>

        {/* Right side: Always visible on both mobile and desktop */}
        <div className='flex items-center gap-2'>
        {/* When not logged in, show Login button only */}
        {!user ? (
          <Link href='/login'>
            <Button className='h-9'>Iniciar sesión</Button>
          </Link>
        ) : (
          <>
            {/* Notifications */}
            <DropdownMenu
              open={notifOpen}
              onOpenChange={async (open) => {
                setNotifOpen(open)
                if (open) {
                  try {
                    const res = await fetch('/api/notifications', {
                      cache: 'no-store'
                    })
                    if (res.ok) {
                      const j = await res.json()
                      setNotifications(Array.isArray(j.items) ? j.items : [])
                    }
                    // Mark all as read on open
                    await fetch('/api/notifications/read', { method: 'POST' })
                    setUnreadCount(0)
                  } catch (_) {
                    // ignore
                  }
                }
              }}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='relative text-[#1E40AF] hover:bg-[#1E40AF]/5 font-medium rounded-lg transition-all duration-150'
                >
                  <MaterialIcon name='notifications' className='text-xl' />
                  {unreadCount > 0 && (
                    <span className='absolute -top-1 -right-1 min-h-4 px-1 bg-destructive text-destructive-foreground rounded-full text-[10px] leading-4 flex items-center justify-center'>
                      {unreadCount > 9 ? '9+' : unreadCount}
                      <span className='sr-only'>
                        {unreadCount} notifications
                      </span>
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align='end'
                className='w-80 p-0 overflow-hidden'
              >
                <div className='p-3 border-b border-border'>
                  <div className='text-sm font-medium text-foreground'>
                    Notificaciones
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    Últimas actualizaciones
                  </div>
                </div>
                <div className='max-h-80 overflow-y-auto'>
                  {notifications.length === 0 ? (
                    <div className='p-4 text-sm text-muted-foreground'>
                      No hay notificaciones
                    </div>
                  ) : (
                    <div className='py-1'>
                      {notifications.map((n) => (
                        <div key={n.id} className='px-3 py-2 hover:bg-muted/50'>
                          <div className='text-sm font-medium text-foreground'>
                            {n.title}
                          </div>
                          {n.message && (
                            <div className='text-xs text-muted-foreground mt-0.5'>
                              {n.message}
                            </div>
                          )}
                          <div className='text-[10px] text-muted-foreground mt-1'>
                            {n.created_at
                              ? new Date(n.created_at).toLocaleString()
                              : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  className='flex items-center gap-2 px-3 text-[#1E40AF] hover:bg-[#1E40AF]/5 font-medium rounded-lg transition-all duration-150'
                >
                  <Avatar className='h-8 w-8'>
                    <AvatarImage src='/placeholder-user.jpg' alt='Usuario' />
                    <AvatarFallback className='bg-primary text-primary-foreground'>
                      <MaterialIcon name='account_circle' className='text-lg' />
                    </AvatarFallback>
                  </Avatar>
                  <span className='hidden sm:block text-sm font-normal text-[#94A3B8] leading-normal'>
                    {user.email ?? 'Usuario'}
                  </span>
                  <MaterialIcon name='expand_more' className='text-lg' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-56'>
                <DropdownMenuItem>
                  <MaterialIcon
                    name='account_circle'
                    className='mr-2 text-lg'
                  />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MaterialIcon name='settings' className='mr-2 text-lg' />
                  Configuración
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className='text-destructive'
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
        </div>
      </div>
    </header>
  )
}
