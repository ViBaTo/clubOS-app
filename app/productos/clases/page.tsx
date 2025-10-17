"use client"
import { Sidebar } from "@/src/components/layout/sidebar"
import { Navbar } from "@/src/components/layout/navbar"
import { ClassCard } from "@/src/components/products/class-card"
import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/src/lib/supabaseClient"

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
                <select className="border border-[#94A3B8]/30 focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 rounded-lg px-4 py-3 text-[#0F172A] bg-white transition-all duration-150">
                  <option>Todos los niveles</option>
                  <option>Principiante</option>
                  <option>Intermedio</option>
                  <option>Avanzado</option>
                </select>
                <select className="border border-[#94A3B8]/30 focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 rounded-lg px-4 py-3 text-[#0F172A] bg-white transition-all duration-150">
                  <option>Tipo de clase</option>
                  <option>Clase particular</option>
                  <option>Clase grupal</option>
                  <option>Clínic</option>
                </select>
                <select className="border border-[#94A3B8]/30 focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 rounded-lg px-4 py-3 text-[#0F172A] bg-white transition-all duration-150">
                  <option>Disponibilidad</option>
                  <option>Disponible</option>
                  <option>Completa</option>
                  <option>Cancelada</option>
                </select>
              </div>
            </div>

            {/* Classes grid */}
            {error && <div className="text-sm text-red-600">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((classItem) => (
                <ClassCard key={classItem.id} classItem={classItem as any} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
