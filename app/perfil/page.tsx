'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
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

interface Organization {
  id: string
  name: string
  slug: string
  club_type: string
  club_logo: string | null
  status: string
  access_code: string | null
  role: string
  is_primary: boolean
  joined_via: string
  joined_at: string
}

interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  created_at: string
}

const clubTypeLabels: Record<string, string> = {
  'tenis_padel': 'Tenis / Pádel',
  'multideportivo': 'Multideportivo',
  'futbol': 'Fútbol',
  'acuatico': 'Acuático',
  'gimnasio_fitness': 'Gimnasio / Fitness',
  'artes_marciales': 'Artes Marciales',
  'golf': 'Golf'
}

const roleLabels: Record<string, string> = {
  'owner': 'Propietario',
  'admin': 'Administrador',
  'staff': 'Staff',
  'member': 'Miembro',
  'viewer': 'Visualizador'
}

const roleColors: Record<string, string> = {
  'owner': 'bg-purple-100 text-purple-800',
  'admin': 'bg-blue-100 text-blue-800',
  'staff': 'bg-green-100 text-green-800',
  'member': 'bg-gray-100 text-gray-800',
  'viewer': 'bg-slate-100 text-slate-800'
}

export default function PerfilPage() {
  const router = useRouter()
  const { user, loading: userLoading } = useCurrentUser()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/user/organizations', { 
          cache: 'no-store',
          credentials: 'include'
        })
        if (!res.ok) {
          if (res.status === 401) {
            // Only redirect to login if we're sure user is not authenticated
            router.push('/login')
            return
          }
          throw new Error('Failed to fetch')
        }
        const data = await res.json()
        setProfile(data.user)
        setOrganizations(data.organizations || [])
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

    // Wait for auth check to complete
    if (!userLoading) {
      if (!user) {
        // Double-check with API before redirecting
        fetchData()
      } else {
        fetchData()
      }
    }
  }, [user, userLoading, router])

  const handleSetPrimary = async (orgId: string) => {
    setSettingPrimary(orgId)
    try {
      const res = await fetch('/api/user/organizations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: orgId })
      })
      
      if (res.ok) {
        setOrganizations(prev => prev.map(org => ({
          ...org,
          is_primary: org.id === orgId
        })))
      }
    } catch (error) {
      console.error('Error setting primary:', error)
    } finally {
      setSettingPrimary(null)
    }
  }

  const handleLogout = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const handleOpenClub = (org: Organization) => {
    // Store selected organization in localStorage for the app to use
    localStorage.setItem('selectedOrganizationId', org.id)
    localStorage.setItem('selectedOrganizationName', org.name)
    // Navigate to calendar or dashboard
    router.push('/calendario')
  }

  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <MaterialIcon name="progress_activity" className="text-2xl animate-spin" />
          <span>Cargando perfil...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Mi Perfil</h1>
          <p className="text-muted-foreground mt-1">Gestiona tu cuenta y tus clubes</p>
        </div>

        {/* User Profile Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-xl">{profile?.full_name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <MaterialIcon name="mail" className="text-base" />
                  {profile?.email}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <MaterialIcon name="logout" className="text-lg mr-2" />
                Cerrar sesión
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Organizations Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Mis Clubes</h2>
              <p className="text-sm text-muted-foreground">
                {organizations.length} {organizations.length === 1 ? 'club' : 'clubes'} asociados a tu cuenta
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push('/registro/unirse')}>
              <MaterialIcon name="add" className="text-lg mr-2" />
              Unirse a un club
            </Button>
          </div>

          {organizations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MaterialIcon name="domain_disabled" className="text-5xl text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No tienes clubes asociados
                </h3>
                <p className="text-muted-foreground mb-6">
                  Únete a un club existente o crea uno nuevo para empezar
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => router.push('/registro/unirse')}>
                    <MaterialIcon name="group_add" className="text-lg mr-2" />
                    Unirse a un club
                  </Button>
                  <Button onClick={() => router.push('/registro/nuevo-club')}>
                    <MaterialIcon name="add_business" className="text-lg mr-2" />
                    Crear un club
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {organizations.map((org) => (
                <Card 
                  key={org.id} 
                  className={cn(
                    "transition-all hover:shadow-md cursor-pointer",
                    org.is_primary && "ring-2 ring-primary"
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Club Logo */}
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                        {org.club_logo ? (
                          <img 
                            src={org.club_logo} 
                            alt={org.name} 
                            className="h-10 w-10 object-contain rounded-lg"
                          />
                        ) : (
                          <MaterialIcon 
                            name="sports_tennis" 
                            className="text-3xl text-primary" 
                            filled 
                          />
                        )}
                      </div>

                      {/* Club Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-foreground truncate">
                            {org.name}
                          </h3>
                          {org.is_primary && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                              Principal
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <MaterialIcon name="category" className="text-base" />
                            {clubTypeLabels[org.club_type] || org.club_type}
                          </span>
                          <span className="flex items-center gap-1">
                            <Badge 
                              variant="secondary" 
                              className={cn("text-xs", roleColors[org.role])}
                            >
                              {roleLabels[org.role] || org.role}
                            </Badge>
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MaterialIcon name="calendar_today" className="text-sm" />
                          Miembro desde {new Date(org.joined_at).toLocaleDateString('es-ES', { 
                            year: 'numeric', 
                            month: 'long' 
                          })}
                          {org.access_code && (
                            <>
                              <Separator orientation="vertical" className="h-3" />
                              <span className="font-mono bg-muted px-2 py-0.5 rounded">
                                {org.access_code}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!org.is_primary && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSetPrimary(org.id)
                            }}
                            disabled={settingPrimary === org.id}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {settingPrimary === org.id ? (
                              <MaterialIcon name="progress_activity" className="text-lg animate-spin" />
                            ) : (
                              <>
                                <MaterialIcon name="star" className="text-lg mr-1" />
                                <span className="hidden sm:inline">Hacer principal</span>
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenClub(org)
                          }}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <MaterialIcon name="open_in_new" className="text-lg mr-2" />
                          Abrir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acciones rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button 
                variant="outline" 
                className="justify-start h-auto py-4"
                onClick={() => router.push('/registro/nuevo-club')}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <MaterialIcon name="add_business" className="text-xl text-green-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Crear nuevo club</div>
                    <div className="text-xs text-muted-foreground">Registra tu propio club</div>
                  </div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="justify-start h-auto py-4"
                onClick={() => router.push('/registro/unirse')}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <MaterialIcon name="group_add" className="text-xl text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Unirse a club</div>
                    <div className="text-xs text-muted-foreground">Con código de acceso</div>
                  </div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="justify-start h-auto py-4"
                onClick={() => router.push('/settings/notifications')}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <MaterialIcon name="settings" className="text-xl text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Configuración</div>
                    <div className="text-xs text-muted-foreground">Preferencias de cuenta</div>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
