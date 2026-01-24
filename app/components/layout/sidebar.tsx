'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getSupabaseClient } from '@/app/lib/supabaseClient'

interface Organization {
  id: string
  name: string
  slug: string
  club_type: string
  role: string
  is_primary: boolean
}

const menuItems = [
  {
    title: 'Clientes',
    href: '/clientes',
    icon: 'group'
  },
  {
    title: 'Calendario',
    href: '/calendario',
    icon: 'calendar_month'
  },
  {
    title: 'Equipo',
    href: '/settings/team',
    icon: 'diversity_3'
  },
  {
    title: 'Productos',
    icon: 'expand_more',
    submenu: [
      {
        title: 'Academia',
        href: '/productos/academia',
        icon: 'school'
      },
      {
        title: 'Clases',
        href: '/productos/clases',
        icon: 'event'
      }
    ]
  }
]

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

export function Sidebar() {
  const [expandedItems, setExpandedItems] = useState<string[]>(['Productos'])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        setLoading(false)
        return
      }

      const res = await fetch('/api/user/organizations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        setOrganizations(data.organizations || [])
        
        // Check localStorage for selected org, otherwise use primary
        const savedOrgId = localStorage.getItem('selectedOrganizationId')
        const savedOrg = data.organizations?.find((o: Organization) => o.id === savedOrgId)
        const primaryOrg = data.organizations?.find((o: Organization) => o.is_primary)
        
        setCurrentOrg(savedOrg || primaryOrg || data.organizations?.[0] || null)
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchOrganization = async (org: Organization) => {
    if (org.id === currentOrg?.id) return
    
    // Save to localStorage
    localStorage.setItem('selectedOrganizationId', org.id)
    setCurrentOrg(org)
    
    // Optionally set as primary in the backend
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.access_token) {
        await fetch('/api/user/organizations', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ organization_id: org.id })
        })
      }
    } catch (error) {
      console.error('Error updating primary organization:', error)
    }
    
    // Reload to refresh data with new organization
    window.location.reload()
  }

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    )
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      owner: 'Propietario',
      admin: 'Admin',
      staff: 'Staff',
      member: 'Miembro'
    }
    return labels[role] || role
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      owner: 'bg-purple-100 text-purple-700',
      admin: 'bg-blue-100 text-blue-700',
      staff: 'bg-green-100 text-green-700',
      member: 'bg-gray-100 text-gray-700'
    }
    return colors[role] || 'bg-gray-100 text-gray-700'
  }

  const sidebarContent = (
    <div className='flex flex-col h-full'>
      {/* Logo */}
      <div className='h-14 px-6 border-b border-sidebar-border flex items-center'>
        <h2 className='text-2xl font-semibold text-[#0F172A] leading-tight'>
          ClubOS
        </h2>
      </div>

      {/* Organization Switcher */}
      <div className='px-3 py-3 border-b border-sidebar-border'>
        {loading ? (
          <div className='flex items-center gap-3 px-3 py-2'>
            <div className='w-8 h-8 rounded-lg bg-gray-200 animate-pulse' />
            <div className='flex-1'>
              <div className='h-4 bg-gray-200 rounded animate-pulse w-24' />
            </div>
          </div>
        ) : currentOrg ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className='w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-left'>
                <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm'>
                  {currentOrg.name.charAt(0).toUpperCase()}
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium text-gray-900 truncate'>
                    {currentOrg.name}
                  </p>
                  <p className='text-xs text-gray-500 truncate'>
                    {getRoleLabel(currentOrg.role)}
                  </p>
                </div>
                <MaterialIcon name='unfold_more' className='text-gray-400 text-lg' />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start' className='w-64'>
              <div className='px-2 py-1.5 text-xs font-medium text-gray-500 uppercase'>
                Mis Clubes
              </div>
              {organizations.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => handleSwitchOrganization(org)}
                  className={cn(
                    'flex items-center gap-3 cursor-pointer',
                    org.id === currentOrg?.id && 'bg-teal-50'
                  )}
                >
                  <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm'>
                    {org.name.charAt(0).toUpperCase()}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-gray-900 truncate'>
                      {org.name}
                    </p>
                    <span className={cn('text-xs px-1.5 py-0.5 rounded', getRoleColor(org.role))}>
                      {getRoleLabel(org.role)}
                    </span>
                  </div>
                  {org.id === currentOrg?.id && (
                    <MaterialIcon name='check' className='text-teal-600 text-lg' />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <Link href='/perfil'>
                <DropdownMenuItem className='cursor-pointer'>
                  <MaterialIcon name='settings' className='text-gray-500 text-lg mr-2' />
                  Gestionar clubes
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className='px-3 py-2 text-sm text-gray-500'>
            Sin organización
          </div>
        )}
      </div>

      <nav className='flex-1 p-4 space-y-2'>
        {menuItems.map((item) => (
          <div key={item.title}>
            {item.submenu ? (
              <div>
                <Button
                  variant='ghost'
                  className={cn(
                    'w-full justify-between text-left font-medium px-4 py-2 rounded-lg transition-all duration-150', // Removed duplicate styles and color conflicts
                    'text-base font-normal text-[#64748B] leading-relaxed',
                    expandedItems.includes(item.title) &&
                      'bg-[#1E40AF]/5 text-[#1E40AF]',
                    'hover:bg-[#1E40AF]/5 hover:text-[#1E40AF]'
                  )}
                  onClick={() => toggleExpanded(item.title)}
                >
                  <span className='flex items-center gap-3'>
                    <MaterialIcon
                      name={
                        expandedItems.includes(item.title)
                          ? 'expand_less'
                          : 'expand_more'
                      }
                      className='text-lg transition-colors'
                    />
                    {item.title}
                  </span>
                </Button>

                {expandedItems.includes(item.title) && (
                  <div className='ml-4 mt-2 space-y-1'>
                    {item.submenu.map((subItem) => (
                      <Link key={subItem.href} href={subItem.href}>
                        <Button
                          variant='ghost'
                          className={cn(
                            'w-full justify-start gap-3 text-[#1E40AF] hover:bg-[#1E40AF]/5 font-medium px-4 py-2 rounded-lg transition-all duration-150',
                            'text-sm font-normal text-[#94A3B8] leading-normal',
                            pathname === subItem.href &&
                              'bg-[#1E40AF] text-white hover:bg-[#1D4ED8]'
                          )}
                        >
                          <MaterialIcon
                            name={subItem.icon}
                            className={cn(
                              'text-lg transition-colors',
                              pathname === subItem.href
                                ? 'text-white'
                                : 'text-muted-foreground'
                            )}
                            filled={pathname === subItem.href}
                          />
                          {subItem.title}
                        </Button>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link href={item.href}>
                <Button
                  variant='ghost'
                  className={cn(
                    'w-full justify-start gap-3 text-[#1E40AF] hover:bg-[#1E40AF]/5 font-medium px-4 py-2 rounded-lg transition-all duration-150',
                    'text-base font-normal text-[#64748B] leading-relaxed',
                    pathname === item.href &&
                      'bg-[#1E40AF] text-white hover:bg-[#1D4ED8]'
                  )}
                >
                  <MaterialIcon
                    name={item.icon}
                    className={cn(
                      'text-lg transition-colors',
                      pathname === item.href
                        ? 'text-white'
                        : 'text-muted-foreground'
                    )}
                    filled={pathname === item.href}
                  />
                  {item.title}
                </Button>
              </Link>
            )}
          </div>
        ))}
      </nav>
    </div>
  )

  return (
    <>
      {/* Sidebar - Desktop Only */}
      <aside className='hidden md:block w-64 bg-sidebar border-r border-sidebar-border'>
        {sidebarContent}
      </aside>
    </>
  )
}
