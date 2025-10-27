'use client'

import { Button } from '@/components/ui/button'
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

  const handleLogout = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    // Optional: hard refresh to clear any client state
    window.location.href = '/login'
  }

  return (
    <header className='h-16 bg-card border-b border-border px-6 flex items-center justify-between'>
      {/* Logo */}

      {/* Search bar */}
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

      {/* Right section */}
      <div className='flex items-center gap-4'>
        {/* When not logged in, show Login button only */}
        {!user ? (
          <Link href='/login'>
            <Button className='h-9'>Iniciar sesión</Button>
          </Link>
        ) : (
          <>
            {/* Notifications */}
            <Button
              variant='ghost'
              size='icon'
              className='relative text-[#1E40AF] hover:bg-[#1E40AF]/5 font-medium rounded-lg transition-all duration-150'
            >
              <MaterialIcon name='notifications' className='text-xl' />
              <span className='absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full text-xs flex items-center justify-center'>
                <span className='sr-only'>3 notifications</span>
              </span>
            </Button>

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
                  <MaterialIcon name='account_circle' className='mr-2 text-lg' />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MaterialIcon name='settings' className='mr-2 text-lg' />
                  Configuración
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className='text-destructive' onClick={handleLogout}>
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </header>
  )
}
