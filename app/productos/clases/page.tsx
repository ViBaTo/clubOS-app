"use client"
import { Sidebar } from "@/src/components/layout/sidebar"
import { Navbar } from "@/src/components/layout/navbar"
import { ClassCard } from "@/src/components/products/class-card"
import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/src/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProductEditorModal } from "@/src/components/products/product-editor-modal"
import { AssignClientModal } from "@/src/components/products/assign-client-modal"

interface ClassItem {
  id: string
  date: string
  time: string
  type: string
  instructor: string
  instructorAvatar: string
  court: string
  level: string
  price: number
  availableSpots: number
  totalSpots: number
  status: string
}

export default function ClasesPage() {
  const [items, setItems] = useState<ClassItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<{ level: string|'all'; type: string|'all'; availability: string|'all' }>({ level: 'all', type: 'all', availability: 'all' })
  const [editor, setEditor] = useState<{ open: boolean; mode: 'create'|'edit'|'view'; productId?: string|null; initial?: any }>({ open: false, mode: 'view', productId: null })
  const [assignModal, setAssignModal] = useState<{ open: boolean; productId: string; productName: string }>({ open: false, productId: '', productName: '' })

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = getSupabaseClient()
        const session = (await supabase.auth.getSession()).data.session
        const token = session?.access_token
        const res = await fetch('/api/products?type=individual_class', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Error loading classes')
        const list: ClassItem[] = (json.products as any[]).map((p) => ({
          id: p.id,
          date: p.configuration?.date ?? new Date().toISOString().slice(0,10),
          time: p.configuration?.time ?? '09:00',
          type: p.configuration?.type ?? 'Clase particular',
          instructor: p.configuration?.instructor ?? 'Instructor',
          instructorAvatar: p.configuration?.instructorAvatar ?? '/placeholder.svg',
          court: p.configuration?.court ?? 'Pista 1',
          level: p.configuration?.level ?? 'Intermedio',
          price: Number(p.price) || 0,
          availableSpots: p.configuration?.availableSpots ?? 0,
          totalSpots: p.configuration?.totalSpots ?? 0,
          status: p.configuration?.status ?? 'Disponible',
        }))
        setItems(list)
      } catch (e: any) {
        setError(e.message)
      }
    }
    load()
  }, [])

  const filtered = items.filter(i => {
    const matchesLevel = filter.level === 'all' || i.level === filter.level
    const matchesType = filter.type === 'all' || i.type === filter.type
    const matchesAvailability = filter.availability === 'all' || (filter.availability === 'available' ? i.availableSpots > 0 : i.availableSpots === 0)
    return matchesLevel && matchesType && matchesAvailability
  })
  return (
    <div className="flex h-screen bg-[#F1F5F9]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-3xl text-[#1E40AF]">event</span>
                  <h1 className="text-5xl font-bold text-[#0F172A] leading-tight tracking-tight text-balance">
                    Clases de Pádel
                  </h1>
                </div>
                <p className="text-base font-normal text-[#64748B] leading-relaxed">
                  Reserva clases individuales y grupales con nuestros instructores
                </p>
              </div>
            </div>

            {/* Filter options */}
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex flex-wrap gap-4">
                <Select value={filter.level} onValueChange={(v) => setFilter((p) => ({ ...p, level: v as any }))}>
                  <SelectTrigger className="w-56"><SelectValue placeholder="Todos los niveles" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los niveles</SelectItem>
                    <SelectItem value="Principiante">Principiante</SelectItem>
                    <SelectItem value="Intermedio">Intermedio</SelectItem>
                    <SelectItem value="Avanzado">Avanzado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filter.type} onValueChange={(v) => setFilter((p) => ({ ...p, type: v as any }))}>
                  <SelectTrigger className="w-56"><SelectValue placeholder="Tipo de clase" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="Clase particular">Clase particular</SelectItem>
                    <SelectItem value="Clase grupal">Clase grupal</SelectItem>
                    <SelectItem value="Clínic">Clínic</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filter.availability} onValueChange={(v) => setFilter((p) => ({ ...p, availability: v as any }))}>
                  <SelectTrigger className="w-56"><SelectValue placeholder="Disponibilidad" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="available">Disponible</SelectItem>
                    <SelectItem value="full">Completa</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => setEditor({ open: true, mode: 'create', productId: null, initial: null })}>Añadir clase</Button>
              </div>
            </div>

            {/* Classes grid */}
            {error && <div className="text-sm text-red-600">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((classItem) => (
                <ClassCard 
                  key={classItem.id} 
                  classItem={classItem as any} 
                  onView={(i) => setEditor({ open: true, mode: 'view', productId: String(i.id), initial: null })}
                  onReserve={(i) => setAssignModal({ open: true, productId: String(i.id), productName: i.type })}
                />
              ))}
            </div>

            <ProductEditorModal
              open={editor.open}
              onOpenChange={(o) => setEditor((e) => ({ ...e, open: o }))}
              type="individual_class"
              mode={editor.mode}
              product={null as any}
              productId={editor.productId || null}
              onSaved={() => window.location.reload()}
              onDeleted={() => window.location.reload()}
            />

            <AssignClientModal
              open={assignModal.open}
              onOpenChange={(o) => setAssignModal((prev) => ({ ...prev, open: o }))}
              productId={assignModal.productId}
              productName={assignModal.productName}
              onAssigned={() => window.location.reload()}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
