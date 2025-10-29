'use client'

import type React from 'react'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/app/components/layout/sidebar'
import { Navbar } from '@/app/components/layout/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { toast } from '@/hooks/use-toast'
import { getSupabaseClient } from '@/app/lib/supabaseClient'
import { cn } from '@/lib/utils'
import { getCategoryBadgeColorByName } from '@/lib/category-colors'

const MaterialIcon = ({
  name,
  className = '',
  title
}: {
  name: string
  className?: string
  title?: string
}) => (
  <span className={cn('material-symbols-outlined', className)} title={title}>
    {name}
  </span>
)

interface PaymentRecord {
  id: string
  fecha: string
  metodo: 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Bizum' | 'PayPal'
  cantidad: number
  estado: 'Completado' | 'Pendiente' | 'Fallido'
  comprobante?: string
  verificado: boolean
}

interface ClassPackage {
  id: string
  nombre: string
  fechaCompra: string
  fechaVencimiento: string
  clasesTotales: number
  clasesUtilizadas: number
  estado: 'Activo' | 'Vencido' | 'Agotado'
  precio: number
  instructor?: string
  tipoClase: 'Grupal' | 'Individual' | 'Academia'
  estadoPago: 'Pagado' | 'Pendiente' | 'Vencido'
  metodoPago?: 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Bizum' | 'PayPal'
  planPago: 'Completo' | 'Cuotas'
  proximoPago?: string
  pagosRealizados: PaymentRecord[]
  autoRenovacion: boolean
  paymentId?: string
  receiptUrl?: string
}

interface AttendanceRecord {
  id: string
  fecha: string
  instructor: string
  tipoClase: 'Grupal' | 'Individual' | 'Academia'
  paqueteId: string
  paqueteNombre: string
}

interface ClientProfile {
  id: string
  nombre: string
  email: string
  telefono: string
  fechaNacimiento: string
  dni: string
  direccion: string
  contactoEmergencia: string
  categoria: string
  categoriaId: string | null
  estado: 'Activo' | 'Inactivo'
  avatar?: string
  fechaRegistro: string
  instructorPreferido: string
  horarioHabitual: string
  rating: number
  paquetes: ClassPackage[]
  historialAsistencia: AttendanceRecord[]
}

export default function ClientProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<ClientProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  )
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [attendanceModal, setAttendanceModal] = useState({
    isOpen: false,
    packageId: '',
    date: new Date().toISOString().split('T')[0],
    instructor: '',
    comments: ''
  })

  const [addPackageModal, setAddPackageModal] = useState({
    isOpen: false,
    selectedProductId: '' as string,
    loading: false,
    products: [] as any[]
  })

  const [receiptUpload, setReceiptUpload] = useState({
    packageId: '' as string,
    uploading: false
  })
  const receiptInputId = 'receipt-file-input'

  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    packageId: '',
    metodo: '' as
      | 'Efectivo'
      | 'Transferencia'
      | 'Tarjeta'
      | 'Bizum'
      | 'PayPal'
      | '',
    cantidad: 0,
    comprobante: null as File | null,
    notas: ''
  })

  useEffect(() => {
    const load = async () => {
      try {
        const id = String(params?.id || '')
        if (!id) return
        const supabase = getSupabaseClient()
        const session = (await supabase.auth.getSession()).data.session
        const token = session?.access_token
        const res = await fetch(`/api/clients/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        })
        const json = await res.json()
        if (!res.ok)
          throw new Error(json.error || 'No se pudo cargar el cliente')
        const c = json.client
        setClient((prev) => ({
          id: c.id,
          nombre: c.full_name || 'Sin nombre',
          email: c.email || '',
          telefono: c.phone || '',
          dni: c.document_id || '',
          categoria: c.category_name || '',
          categoriaId: c.categoria_id || null,
          estado:
            String(c.status || '')
              .toLowerCase()
              .trim() === 'active'
              ? 'Activo'
              : 'Inactivo',
          fechaRegistro: c.created_at || new Date().toISOString(),
          direccion: prev?.direccion || '',
          contactoEmergencia: prev?.contactoEmergencia || '',
          fechaNacimiento:
            prev?.fechaNacimiento || new Date().toISOString().substring(0, 10),
          instructorPreferido: prev?.instructorPreferido || '',
          horarioHabitual: prev?.horarioHabitual || '',
          rating: prev?.rating ?? 0,
          paquetes: prev?.paquetes || [],
          historialAsistencia: prev?.historialAsistencia || []
        }))
      } catch (e: any) {
        toast({
          title: 'Error',
          description: e.message,
          variant: 'destructive' as any
        })
      }
    }
    load()
  }, [params?.id])

  useEffect(() => {
    const loadPurchases = async () => {
      try {
        const id = String(params?.id || '')
        if (!id) return
        const supabase = getSupabaseClient()
        const session = (await supabase.auth.getSession()).data.session
        const token = session?.access_token
        const res = await fetch(`/api/clients/${id}/purchases`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        })
        const json = await res.json()
        if (!res.ok)
          throw new Error(json.error || 'No se pudieron cargar los paquetes')

        const purchases = (json?.purchases || []) as any[]

        const mapped = purchases.map((ps) => {
          const product = ps.products || {}
          const payment = (ps.payments && ps.payments[0]) || null
          const total = Number(ps.classes_total ?? 0)
          const remaining = Number(ps.classes_remaining ?? 0)
          const safeTotal = total > 0 ? total : 1
          const used = Math.max(0, safeTotal - (total > 0 ? remaining : 0))

          const estadoMap: Record<string, 'Activo' | 'Vencido' | 'Agotado'> = {
            active: 'Activo',
            expired: 'Vencido',
            consumed: 'Agotado',
            cancelled: 'Vencido'
          }
          const pagoMap: Record<string, 'Pagado' | 'Pendiente' | 'Vencido'> = {
            paid: 'Pagado',
            pending: 'Pendiente',
            overdue: 'Vencido',
            partial: 'Pendiente'
          }
          const tipoMap: Record<string, 'Grupal' | 'Individual' | 'Academia'> =
            {
              class_package: 'Grupal',
              individual_class: 'Individual',
              academy: 'Academia'
            }

          return {
            id: ps.id as string,
            nombre: String(product.name || 'Producto'),
            fechaCompra: String(ps.created_at || new Date().toISOString()),
            fechaVencimiento: String(
              ps.expiry_date || ps.created_at || new Date().toISOString()
            ),
            clasesTotales: safeTotal,
            clasesUtilizadas: used,
            estado: estadoMap[String(ps.status || 'active')] || 'Activo',
            precio: Number(ps.total_price ?? ps.unit_price ?? 0),
            instructor: undefined,
            tipoClase:
              tipoMap[String(product.product_type || 'academy')] || 'Academia',
            estadoPago:
              pagoMap[String(ps.payment_status || 'pending')] || 'Pendiente',
            metodoPago: undefined,
            planPago: 'Completo',
            proximoPago: undefined,
            pagosRealizados: [],
            autoRenovacion: false,
            paymentId: payment?.id,
            receiptUrl: payment?.receipt_url || undefined
          } as ClassPackage
        })

        setClient((prev) => {
          if (prev) return { ...prev, paquetes: mapped }
          const idStr = String(params?.id || '')
          return {
            id: idStr,
            nombre: 'Sin nombre',
            email: '',
            telefono: '',
            fechaNacimiento: new Date().toISOString().substring(0, 10),
            dni: '',
            direccion: '',
            contactoEmergencia: '',
            categoria: '',
            categoriaId: null,
            estado: 'Activo',
            avatar: undefined,
            fechaRegistro: new Date().toISOString(),
            instructorPreferido: '',
            horarioHabitual: '',
            rating: 0,
            paquetes: mapped,
            historialAsistencia: []
          }
        })
      } catch (e: any) {
        toast({
          title: 'Error',
          description: e.message,
          variant: 'destructive' as any
        })
      }
    }
    loadPurchases()
  }, [params?.id])

  const openAddPackageModal = async () => {
    try {
      setAddPackageModal((prev) => ({ ...prev, isOpen: true, loading: true }))
      const supabase = getSupabaseClient()
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`
      const res = await fetch('/api/products', { headers })
      const json = await res.json()
      if (!res.ok)
        throw new Error(json.error || 'No se pudieron cargar los productos')
      const products = (json.products || []).filter(
        (p: any) => p.is_active !== false
      )
      setAddPackageModal((prev) => ({ ...prev, products }))
    } catch (e) {
      setAddPackageModal((prev) => ({ ...prev, products: [] }))
    } finally {
      setAddPackageModal((prev) => ({ ...prev, loading: false }))
    }
  }

  const handleAddPackage = async () => {
    try {
      const product = addPackageModal.products.find(
        (p) => p.id === addPackageModal.selectedProductId
      )
      if (!product || !client) return
      const supabase = getSupabaseClient()
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      if (token) headers.Authorization = `Bearer ${token}`

      const payload: Record<string, any> = {
        client_id: client.id,
        product_id: product.id,
        quantity: 1,
        unit_price: product.price ?? 0,
        total_price: product.price ?? 0,
        status: 'active',
        organization_id: product.organization_id ?? undefined
      }
      if (product.classes_included != null) {
        payload.classes_total = product.classes_included
        payload.classes_remaining = product.classes_included
      }

      const res = await fetch('/api/products/enroll', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'No se pudo añadir el paquete')

      // Refresh purchases to reflect the new package
      {
        const res2 = await fetch(`/api/clients/${client.id}/purchases`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        })
        const json2 = await res2.json()
        if (res2.ok) {
          const purchases = (json2?.purchases || []) as any[]
          const mapped = purchases.map((ps) => {
            const product = ps.products || {}
            const payment = (ps.payments && ps.payments[0]) || null
            const total = Number(ps.classes_total ?? 0)
            const remaining = Number(ps.classes_remaining ?? 0)
            const safeTotal = total > 0 ? total : 1
            const used = Math.max(0, safeTotal - (total > 0 ? remaining : 0))
            const estadoMap: Record<string, 'Activo' | 'Vencido' | 'Agotado'> =
              {
                active: 'Activo',
                expired: 'Vencido',
                consumed: 'Agotado',
                cancelled: 'Vencido'
              }
            const pagoMap: Record<string, 'Pagado' | 'Pendiente' | 'Vencido'> =
              {
                paid: 'Pagado',
                pending: 'Pendiente',
                overdue: 'Vencido',
                partial: 'Pendiente'
              }
            const tipoMap: Record<
              string,
              'Grupal' | 'Individual' | 'Academia'
            > = {
              class_package: 'Grupal',
              individual_class: 'Individual',
              academy: 'Academia'
            }
            return {
              id: ps.id as string,
              nombre: String(product.name || 'Producto'),
              fechaCompra: String(ps.created_at || new Date().toISOString()),
              fechaVencimiento: String(
                ps.expiry_date || ps.created_at || new Date().toISOString()
              ),
              clasesTotales: safeTotal,
              clasesUtilizadas: used,
              estado: estadoMap[String(ps.status || 'active')] || 'Activo',
              precio: Number(ps.total_price ?? ps.unit_price ?? 0),
              instructor: undefined,
              tipoClase:
                tipoMap[String(product.product_type || 'academy')] ||
                'Academia',
              estadoPago:
                pagoMap[String(ps.payment_status || 'pending')] || 'Pendiente',
              metodoPago: undefined,
              planPago: 'Completo',
              proximoPago: undefined,
              pagosRealizados: [],
              autoRenovacion: false,
              paymentId: payment?.id,
              receiptUrl: payment?.receipt_url || undefined
            } as ClassPackage
          })
          setClient((prev) => {
            if (prev) return { ...prev, paquetes: mapped }
            const idStr = String(params?.id || '')
            return {
              id: idStr,
              nombre: 'Sin nombre',
              email: '',
              telefono: '',
              fechaNacimiento: new Date().toISOString().substring(0, 10),
              dni: '',
              direccion: '',
              contactoEmergencia: '',
              categoria: '',
              categoriaId: null,
              estado: 'Activo',
              avatar: undefined,
              fechaRegistro: new Date().toISOString(),
              instructorPreferido: '',
              horarioHabitual: '',
              rating: 0,
              paquetes: mapped,
              historialAsistencia: []
            }
          })
        }
      }

      toast({
        title: 'Paquete añadido',
        description: 'El paquete se ha asignado al cliente.'
      })
      setAddPackageModal({
        isOpen: false,
        selectedProductId: '',
        loading: false,
        products: []
      })
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message,
        variant: 'destructive' as any
      })
    }
  }

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true)
        const supabase = getSupabaseClient()
        const session = (await supabase.auth.getSession()).data.session
        const token = session?.access_token
        const res = await fetch('/api/categories', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        })
        const json = await res.json()
        if (!res.ok)
          throw new Error(json.error || 'No se pudieron cargar las categorías')
        setCategories(json.categories || [])
      } catch (e) {
        setCategories([])
      } finally {
        setCategoriesLoading(false)
      }
    }
    loadCategories()
  }, [])

  const handleInputChange = (
    field: keyof ClientProfile,
    value: string | boolean
  ) => {
    if (!client) return
    setClient((prev) => (prev ? { ...prev, [field]: value } : prev))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (!client) return
      const supabase = getSupabaseClient()
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token
      const payload: any = {
        full_name: client.nombre,
        email: client.email,
        phone: client.telefono,
        document_id: client.dni,
        // Map estado back to API value
        status: client.estado === 'Activo' ? 'active' : 'inactive',
        categoria_id: client.categoriaId ?? null
      }
      const res = await fetch(`/api/clients/${params?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'No se pudo guardar')
      setHasChanges(false)
      setIsEditing(false)
      if (json.client) {
        setClient((prev) =>
          prev
            ? {
                ...prev,
                categoria: json.client.category_name || prev.categoria,
                categoriaId: json.client.categoria_id ?? prev.categoriaId
              }
            : prev
        )
      }
      toast({ title: 'Cambios guardados', description: 'Perfil actualizado.' })
    } catch (e: any) {
      toast({
        title: 'Error al guardar',
        description: e.message,
        variant: 'destructive' as any
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setHasChanges(false)
  }

  const handleDelete = async () => {
    try {
      const supabase = getSupabaseClient()
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token
      const res = await fetch(`/api/clients/${params?.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'No se pudo eliminar')
      toast({ title: 'Cliente eliminado' })
      router.push('/clientes')
    } catch (e: any) {
      toast({
        title: 'Error al eliminar',
        description: e.message,
        variant: 'destructive' as any
      })
    }
  }

  const handleOpenAttendanceModal = (packageId: string) => {
    setAttendanceModal({
      isOpen: true,
      packageId,
      date: new Date().toISOString().split('T')[0],
      instructor: '',
      comments: ''
    })
  }

  const handleMarkAttendance = async () => {
    if (!attendanceModal.instructor) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona un instructor.',
        variant: 'destructive'
      })
      return
    }

    try {
      const supabase = getSupabaseClient()
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token
      const clientId = String(params?.id || '')
      if (!clientId || !attendanceModal.packageId) return

      const res = await fetch(`/api/clients/${clientId}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          sale_id: attendanceModal.packageId,
          instructor: attendanceModal.instructor,
          date: attendanceModal.date,
          notes: attendanceModal.comments,
          classes_used: 1
        })
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok)
        throw new Error(json.error || 'No se pudo registrar la asistencia')

      // Update local UI: decrement remaining -> increment utilizadas
      setClient((prev) => {
        if (!prev) return prev
        const paquetes = prev.paquetes.map((p) => {
          if (p.id !== attendanceModal.packageId) return p
          const total = Math.max(1, Number(p.clasesTotales || 1))
          const usadas = Math.min(total, Number(p.clasesUtilizadas || 0) + 1)
          const estado = usadas >= total ? 'Agotado' : p.estado
          return { ...p, clasesUtilizadas: usadas, estado }
        })
        return { ...prev, paquetes }
      })

      toast({
        title: 'Asistencia marcada',
        description: 'La clase ha sido marcada como completada correctamente.'
      })

      // Reset and close modal
      setAttendanceModal({
        isOpen: false,
        packageId: '',
        date: new Date().toISOString().split('T')[0],
        instructor: '',
        comments: ''
      })
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message,
        variant: 'destructive'
      })
    }
  }

  const getStatusBadgeColor = (estado: string) => {
    return estado === 'Activo'
      ? 'bg-green-100 text-green-800 hover:bg-green-200'
      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
  }

  // colors imported from shared util

  const getPackageStatusColor = (estado: string) => {
    switch (estado) {
      case 'Activo':
        return 'bg-green-100 text-green-800 hover:bg-green-200'
      case 'Vencido':
        return 'bg-red-100 text-red-800 hover:bg-red-200'
      case 'Agotado':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

  const getPaymentStatusColor = (estado: string) => {
    switch (estado) {
      case 'Pagado':
        return 'bg-green-100 text-green-800 hover:bg-green-200'
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
      case 'Vencido':
        return 'bg-red-100 text-red-800 hover:bg-red-200'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

  const getPaymentStatusIcon = (estado: string) => {
    switch (estado) {
      case 'Pagado':
        return 'check_circle'
      case 'Pendiente':
        return 'schedule'
      case 'Vencido':
        return 'error'
      default:
        return 'help'
    }
  }

  const getPaymentMethodIcon = (metodo: string) => {
    switch (metodo) {
      case 'Efectivo':
        return 'payments'
      case 'Transferencia':
        return 'account_balance'
      case 'Tarjeta':
        return 'credit_card'
      case 'Bizum':
        return 'smartphone'
      case 'PayPal':
        return 'account_balance_wallet'
      default:
        return 'payment'
    }
  }

  const handleOpenPaymentModal = (packageId: string) => {
    if (!client) return
    const paquete = client.paquetes.find((p) => p.id === packageId)
    setPaymentModal({
      isOpen: true,
      packageId,
      metodo: '',
      cantidad: paquete?.precio || 0,
      comprobante: null,
      notas: ''
    })
  }

  const handleProcessPayment = async () => {
    if (!paymentModal.metodo) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona un método de pago.',
        variant: 'destructive'
      })
      return
    }

    try {
      const supabase = getSupabaseClient()
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token
      const clientId = String(params?.id || '')
      if (!clientId || !paymentModal.packageId) return

      const res = await fetch(`/api/clients/${clientId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ sale_id: paymentModal.packageId })
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'No se pudo procesar el pago')

      // Update local package payment status
      setClient((prev) => {
        if (!prev) return prev
        const paquetes = prev.paquetes.map((p) =>
          p.id === paymentModal.packageId
            ? { ...p, estadoPago: 'Pagado' as const }
            : p
        )
        return { ...prev, paquetes }
      })

      toast({
        title: 'Pago procesado',
        description: 'El pago ha sido registrado correctamente.'
      })

      // Reset and close modal
      setPaymentModal({
        isOpen: false,
        packageId: '',
        metodo: '',
        cantidad: 0,
        comprobante: null,
        notas: ''
      })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setPaymentModal((prev) => ({ ...prev, comprobante: file }))
    }
  }

  const getInitials = (nombre: string) => {
    return nombre
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  const getTotalClassesRemaining = () => {
    if (!client) return 0
    return client.paquetes
      .filter((p) => p.estado === 'Activo')
      .reduce((total, p) => total + (p.clasesTotales - p.clasesUtilizadas), 0)
  }

  const getAttendanceRate = () => {
    if (!client) return 0
    const totalClasses = client.paquetes.reduce(
      (total, p) => total + p.clasesUtilizadas,
      0
    )
    const totalPossible = client.paquetes.reduce(
      (total, p) => total + p.clasesTotales,
      0
    )
    return totalPossible > 0
      ? Math.round((totalClasses / totalPossible) * 100)
      : 0
  }

  const handleReceiptFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      const file = e.target.files?.[0]
      e.currentTarget.value = ''
      if (!file || !receiptUpload.packageId || !client) return

      setReceiptUpload((prev) => ({ ...prev, uploading: true }))
      const supabase = getSupabaseClient()

      const path = `receipts/${receiptUpload.packageId}/${Date.now()}-${
        file.name
      }`
      const { error: upErr } = await supabase.storage
        .from('receipts')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        })
      if (upErr) throw upErr

      const { data: pub } = supabase.storage.from('receipts').getPublicUrl(path)
      const url = pub.publicUrl

      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch(`/api/clients/${client.id}/payments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sale_id: receiptUpload.packageId,
          receipt_url: url
        })
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok)
        throw new Error(json.error || 'No se pudo guardar la factura')

      setClient((prev) => {
        if (!prev) return prev
        const paquetes = prev.paquetes.map((p) =>
          p.id === receiptUpload.packageId ? { ...p, receiptUrl: url } : p
        )
        return { ...prev, paquetes }
      })

      toast({
        title: 'Factura añadida',
        description: 'El documento ha sido guardado.'
      })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setReceiptUpload({ packageId: '', uploading: false })
    }
  }

  if (!client) {
    return (
      <div className='flex h-screen bg-[#F1F5F9]'>
        <Sidebar />
        <div className='flex-1 flex flex-col overflow-hidden'>
          <Navbar />
          <main className='flex-1 overflow-y-auto p-8'>
            <div className='max-w-7xl mx-auto space-y-8'>
              <Card className='bg-white rounded-xl shadow-sm border-0 p-8'>
                <div className='text-[#64748B]'>Cargando cliente...</div>
              </Card>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-screen bg-[#F1F5F9]'>
      <Sidebar />

      <div className='flex-1 flex flex-col overflow-hidden'>
        <Navbar />

        <main className='flex-1 overflow-y-auto p-8'>
          <div className='max-w-7xl mx-auto space-y-8'>
            <input
              id={receiptInputId}
              type='file'
              accept='application/pdf,image/*'
              className='hidden'
              onChange={handleReceiptFileChange}
            />
            {/* Breadcrumb */}
            <div className='flex items-center gap-2 text-sm text-[#94A3B8]'>
              <button
                onClick={() => router.push('/clientes')}
                className='hover:text-[#1E40AF] transition-colors'
              >
                Clientes
              </button>
              <MaterialIcon name='chevron_right' className='text-xs' />
              <span className='text-[#0F172A] font-medium'>
                {client?.nombre}
              </span>
            </div>

            <Card className='bg-white rounded-xl shadow-sm border-0 p-8 hover:shadow-md transition-shadow duration-200'>
              <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6'>
                {/* Left side: Avatar + Client info */}
                <div className='flex items-center gap-6'>
                  <div className='relative group'>
                    <Avatar className='h-20 w-20 border-4 border-white shadow-lg'>
                      <AvatarImage
                        src={client?.avatar || '/placeholder.svg'}
                        alt={client?.nombre}
                      />
                      <AvatarFallback className='bg-[#1E40AF]/10 text-[#1E40AF] text-xl font-semibold'>
                        {getInitials(client?.nombre || '')}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <Button
                        variant='ghost'
                        size='sm'
                        className='absolute inset-0 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity'
                      >
                        <MaterialIcon name='photo_camera' className='text-lg' />
                      </Button>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <h1 className='text-3xl font-bold text-[#0F172A] leading-tight tracking-tight'>
                      {client?.nombre}
                    </h1>
                    <div className='flex items-center gap-4'>
                      <div className='flex items-center gap-2'>
                        <Switch
                          checked={client?.estado === 'Activo'}
                          onCheckedChange={(checked) =>
                            handleInputChange(
                              'estado',
                              checked ? 'Activo' : 'Inactivo'
                            )
                          }
                          disabled={!isEditing}
                        />
                        <Badge
                          variant='secondary'
                          className={getStatusBadgeColor(
                            client?.estado || 'Inactivo'
                          )}
                        >
                          {client?.estado}
                        </Badge>
                      </div>
                      <div className='text-sm text-[#94A3B8]'>
                        Cliente desde{' '}
                        {new Date(
                          client?.fechaRegistro || new Date().toISOString()
                        ).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side: Quick Actions */}
                <div className='flex flex-wrap gap-3'>
                  {!isEditing ? (
                    <>
                      <Button
                        onClick={() => setIsEditing(true)}
                        className='bg-[#1E40AF] hover:bg-[#1D4ED8] active:bg-[#1E3A8A] text-white font-medium px-6 py-3 rounded-lg transition-all duration-150 shadow-sm hover:shadow-md'
                      >
                        <MaterialIcon name='edit' className='text-lg mr-2' />
                        Editar perfil
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                        className='bg-[#1E40AF] hover:bg-[#1D4ED8] active:bg-[#1E3A8A] text-white font-medium px-6 py-3 rounded-lg transition-all duration-150 shadow-sm hover:shadow-md'
                      >
                        {isSaving ? (
                          <>
                            <MaterialIcon
                              name='sync'
                              className='text-lg mr-2 animate-spin'
                            />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <MaterialIcon
                              name='save'
                              className='text-lg mr-2'
                            />
                            Guardar cambios
                          </>
                        )}
                      </Button>

                      <Button
                        variant='outline'
                        onClick={handleCancel}
                        className='border border-[#94A3B8]/30 hover:border-[#1E40AF] hover:bg-[#1E40AF]/5 text-[#0F172A] font-medium px-6 py-3 rounded-lg transition-all duration-150 bg-transparent'
                      >
                        <MaterialIcon name='close' className='text-lg mr-2' />
                        Cancelar
                      </Button>
                    </>
                  )}

                  <Button
                    variant='outline'
                    onClick={() =>
                      router.push(`/clientes/${client?.id}/historial`)
                    }
                    className='border border-[#94A3B8]/30 hover:border-[#1E40AF] hover:bg-[#1E40AF]/5 text-[#0F172A] font-medium px-6 py-3 rounded-lg transition-all duration-150'
                  >
                    <MaterialIcon name='history' className='text-lg mr-2' />
                    Historial
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant='outline'
                        className='border border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 font-medium px-6 py-3 rounded-lg transition-all duration-150 bg-transparent'
                      >
                        <MaterialIcon name='delete' className='text-lg mr-2' />
                        Eliminar cliente
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará
                          permanentemente el perfil de {client.nombre} y todos
                          sus datos asociados.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className='bg-red-600 hover:bg-red-700'
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='outline'
                        size='icon'
                        className='border border-[#94A3B8]/30 hover:border-[#1E40AF] hover:bg-[#1E40AF]/5 text-[#0F172A] w-12 h-12 rounded-lg transition-all duration-150 bg-transparent'
                      >
                        <MaterialIcon name='more_vert' className='text-lg' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem>
                        <MaterialIcon name='print' className='text-sm mr-2' />
                        Imprimir perfil
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <MaterialIcon name='share' className='text-sm mr-2' />
                        Compartir
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <MaterialIcon name='archive' className='text-sm mr-2' />
                        Archivar cliente
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Card>

            <Card className='bg-white rounded-xl shadow-sm border-0 p-8 hover:shadow-md transition-shadow duration-200'>
              <CardHeader className='p-0 mb-6'>
                <CardTitle className='text-xl font-semibold text-[#0F172A] leading-snug flex items-center gap-3'>
                  <MaterialIcon
                    name='person'
                    className='text-2xl text-[#1E40AF]'
                  />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className='p-0'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-[#0F172A] mb-2 block'>
                      Nombre completo *
                    </Label>
                    {isEditing ? (
                      <Input
                        value={client?.nombre || ''}
                        onChange={(e) =>
                          handleInputChange('nombre', e.target.value)
                        }
                        className='border border-[#94A3B8]/30 focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 rounded-lg px-4 py-3 text-[#0F172A] placeholder-[#94A3B8] bg-white transition-all duration-150'
                      />
                    ) : (
                      <p className='text-[#0F172A] font-medium'>
                        {client?.nombre}
                      </p>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-[#0F172A] mb-2 block'>
                      Email *
                    </Label>
                    {isEditing ? (
                      <Input
                        type='email'
                        value={client?.email || ''}
                        onChange={(e) =>
                          handleInputChange('email', e.target.value)
                        }
                        className='border border-[#94A3B8]/30 focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 rounded-lg px-4 py-3 text-[#0F172A] placeholder-[#94A3B8] bg-white transition-all duration-150'
                      />
                    ) : (
                      <p className='text-[#0F172A] font-medium'>
                        {client?.email}
                      </p>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-[#0F172A] mb-2 block'>
                      Teléfono *
                    </Label>
                    {isEditing ? (
                      <Input
                        value={client?.telefono || ''}
                        onChange={(e) =>
                          handleInputChange('telefono', e.target.value)
                        }
                        className='border border-[#94A3B8]/30 focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 rounded-lg px-4 py-3 text-[#0F172A] placeholder-[#94A3B8] bg-white transition-all duration-150'
                      />
                    ) : (
                      <p className='text-[#0F172A] font-medium'>
                        {client?.telefono}
                      </p>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-[#0F172A] mb-2 block'>
                      Fecha de nacimiento
                    </Label>
                    {isEditing ? (
                      <Input
                        type='date'
                        value={client?.fechaNacimiento || ''}
                        onChange={(e) =>
                          handleInputChange('fechaNacimiento', e.target.value)
                        }
                        className='border border-[#94A3B8]/30 focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 rounded-lg px-4 py-3 text-[#0F172A] placeholder-[#94A3B8] bg-white transition-all duration-150'
                      />
                    ) : (
                      <p className='text-[#0F172A] font-medium'>
                        {client?.fechaNacimiento
                          ? new Date(client.fechaNacimiento).toLocaleDateString(
                              'es-ES'
                            )
                          : ''}
                      </p>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-[#0F172A] mb-2 block'>
                      DNI/NIE
                    </Label>
                    {isEditing ? (
                      <Input
                        value={client?.dni || ''}
                        onChange={(e) =>
                          handleInputChange('dni', e.target.value)
                        }
                        className='border border-[#94A3B8]/30 focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 rounded-lg px-4 py-3 text-[#0F172A] placeholder-[#94A3B8] bg-white transition-all duration-150'
                      />
                    ) : (
                      <p className='text-[#0F172A] font-medium'>
                        {client?.dni}
                      </p>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-[#0F172A] mb-2 block'>
                      Categoría
                    </Label>
                    {isEditing ? (
                      <Select
                        value={client?.categoriaId || ''}
                        onValueChange={(value) => {
                          const cat = categories.find((c) => c.id === value)
                          if (!client) return
                          setClient((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  categoriaId: value,
                                  categoria: cat?.name || prev.categoria
                                }
                              : prev
                          )
                          setHasChanges(true)
                        }}
                      >
                        <SelectTrigger className='border border-[#94A3B8]/30 focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 rounded-lg px-4 py-3 text-[#0F172A] bg-white transition-all duration-150'>
                          <SelectValue
                            placeholder={
                              categoriesLoading
                                ? 'Cargando...'
                                : 'Seleccionar categoría'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : client?.categoria ? (
                      <Badge
                        variant='secondary'
                        className={getCategoryBadgeColorByName(
                          client.categoria
                        )}
                      >
                        {client.categoria}
                      </Badge>
                    ) : (
                      <span className='text-[#94A3B8]'>Sin categoría</span>
                    )}
                  </div>
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6'>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-[#0F172A] mb-2 block'>
                      Dirección completa
                    </Label>
                    {isEditing ? (
                      <Textarea
                        value={client?.direccion || ''}
                        onChange={(e) =>
                          handleInputChange('direccion', e.target.value)
                        }
                        className='border border-[#94A3B8]/30 focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 rounded-lg px-4 py-3 text-[#0F172A] placeholder-[#94A3B8] bg-white resize-none transition-all duration-150'
                        rows={2}
                      />
                    ) : (
                      <p className='text-[#0F172A] font-medium'>
                        {client?.direccion}
                      </p>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-[#0F172A] mb-2 block'>
                      Contacto de emergencia
                    </Label>
                    {isEditing ? (
                      <Input
                        value={client?.contactoEmergencia || ''}
                        onChange={(e) =>
                          handleInputChange(
                            'contactoEmergencia',
                            e.target.value
                          )
                        }
                        placeholder='Nombre - Teléfono'
                        className='border border-[#94A3B8]/30 focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 rounded-lg px-4 py-3 text-[#0F172A] placeholder-[#94A3B8] bg-white transition-all duration-150'
                      />
                    ) : (
                      <p className='text-[#0F172A] font-medium'>
                        {client?.contactoEmergencia}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='bg-white rounded-xl shadow-sm border-0 p-8 hover:shadow-md transition-shadow duration-200'>
              <CardHeader className='p-0 mb-6'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-xl font-semibold text-[#0F172A] leading-snug flex items-center gap-3'>
                    <MaterialIcon
                      name='inventory'
                      className='text-2xl text-[#1E40AF]'
                    />
                    Paquetes Adquiridos
                  </CardTitle>
                  <Button
                    variant='default'
                    className='bg-[#1E40AF] hover:bg-[#1D4ED8] text-white'
                    onClick={openAddPackageModal}
                  >
                    <span className='material-symbols-outlined text-base mr-1'>
                      add
                    </span>
                    Añadir paquete
                  </Button>
                </div>
              </CardHeader>
              <CardContent className='p-0 space-y-4'>
                {client?.paquetes.map((paquete) => (
                  <div
                    key={paquete.id}
                    className='bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:shadow-sm transition-shadow'
                  >
                    <div className='flex flex-col lg:flex-row lg:items-center gap-6'>
                      {/* Package details on left */}
                      <div className='flex-1 space-y-4'>
                        <div className='flex items-center justify-between'>
                          <div>
                            <h4 className='font-semibold text-[#0F172A] text-lg'>
                              {paquete.nombre}
                            </h4>
                            <p className='text-sm text-[#94A3B8]'>
                              {paquete.instructor &&
                                `Instructor: ${paquete.instructor}`}{' '}
                              • {paquete.tipoClase}
                            </p>
                          </div>
                          <div className='flex items-center gap-2'>
                            <Badge
                              variant='secondary'
                              className={getPackageStatusColor(paquete.estado)}
                            >
                              {paquete.estado}
                            </Badge>
                          </div>
                        </div>

                        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm'>
                          <div>
                            <p className='text-[#94A3B8]'>Comprado</p>
                            <p className='text-[#0F172A] font-medium'>
                              {new Date(paquete.fechaCompra).toLocaleDateString(
                                'es-ES'
                              )}
                            </p>
                          </div>
                          <div>
                            <p className='text-[#94A3B8]'>Vence</p>
                            <p className='text-[#0F172A] font-medium'>
                              {new Date(
                                paquete.fechaVencimiento
                              ).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                          <div>
                            <p className='text-[#94A3B8]'>Plan</p>
                            <p className='text-[#0F172A] font-medium'>
                              {paquete.planPago}
                            </p>
                          </div>
                          <div>
                            <p className='text-[#94A3B8]'>Precio</p>
                            <p className='text-[#0F172A] font-medium'>
                              €{paquete.precio}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Progress bar in center */}
                      <div className='lg:w-48 space-y-2'>
                        <div className='flex justify-between text-sm'>
                          <span className='text-[#94A3B8]'>Progreso</span>
                          <span className='text-[#0F172A] font-medium'>
                            {paquete.clasesUtilizadas} / {paquete.clasesTotales}
                          </span>
                        </div>
                        <Progress
                          value={
                            (paquete.clasesUtilizadas / paquete.clasesTotales) *
                            100
                          }
                          className='h-3'
                        />
                      </div>

                      {/* Payment status and actions on right */}
                      <div className='lg:w-64 space-y-3'>
                        <div className='flex items-center justify-between'>
                          <button
                            onClick={() => handleOpenPaymentModal(paquete.id)}
                            className='flex items-center gap-1 hover:bg-gray-50 rounded-md px-2 py-1 transition-colors'
                          >
                            <MaterialIcon
                              name={getPaymentStatusIcon(paquete.estadoPago)}
                              className={cn(
                                'text-sm',
                                paquete.estadoPago === 'Pagado' &&
                                  'text-green-600',
                                paquete.estadoPago === 'Pendiente' &&
                                  'text-yellow-600',
                                paquete.estadoPago === 'Vencido' &&
                                  'text-red-600'
                              )}
                            />
                            <Badge
                              variant='secondary'
                              className={getPaymentStatusColor(
                                paquete.estadoPago
                              )}
                            >
                              {paquete.estadoPago}
                            </Badge>
                          </button>

                          <div className='flex items-center gap-1'>
                            {paquete.metodoPago && (
                              <MaterialIcon
                                name={getPaymentMethodIcon(paquete.metodoPago)}
                                className='text-sm text-[#94A3B8]'
                              />
                            )}
                            {paquete.autoRenovacion && (
                              <MaterialIcon
                                name='autorenew'
                                className='text-sm text-blue-600'
                                title='Auto-renovación activa'
                              />
                            )}
                          </div>
                        </div>

                        <div className='flex gap-2'>
                          {paquete.estado === 'Activo' &&
                            paquete.clasesUtilizadas <
                              paquete.clasesTotales && (
                              <Button
                                size='sm'
                                onClick={() =>
                                  handleOpenAttendanceModal(paquete.id)
                                }
                                className='bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 h-7 flex-1'
                              >
                                <MaterialIcon
                                  name='check'
                                  className='text-sm mr-1'
                                />
                                Marcar
                              </Button>
                            )}
                          {paquete.estadoPago === 'Pendiente' && (
                            <Button
                              size='sm'
                              onClick={() => handleOpenPaymentModal(paquete.id)}
                              className='bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 h-7 flex-1'
                            >
                              <MaterialIcon
                                name='payment'
                                className='text-sm mr-1'
                              />
                              Pagar
                            </Button>
                          )}
                          <Button
                            size='sm'
                            variant='outline'
                            className='text-xs px-3 py-1 h-7 border-gray-200 hover:border-gray-300 bg-transparent'
                            onClick={() => {
                              if (paquete.receiptUrl) {
                                window.open(paquete.receiptUrl, '_blank')
                              } else {
                                setReceiptUpload({
                                  packageId: paquete.id,
                                  uploading: false
                                })
                                const input = document.getElementById(
                                  receiptInputId
                                ) as HTMLInputElement | null
                                input?.click()
                              }
                            }}
                          >
                            <MaterialIcon
                              name='receipt'
                              className='text-sm mr-1'
                            />
                            {paquete.receiptUrl
                              ? 'Ver factura'
                              : 'Añadir factura'}
                          </Button>
                        </div>

                        {paquete.proximoPago && (
                          <div className='text-xs text-[#94A3B8]'>
                            Próximo pago:{' '}
                            {new Date(paquete.proximoPago).toLocaleDateString(
                              'es-ES'
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Add Package Modal */}
            <Dialog
              open={addPackageModal.isOpen}
              onOpenChange={(open) =>
                setAddPackageModal((prev) => ({ ...prev, isOpen: open }))
              }
            >
              <DialogContent className='max-w-2xl'>
                <DialogHeader>
                  <DialogTitle>Agregar paquete al cliente</DialogTitle>
                  <DialogDescription>
                    Selecciona un producto/paquete para asignar a este cliente.
                  </DialogDescription>
                </DialogHeader>
                <div className='space-y-4 max-h-[60vh] overflow-y-auto'>
                  {addPackageModal.loading ? (
                    <div className='text-[#64748B]'>Cargando productos...</div>
                  ) : addPackageModal.products.length === 0 ? (
                    <div className='text-[#64748B]'>
                      No hay productos disponibles.
                    </div>
                  ) : (
                    <div className='divide-y rounded-lg border'>
                      {addPackageModal.products.map((p) => (
                        <label
                          key={p.id}
                          className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-[#F8FAFC] ${
                            addPackageModal.selectedProductId === p.id
                              ? 'bg-blue-50'
                              : ''
                          }`}
                        >
                          <input
                            type='radio'
                            name='product'
                            className='accent-[#1E40AF]'
                            checked={addPackageModal.selectedProductId === p.id}
                            onChange={() =>
                              setAddPackageModal((prev) => ({
                                ...prev,
                                selectedProductId: p.id
                              }))
                            }
                          />
                          <div className='flex-1'>
                            <div className='flex items-center justify-between'>
                              <div>
                                <p className='font-medium text-[#0F172A]'>
                                  {p.name}
                                </p>
                                <p className='text-sm text-[#64748B] capitalize'>
                                  {(p.product_type || '').replace('_', ' ')}
                                </p>
                              </div>
                              <div className='text-[#0F172A] font-semibold'>
                                €{Number(p.price || 0).toFixed(2)}
                              </div>
                            </div>
                            <div className='text-xs text-[#94A3B8] mt-1'>
                              {p.classes_included != null
                                ? `${p.classes_included} clases incluidas`
                                : 'Clases no especificadas'}
                              {p.duration_days
                                ? ` • ${p.duration_days} días`
                                : ''}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() =>
                      setAddPackageModal({
                        isOpen: false,
                        selectedProductId: '',
                        loading: false,
                        products: []
                      })
                    }
                  >
                    Cancelar
                  </Button>
                  <Button
                    className='bg-[#1E40AF] hover:bg-[#1D4ED8]'
                    disabled={!addPackageModal.selectedProductId}
                    onClick={handleAddPackage}
                  >
                    Añadir
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Card className='bg-white rounded-xl shadow-sm border-0 p-8 hover:shadow-md transition-shadow duration-200'>
              <CardHeader className='p-0 mb-6'>
                <CardTitle className='text-xl font-semibold text-[#0F172A] leading-snug flex items-center gap-3'>
                  <MaterialIcon
                    name='analytics'
                    className='text-2xl text-[#1E40AF]'
                  />
                  Resumen de Actividad
                </CardTitle>
              </CardHeader>
              <CardContent className='p-0'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
                  <div className='bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200'>
                    <div className='flex items-center gap-3 mb-2'>
                      <MaterialIcon
                        name='fitness_center'
                        className='text-2xl text-blue-600'
                      />
                      <span className='text-sm font-medium text-blue-800'>
                        Clases Restantes
                      </span>
                    </div>
                    <p className='text-3xl font-bold text-blue-900'>
                      {getTotalClassesRemaining()}
                    </p>
                  </div>

                  <div className='bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200'>
                    <div className='flex items-center gap-3 mb-2'>
                      <MaterialIcon
                        name='trending_up'
                        className='text-2xl text-green-600'
                      />
                      <span className='text-sm font-medium text-green-800'>
                        Tasa de Asistencia
                      </span>
                    </div>
                    <p className='text-3xl font-bold text-green-900'>
                      {getAttendanceRate()}%
                    </p>
                  </div>

                  <div className='bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200'>
                    <div className='flex items-center gap-3 mb-2'>
                      <MaterialIcon
                        name='star'
                        className='text-2xl text-purple-600'
                      />
                      <span className='text-sm font-medium text-purple-800'>
                        Rating
                      </span>
                    </div>
                    <p className='text-3xl font-bold text-purple-900'>
                      {client?.rating}/5
                    </p>
                  </div>

                  <div className='bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200'>
                    <div className='flex items-center gap-3 mb-2'>
                      <MaterialIcon
                        name='inventory'
                        className='text-2xl text-orange-600'
                      />
                      <span className='text-sm font-medium text-orange-800'>
                        Paquetes Activos
                      </span>
                    </div>
                    <p className='text-3xl font-bold text-orange-900'>
                      {
                        (
                          client?.paquetes.filter(
                            (p) => p.estado === 'Activo'
                          ) || []
                        ).length
                      }
                    </p>
                  </div>
                </div>

                <div className='space-y-4'>
                  <h4 className='font-semibold text-[#0F172A] text-lg'>
                    Actividad Reciente
                  </h4>
                  <div className='space-y-3'>
                    {client?.historialAsistencia
                      .slice(0, 5)
                      .map((asistencia) => (
                        <div
                          key={asistencia.id}
                          className='flex items-center gap-4 p-4 bg-gray-50 rounded-lg'
                        >
                          <MaterialIcon
                            name='check_circle'
                            className='text-green-600 text-xl'
                          />
                          <div className='flex-1'>
                            <p className='font-medium text-[#0F172A]'>
                              {asistencia.paqueteNombre}
                            </p>
                            <p className='text-sm text-[#94A3B8]'>
                              {new Date(asistencia.fecha).toLocaleDateString(
                                'es-ES'
                              )}{' '}
                              • {asistencia.instructor} • {asistencia.tipoClase}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <Dialog
        open={attendanceModal.isOpen}
        onOpenChange={(open) =>
          setAttendanceModal((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-xl font-semibold text-[#0F172A]'>
              Marcar Asistencia
            </DialogTitle>
            <DialogDescription className='text-[#94A3B8]'>
              Registra la asistencia a una clase del paquete seleccionado.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label className='text-sm font-medium text-[#0F172A]'>
                Fecha de la clase
              </Label>
              <Input
                type='date'
                value={attendanceModal.date}
                onChange={(e) =>
                  setAttendanceModal((prev) => ({
                    ...prev,
                    date: e.target.value
                  }))
                }
                className='border border-[#94A3B8]/30 focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 rounded-lg px-4 py-3'
              />
            </div>

            <div className='space-y-2'>
              <Label className='text-sm font-medium text-[#0F172A]'>
                Instructor
              </Label>
              <Select
                value={attendanceModal.instructor}
                onValueChange={(value) =>
                  setAttendanceModal((prev) => ({ ...prev, instructor: value }))
                }
              >
                <SelectTrigger className='border border-[#94A3B8]/30 focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 rounded-lg px-4 py-3'>
                  <SelectValue placeholder='Seleccionar instructor' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ana-garcia'>Ana García</SelectItem>
                  <SelectItem value='carlos-mendez'>Carlos Méndez</SelectItem>
                  <SelectItem value='maria-lopez'>María López</SelectItem>
                  <SelectItem value='david-ruiz'>David Ruiz</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label className='text-sm font-medium text-[#0F172A]'>
                Comentarios (opcional)
              </Label>
              <Textarea
                value={attendanceModal.comments}
                onChange={(e) =>
                  setAttendanceModal((prev) => ({
                    ...prev,
                    comments: e.target.value
                  }))
                }
                placeholder='Notas sobre la clase, progreso del alumno, etc.'
                className='border border-[#94A3B8]/30 focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 rounded-lg px-4 py-3 resize-none'
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className='gap-2'>
            <Button
              variant='outline'
              onClick={() =>
                setAttendanceModal((prev) => ({ ...prev, isOpen: false }))
              }
              className='border border-[#94A3B8]/30 hover:border-[#1E40AF] hover:bg-[#1E40AF]/5 text-[#0F172A]'
            >
              Cancelar
            </Button>
            <Button
              onClick={handleMarkAttendance}
              className='bg-[#1E40AF] hover:bg-[#1D4ED8] text-white'
            >
              <MaterialIcon name='check' className='text-lg mr-2' />
              Marcar Asistencia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={paymentModal.isOpen}
        onOpenChange={(open) =>
          setPaymentModal((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle className='text-xl font-semibold text-[#0F172A]'>
              Gestión de Pagos
            </DialogTitle>
            <DialogDescription className='text-[#94A3B8]'>
              Procesa pagos y gestiona comprobantes para el paquete
              seleccionado.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue='payment' className='w-full'>
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='payment'>Nuevo Pago</TabsTrigger>
              <TabsTrigger value='receipts'>Comprobantes</TabsTrigger>
              <TabsTrigger value='history'>Historial</TabsTrigger>
            </TabsList>

            <TabsContent value='payment' className='space-y-4 mt-6'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label className='text-sm font-medium text-[#0F172A]'>
                    Método de pago
                  </Label>
                  <Select
                    value={paymentModal.metodo}
                    onValueChange={(value) =>
                      setPaymentModal((prev) => ({
                        ...prev,
                        metodo: value as any
                      }))
                    }
                  >
                    <SelectTrigger className='border border-[#94A3B8]/30 focus:border-[#1E40AF]'>
                      <SelectValue placeholder='Seleccionar método' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Efectivo'>
                        <div className='flex items-center gap-2'>
                          <MaterialIcon name='payments' className='text-sm' />
                          Efectivo
                        </div>
                      </SelectItem>
                      <SelectItem value='Transferencia'>
                        <div className='flex items-center gap-2'>
                          <MaterialIcon
                            name='account_balance'
                            className='text-sm'
                          />
                          Transferencia bancaria
                        </div>
                      </SelectItem>
                      <SelectItem value='Tarjeta'>
                        <div className='flex items-center gap-2'>
                          <MaterialIcon
                            name='credit_card'
                            className='text-sm'
                          />
                          Tarjeta de crédito
                        </div>
                      </SelectItem>
                      <SelectItem value='Bizum'>
                        <div className='flex items-center gap-2'>
                          <MaterialIcon name='smartphone' className='text-sm' />
                          Bizum
                        </div>
                      </SelectItem>
                      <SelectItem value='PayPal'>
                        <div className='flex items-center gap-2'>
                          <MaterialIcon
                            name='account_balance_wallet'
                            className='text-sm'
                          />
                          PayPal
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label className='text-sm font-medium text-[#0F172A]'>
                    Cantidad
                  </Label>
                  <Input
                    type='number'
                    value={paymentModal.cantidad}
                    onChange={(e) =>
                      setPaymentModal((prev) => ({
                        ...prev,
                        cantidad: Number(e.target.value)
                      }))
                    }
                    className='border border-[#94A3B8]/30 focus:border-[#1E40AF]'
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label className='text-sm font-medium text-[#0F172A]'>
                  Notas adicionales
                </Label>
                <Textarea
                  value={paymentModal.notas}
                  onChange={(e) =>
                    setPaymentModal((prev) => ({
                      ...prev,
                      notas: e.target.value
                    }))
                  }
                  placeholder='Información adicional sobre el pago...'
                  className='border border-[#94A3B8]/30 focus:border-[#1E40AF] resize-none'
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value='receipts' className='space-y-4 mt-6'>
              <div className='space-y-4'>
                <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
                  <MaterialIcon
                    name='cloud_upload'
                    className='text-4xl text-gray-400 mb-2'
                  />
                  <p className='text-sm text-gray-600 mb-2'>
                    Arrastra y suelta el comprobante aquí
                  </p>
                  <p className='text-xs text-gray-500 mb-4'>o</p>
                  <Button
                    variant='outline'
                    onClick={() =>
                      document.getElementById('file-upload')?.click()
                    }
                  >
                    <MaterialIcon name='attach_file' className='text-sm mr-2' />
                    Seleccionar archivo
                  </Button>
                  <input
                    id='file-upload'
                    type='file'
                    accept='.pdf,.jpg,.jpeg,.png'
                    onChange={handleFileUpload}
                    className='hidden'
                  />
                </div>

                {paymentModal.comprobante && (
                  <div className='bg-gray-50 rounded-lg p-4'>
                    <div className='flex items-center gap-3'>
                      <MaterialIcon
                        name='description'
                        className='text-2xl text-blue-600'
                      />
                      <div>
                        <p className='font-medium text-[#0F172A]'>
                          {paymentModal.comprobante.name}
                        </p>
                        <p className='text-sm text-[#94A3B8]'>
                          {(
                            paymentModal.comprobante.size /
                            1024 /
                            1024
                          ).toFixed(2)}{' '}
                          MB
                        </p>
                      </div>
                      <Button
                        size='sm'
                        variant='ghost'
                        onClick={() =>
                          setPaymentModal((prev) => ({
                            ...prev,
                            comprobante: null
                          }))
                        }
                        className='ml-auto text-red-600 hover:text-red-700'
                      >
                        <MaterialIcon name='delete' className='text-sm' />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value='history' className='space-y-4 mt-6'>
              <div className='space-y-3'>
                {client?.paquetes
                  .find((p) => p.id === paymentModal.packageId)
                  ?.pagosRealizados.map((pago) => (
                    <div key={pago.id} className='bg-gray-50 rounded-lg p-4'>
                      <div className='flex items-center justify-between mb-2'>
                        <div className='flex items-center gap-2'>
                          <MaterialIcon
                            name={getPaymentMethodIcon(pago.metodo)}
                            className='text-sm text-gray-600'
                          />
                          <span className='font-medium text-[#0F172A]'>
                            €{pago.cantidad}
                          </span>
                          <Badge
                            variant='secondary'
                            className={
                              pago.estado === 'Completado'
                                ? 'bg-green-100 text-green-800'
                                : pago.estado === 'Pendiente'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            {pago.estado}
                          </Badge>
                        </div>
                        <div className='flex items-center gap-2'>
                          {pago.verificado && (
                            <MaterialIcon
                              name='verified'
                              className='text-sm text-green-600'
                              title='Verificado'
                            />
                          )}
                          {pago.comprobante && (
                            <Button
                              size='sm'
                              variant='ghost'
                              className='text-xs'
                            >
                              <MaterialIcon
                                name='download'
                                className='text-sm mr-1'
                              />
                              Ver
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className='text-sm text-[#94A3B8]'>
                        {new Date(pago.fecha).toLocaleDateString('es-ES')} •{' '}
                        {pago.metodo}
                      </div>
                    </div>
                  ))}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className='gap-2'>
            <Button
              variant='outline'
              onClick={() =>
                setPaymentModal((prev) => ({ ...prev, isOpen: false }))
              }
              className='border border-[#94A3B8]/30 hover:border-[#1E40AF] hover:bg-[#1E40AF]/5 text-[#0F172A]'
            >
              Cancelar
            </Button>
            <Button
              onClick={handleProcessPayment}
              className='bg-[#1E40AF] hover:bg-[#1D4ED8] text-white'
            >
              <MaterialIcon name='payment' className='text-lg mr-2' />
              Procesar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
