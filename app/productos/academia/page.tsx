"use client"
import { Sidebar } from "@/app/components/layout/sidebar"
import { Navbar } from "@/app/components/layout/navbar"
import { AcademyCard } from "@/app/components/products/academy-card"
import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/app/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProductEditorModal } from "@/app/components/products/product-editor-modal"

interface AcademyProgram {
  id: string
  name: string
  instructor?: string
  instructorAvatar?: string
  schedule?: string
  level?: string
  duration?: string
  price: number
  availableSpots?: number
  totalSpots?: number
  image?: string
}

export default function AcademiaPage() {
  const [programs, setPrograms] = useState<AcademyProgram[]>([])
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<{ level: string | 'all'; instructor: string | 'all'; availability: string | 'all' }>({ level: 'all', instructor: 'all', availability: 'all' })
  const [editor, setEditor] = useState<{ open: boolean; mode: 'create'|'edit'|'view'; productId?: string|null; initial?: any }>({ open: false, mode: 'view', productId: null })

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = getSupabaseClient()
        const session = (await supabase.auth.getSession()).data.session
        const token = session?.access_token
        const res = await fetch('/api/products?type=academy', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Error loading products')
        const list: AcademyProgram[] = (json.products as any[]).map((p) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price) || 0,
          duration: p.duration_days ? `${p.duration_days} días` : 'Mensual',
          level: p.configuration?.level ?? 'Intermedio',
          instructor: p.configuration?.instructor ?? 'Instructor',
          instructorAvatar: p.configuration?.instructorAvatar ?? '/placeholder.svg',
          schedule: p.configuration?.schedule ?? '',
          availableSpots: p.configuration?.availableSpots ?? 0,
          totalSpots: p.configuration?.totalSpots ?? 0,
          image: p.configuration?.image ?? '/placeholder.svg',
        }))
        setPrograms(list)
      } catch (e: any) {
        setError(e.message)
      }
    }
    load()
  }, [])

  const filtered = programs.filter(p => {
    const matchesLevel = filter.level === 'all' || (p.level === filter.level)
    const matchesInstructor = filter.instructor === 'all' || (p.instructor === filter.instructor)
    const matchesAvailability = filter.availability === 'all' || (
      filter.availability === 'available' ? (Number(p.availableSpots || 0) > 0) : (Number(p.availableSpots || 0) === 0)
    )
    return matchesLevel && matchesInstructor && matchesAvailability
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
                  <span className="material-symbols-outlined text-3xl text-[#1E40AF]">school</span>
                  <h1 className="text-5xl font-bold text-[#0F172A] leading-tight tracking-tight text-balance">
                    Academia de Pádel
                  </h1>
                </div>
                <p className="text-base font-normal text-[#64748B] leading-relaxed">
                  Programas de entrenamiento estructurados para todos los niveles
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
                <Select value={filter.instructor} onValueChange={(v) => setFilter((p) => ({ ...p, instructor: v as any }))}>
                  <SelectTrigger className="w-56"><SelectValue placeholder="Todos los instructores" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los instructores</SelectItem>
                    {Array.from(new Set(programs.map(p => p.instructor || 'Instructor'))).map((i) => (
                      <SelectItem key={String(i)} value={String(i)}>{String(i)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filter.availability} onValueChange={(v) => setFilter((p) => ({ ...p, availability: v as any }))}>
                  <SelectTrigger className="w-56"><SelectValue placeholder="Disponibilidad" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="available">Plazas disponibles</SelectItem>
                    <SelectItem value="full">Completas</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => setEditor({ open: true, mode: 'create', productId: null, initial: null })}>Añadir producto</Button>
              </div>
            </div>

            {/* Academy programs grid */}
            {error && <div className="text-sm text-red-600">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((program) => (
                <AcademyCard key={program.id} program={program as any} onView={(p) => setEditor({ open: true, mode: 'view', productId: String(p.id), initial: null })} />
              ))}
            </div>

            <ProductEditorModal
              open={editor.open}
              onOpenChange={(o) => setEditor((e) => ({ ...e, open: o }))}
              type="academy"
              mode={editor.mode}
              product={null as any}
              productId={editor.productId || null}
              onSaved={() => window.location.reload()}
              onDeleted={() => window.location.reload()}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
