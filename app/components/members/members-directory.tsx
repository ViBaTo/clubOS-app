'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { ClientAvatar } from '@/components/ui/client-avatar'
import { cn } from '@/lib/utils'
import { CreateClientModal } from '@/app/components/clients/create-client-modal'
import { getSupabaseClient } from '@/app/lib/supabaseClient'

const MaterialIcon = ({
  name,
  className = ''
}: {
  name: string
  className?: string
}) => <span className={cn('material-symbols-outlined', className)}>{name}</span>

interface Member {
  id: string
  nombre: string
  telefono: string
  categoria:
    | 'Principiante'
    | 'Intermedio'
    | 'Avanzado'
    | 'Competición'
    | 'Veterano'
  estado: 'Activo' | 'Inactivo'
  avatar?: string
}

const getCategoryBadgeColor = (categoria: Member['categoria']) => {
  switch (categoria) {
    case 'Principiante':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
    case 'Intermedio':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
    case 'Avanzado':
      return 'bg-orange-100 text-orange-800 hover:bg-orange-200'
    case 'Competición':
      return 'bg-red-100 text-red-800 hover:bg-red-200'
    case 'Veterano':
      return 'bg-purple-100 text-purple-800 hover:bg-purple-200'
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
  }
}

const getStatusBadgeColor = (estado: Member['estado']) => {
  return estado === 'Activo'
    ? 'bg-green-100 text-green-800 hover:bg-green-200'
    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
}

const getFirstName = (nombre: string) => {
  return nombre.split(' ')[0] || nombre
}

export function MembersDirectory() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showCreateClient, setShowCreateClient] = useState(false)
  const router = useRouter()
  const [members, setMembers] = useState<Member[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const supabase = getSupabaseClient()
        const session = (await supabase.auth.getSession()).data.session
        const token = session?.access_token
        const params = new URLSearchParams()
        if (statusFilter !== 'all') params.set('status', statusFilter)
        if (searchTerm) params.set('q', searchTerm)
        const res = await fetch(`/api/clients?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Error loading clients')
        const list = (json.clients as any[]).map((c) => ({
          id: c.id,
          nombre: c.full_name || 'Sin nombre',
          telefono: c.phone || '',
          categoria: 'Intermedio' as const,
          estado: (c.status === 'active'
            ? 'Activo'
            : 'Inactivo') as Member['estado']
        }))
        setMembers(list)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchClients()
  }, [searchTerm, statusFilter])

  const source = members ?? []
  const filteredMembers = source.filter((member) => {
    const matchesSearch =
      member.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.telefono.includes(searchTerm)
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active'
        ? member.estado === 'Activo'
        : member.estado === 'Inactivo')
    const matchesCategory =
      categoryFilter === 'all' || member.categoria === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  const handleViewProfile = (memberId: string) => {
    router.push(`/clientes/${memberId}/perfil`)
  }

  return (
    <>
      <div className='flex-1 space-y-6 p-8'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <MaterialIcon name='group' className='text-2xl text-primary' />
            <h1 className='text-5xl font-bold text-[#0F172A] leading-tight tracking-tight'>
              Clientes
            </h1>
          </div>
          <Button
            className='bg-[#1E40AF] hover:bg-[#1D4ED8] active:bg-[#1E3A8A] text-white font-medium px-6 py-3 rounded-lg transition-all duration-150 shadow-sm hover:shadow-md'
            onClick={() => setShowCreateClient(true)}
          >
            <MaterialIcon name='add' className='text-lg mr-2' />
            Agregar Cliente
          </Button>
        </div>

        <Card>
          <CardHeader className='p-0'>
            <CardTitle className='text-xl font-semibold text-[#0F172A] leading-snug'>
              Buscar y Filtrar
            </CardTitle>
          </CardHeader>
          <CardContent className='pt-0'>
            <div className='flex flex-col md:flex-row gap-6'>
              <div className='flex-1'>
                <div className='relative'>
                  <MaterialIcon
                    name='search'
                    className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground'
                  />
                  <Input
                    placeholder='Buscar por nombre o teléfono...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-full md:w-48'>
                  <SelectValue placeholder='Estado' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todos los estados</SelectItem>
                  <SelectItem value='active'>Activo</SelectItem>
                  <SelectItem value='inactive'>Inactivo</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className='w-full md:w-48'>
                  <SelectValue placeholder='Categoría' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todas las categorías</SelectItem>
                  <SelectItem value='Principiante'>Principiante</SelectItem>
                  <SelectItem value='Intermedio'>Intermedio</SelectItem>
                  <SelectItem value='Avanzado'>Avanzado</SelectItem>
                  <SelectItem value='Competición'>Competición</SelectItem>
                  <SelectItem value='Veterano'>Veterano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {error && <div className='text-sm text-red-600'>{error}</div>}

        <Card>
          <CardHeader className='p-0'>
            <CardTitle className='text-xl font-semibold text-[#0F172A] leading-snug'>
              Directorio de Clientes ({loading ? '...' : filteredMembers.length}
              )
            </CardTitle>
          </CardHeader>
          <CardContent className='pt-0'>
            <div className='rounded-md border border-[#94A3B8]/20'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='text-xs font-medium text-[#94A3B8] uppercase tracking-wide'>
                      Cliente
                    </TableHead>
                    <TableHead className='text-xs font-medium text-[#94A3B8] uppercase tracking-wide'>
                      Teléfono
                    </TableHead>
                    <TableHead className='text-xs font-medium text-[#94A3B8] uppercase tracking-wide'>
                      Categoría
                    </TableHead>
                    <TableHead className='text-xs font-medium text-[#94A3B8] uppercase tracking-wide'>
                      Estado
                    </TableHead>
                    <TableHead className='text-right text-xs font-medium text-[#94A3B8] uppercase tracking-wide'>
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow
                      key={member.id}
                      className='hover:bg-muted/50 border-b border-[#94A3B8]/20'
                    >
                      <TableCell>
                        <div className='flex items-center gap-3'>
                          <ClientAvatar
                            firstName={getFirstName(member.nombre)}
                            imageUrl={member.avatar}
                            size='md'
                          />
                          <div>
                            <div className='text-base font-normal text-[#64748B] leading-relaxed font-medium'>
                              {member.nombre}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className='text-sm font-normal text-[#94A3B8] leading-normal'>
                        {member.telefono}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant='secondary'
                          className={getCategoryBadgeColor(member.categoria)}
                        >
                          {member.categoria}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant='secondary'
                          className={getStatusBadgeColor(member.estado)}
                        >
                          {member.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex items-center justify-end gap-2'>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-8 w-8 p-0 text-[#1E40AF] hover:bg-[#1E40AF]/5 font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed'
                            onClick={() => handleViewProfile(member.id)}
                          >
                            <MaterialIcon
                              name='visibility'
                              className='text-base text-muted-foreground hover:text-foreground'
                            />
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-8 w-8 p-0 text-red-600 hover:bg-red-600/5 font-medium rounded-lg transition-all duration-150'
                          >
                            <MaterialIcon
                              name='delete'
                              className='text-base text-red-600 hover:text-red-700'
                            />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className='md:hidden space-y-6'>
          {filteredMembers.map((member) => (
            <Card key={`mobile-${member.id}`}>
              <CardContent className='p-0'>
                <div className='flex items-start justify-between'>
                  <div className='flex items-center gap-3'>
                    <ClientAvatar
                      firstName={getFirstName(member.nombre)}
                      imageUrl={member.avatar}
                      size='lg'
                    />
                    <div>
                      <div className='text-base font-normal text-[#64748B] leading-relaxed font-medium'>
                        {member.nombre}
                      </div>
                      <div className='text-sm font-normal text-[#94A3B8] leading-normal'>
                        {member.telefono}
                      </div>
                      <div className='flex gap-2 mt-2'>
                        <Badge
                          variant='secondary'
                          className={getCategoryBadgeColor(member.categoria)}
                        >
                          {member.categoria}
                        </Badge>
                        <Badge
                          variant='secondary'
                          className={getStatusBadgeColor(member.estado)}
                        >
                          {member.estado}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className='flex gap-1'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 w-8 p-0 text-[#1E40AF] hover:bg-[#1E40AF]/5 font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed'
                      onClick={() => handleViewProfile(member.id)}
                    >
                      <MaterialIcon
                        name='visibility'
                        className='text-base text-muted-foreground'
                      />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 w-8 p-0 text-red-600 hover:bg-red-600/5 font-medium rounded-lg transition-all duration-150'
                    >
                      <MaterialIcon
                        name='delete'
                        className='text-base text-red-600'
                      />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <CreateClientModal
        open={showCreateClient}
        onOpenChange={setShowCreateClient}
        onSuccess={() => {
          // Refresh the members list
          window.location.reload()
        }}
      />
    </>
  )
}
