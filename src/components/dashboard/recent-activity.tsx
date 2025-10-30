import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/app/lib/supabaseClient'

const getTypeBadge = (type: string) => {
  switch (type) {
    case 'enrollment':
      return (
        <Badge variant='default' className='bg-[#059669] text-white'>
          Inscripción
        </Badge>
      )
    case 'completion':
      return (
        <Badge variant='default' className='bg-[#1E40AF] text-white'>
          Completado
        </Badge>
      )
    case 'cancellation':
      return <Badge variant='destructive'>Cancelación</Badge>
    default:
      return <Badge variant='secondary'>Actividad</Badge>
  }
}

export function RecentActivity() {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = getSupabaseClient()
        const session = (await supabase.auth.getSession()).data.session
        const token = session?.access_token
        const res = await fetch('/api/activity/recent', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        })
        if (res.ok) {
          const json = await res.json()
          setActivities(Array.isArray(json.activities) ? json.activities : [])
        } else {
          setActivities([])
        }
      } catch (e: any) {
        setError(e.message)
        setActivities([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <Card>
      <CardHeader className='p-0'>
        <CardTitle className='text-xl font-semibold text-[#0F172A] leading-snug'>
          Actividad Reciente
        </CardTitle>
      </CardHeader>
      <CardContent className='pt-0'>
        {error && <div className='text-sm text-red-600'>{error}</div>}
        {loading ? (
          <div className='text-sm text-[#94A3B8]'>Cargando...</div>
        ) : activities.length === 0 ? (
          <div className='text-sm text-[#94A3B8]'>
            No hay actividad reciente.
          </div>
        ) : (
          <div className='space-y-6'>
            {activities.map((activity) => (
              <div key={activity.id} className='flex items-center gap-4'>
                <Avatar className='h-10 w-10'>
                  <AvatarImage
                    src={activity.avatar || '/placeholder.svg'}
                    alt={activity.user}
                  />
                  <AvatarFallback className='bg-muted'>
                    {String(activity.user || '')
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div className='flex-1 space-y-1'>
                  <p className='text-base font-normal text-[#64748B] leading-relaxed'>
                    <span className='font-medium'>{activity.user}</span>{' '}
                    <span className='text-[#94A3B8]'>{activity.action}</span>{' '}
                    <span className='font-medium'>{activity.target}</span>
                  </p>
                  <p className='text-sm font-normal text-[#94A3B8] leading-normal'>
                    {activity.time}
                  </p>
                </div>
                {getTypeBadge(activity.type)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
