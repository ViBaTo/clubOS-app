"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getSupabaseClient } from "@/app/lib/supabaseClient"

type ProductType = "academy" | "individual_class"

export interface ProductRecord {
  id?: string
  name: string
  description?: string | null
  product_type: ProductType
  price: number
  currency?: string
  duration_days?: number | null
  classes_included?: number | null
  is_active?: boolean
  display_order?: number
  configuration?: any
}

interface ProductEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: ProductType
  product?: ProductRecord | null
  mode?: "create" | "edit" | "view"
  onSaved?: () => void
  onDeleted?: () => void
  productId?: string | null
}

export function ProductEditorModal({ open, onOpenChange, type, product, productId, mode = "view", onSaved, onDeleted }: ProductEditorModalProps) {
  const [modeState, setModeState] = useState<"create"|"edit"|"view">(mode)
  const isCreate = modeState === "create"
  const isView = modeState === "view"
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ProductRecord>({
    name: "",
    product_type: type,
    price: 0,
    description: "",
    duration_days: type === "academy" ? 30 : null,
    classes_included: null,
    configuration: {}
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [days, setDays] = useState<string[]>([])
  const [timeFrom, setTimeFrom] = useState<string>("")
  const [timeTo, setTimeTo] = useState<string>("")

  const updateCfg = (k: string, v: any) => setForm((p) => ({ ...p, configuration: { ...(p.configuration || {}), [k]: v } }))

  useEffect(() => { setModeState(mode) }, [mode, open])

  useEffect(() => {
    if (product) setForm({ ...product })
    else setForm({
      name: "",
      product_type: type,
      price: 0,
      description: "",
      duration_days: type === "academy" ? 30 : null,
      classes_included: null,
      configuration: {}
    })
  }, [product, type, open])

  // If only an id is provided, fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId || product) return
      const supabase = getSupabaseClient()
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`
      const res = await fetch(`/api/products/${productId}`, { headers })
      const j = await res.json()
      if (res.ok && j.product) setForm({ ...j.product })
    }
    if (open) fetchProduct()
  }, [productId, product, open])

  // Sync schedule fields from configuration
  useEffect(() => {
    const cfg = form.configuration || {}
    let newDays = Array.isArray(cfg.days) ? cfg.days : []
    let newTimeFrom = typeof cfg.time_from === 'string' ? cfg.time_from : ""
    let newTimeTo = typeof cfg.time_to === 'string' ? cfg.time_to : ""
    
    // If structured fields are empty but schedule string exists, try to parse it
    if (cfg.schedule && (!newDays.length || !newTimeFrom || !newTimeTo)) {
      const scheduleStr = String(cfg.schedule)
      // Try to extract time range (e.g., "19:00-20:30")
      const timeMatch = scheduleStr.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/)
      if (timeMatch) {
        newTimeFrom = timeMatch[1]
        newTimeTo = timeMatch[2]
      }
      // Try to extract days - split on common separators and match day names
      const dayMap: Record<string, string> = {
        // Full names
        'lunes': 'M', 'martes': 'T', 'miércoles': 'W', 'miercoles': 'W',
        'jueves': 'Th', 'viernes': 'F', 'sábado': 'S', 'sabado': 'S', 'domingo': 'Su',
        // Abbreviations
        'lun': 'M', 'mar': 'T', 'mié': 'W', 'mie': 'W',
        'jue': 'Th', 'vie': 'F', 'sáb': 'S', 'sab': 'S', 'dom': 'Su'
      }
      // Split by common separators: /, ,, y, and spaces
      const parts = scheduleStr.toLowerCase().split(/[\/,\s]+/).map(p => p.trim()).filter(p => p && p !== 'y')
      const extractedDays: string[] = []
      parts.forEach(part => {
        if (dayMap[part]) {
          const abbr = dayMap[part]
          if (!extractedDays.includes(abbr)) extractedDays.push(abbr)
        }
      })
      if (extractedDays.length > 0) newDays = extractedDays
    }
    
    setDays(newDays)
    setTimeFrom(newTimeFrom)
    setTimeTo(newTimeTo)
  }, [form.configuration, open])

  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = getSupabaseClient()
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`
      // Upload image if file selected
      let finalConfig = { ...(form.configuration || {}) }
      // Include schedule fields for academy
      if (type === 'academy') {
        finalConfig.days = days
        finalConfig.time_from = timeFrom
        finalConfig.time_to = timeTo
        if (!finalConfig.schedule && days?.length && timeFrom && timeTo) {
          finalConfig.schedule = `${days.join(', ')} ${timeFrom}-${timeTo}`
        }
      }
      if (imageFile) {
        try {
          // Try to prefix with user's organization id if accessible
          let pathPrefix = 'org'
          try {
            const orgRes = await supabase.from('organization_users')
              .select('organization_id, is_primary, created_at')
              .order('is_primary', { ascending: false })
              .order('created_at', { ascending: true })
              .limit(1)
              .maybeSingle()
            const orgId = orgRes.data?.organization_id
            if (orgId) pathPrefix = `org/${orgId}`
          } catch (_) { /* ignore */ }
          const path = `${pathPrefix}/${Date.now()}-${imageFile.name}`
          const up = await supabase.storage.from('product-images').upload(path, imageFile, { upsert: true })
          if (up.error) throw up.error
          const { data } = supabase.storage.from('product-images').getPublicUrl(path)
          if (data?.publicUrl) finalConfig.image = data.publicUrl
        } catch (e: any) {
          // If the bucket doesn't exist yet, proceed without blocking product creation
          console.warn('Image upload skipped:', e?.message || e)
        }
      }
      const payload: ProductRecord = {
        name: form.name,
        description: form.description ?? null,
        product_type: type,
        price: form.price,
        currency: 'EUR',
        duration_days: type === 'academy' ? (form.duration_days ?? null) : null,
        classes_included: type === 'academy' ? null : (form.classes_included ?? null),
        is_active: true,
        display_order: form.display_order ?? 0,
        configuration: finalConfig,
      }
      const targetId = (form as any)?.id || productId || product?.id
      const res = await fetch(isCreate ? '/api/products' : `/api/products/${targetId}`, {
        method: isCreate ? 'POST' : 'PATCH',
        headers,
        body: JSON.stringify(payload)
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j.error || 'Error al guardar')
      onSaved?.()
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!product?.id) return
    const supabase = getSupabaseClient()
    const session = (await supabase.auth.getSession()).data.session
    const token = session?.access_token
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE', headers })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(j.error || 'Error al eliminar')
    onDeleted?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isCreate ? 'Crear producto' : isView ? 'Detalles del producto' : 'Editar producto'}</DialogTitle>
          {!isCreate && isView && (
            <div className="mt-2">
              <Button variant="outline" onClick={() => setModeState('edit')}>Editar</Button>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={isView} />
            </div>
            <div className="space-y-2">
              <Label>Precio (€)</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} disabled={isView} />
            </div>
          </div>

          {type === 'academy' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duración (días)</Label>
                <Input type="number" value={(form.duration_days ?? '') as any} onChange={(e) => setForm({ ...form, duration_days: e.target.value ? Number(e.target.value) : null })} disabled={isView} />
              </div>
              <div className="space-y-2">
                <Label>Nivel</Label>
                <Select value={form.configuration?.level ?? ''} onValueChange={(v) => updateCfg('level', v)} disabled={isView}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar nivel" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Principiante">Principiante</SelectItem>
                    <SelectItem value="Intermedio">Intermedio</SelectItem>
                    <SelectItem value="Avanzado">Avanzado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Instructor</Label>
                <Input value={form.configuration?.instructor ?? ''} onChange={(e) => updateCfg('instructor', e.target.value)} disabled={isView} />
              </div>
              <div className="space-y-2">
                <Label>Horario</Label>
                <div className={`grid grid-cols-7 gap-1 ${isView ? 'pointer-events-none opacity-80' : ''}`}>
                  {['M','T','W','Th','F','S','Su'].map((d) => (
                    <button type="button" key={d} className={`text-xs px-2 py-1 rounded border ${days.includes(d) ? 'bg-[#1E40AF] text-white border-[#1E40AF]' : 'border-gray-300'}`} onClick={() => setDays((prev) => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}>
                      {d}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label>Desde</Label>
                    <Input type="time" value={timeFrom} onChange={(e) => setTimeFrom(e.target.value)} disabled={isView} />
                  </div>
                  <div className="space-y-1">
                    <Label>Hasta</Label>
                    <Input type="time" value={timeTo} onChange={(e) => setTimeTo(e.target.value)} disabled={isView} />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Plazas disponibles</Label>
                <Input type="number" value={(form.configuration?.availableSpots ?? '') as any} onChange={(e) => updateCfg('availableSpots', e.target.value ? Number(e.target.value) : null)} disabled={isView} />
              </div>
              <div className="space-y-2">
                <Label>Plazas totales</Label>
                <Input type="number" value={(form.configuration?.totalSpots ?? '') as any} onChange={(e) => updateCfg('totalSpots', e.target.value ? Number(e.target.value) : null)} disabled={isView} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Imagen del producto</Label>
                {form.configuration?.image && (
                  <div className="mb-2">
                    <img src={form.configuration.image} alt="Preview" className="h-32 w-auto object-cover rounded border" />
                  </div>
                )}
                {!isView && (
                  <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} disabled={isView} />
                )}
                {isView && form.configuration?.image && (
                  <p className="text-sm text-[#64748B]">Imagen cargada</p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="date" value={form.configuration?.date ?? ''} onChange={(e) => updateCfg('date', e.target.value)} disabled={isView} />
              </div>
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input type="time" value={form.configuration?.time ?? ''} onChange={(e) => updateCfg('time', e.target.value)} disabled={isView} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.configuration?.type ?? ''} onValueChange={(v) => updateCfg('type', v)} disabled={isView}>
                  <SelectTrigger><SelectValue placeholder="Tipo de clase" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Clase particular">Clase particular</SelectItem>
                    <SelectItem value="Clase grupal">Clase grupal</SelectItem>
                    <SelectItem value="Clínic">Clínic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Instructor</Label>
                <Input value={form.configuration?.instructor ?? ''} onChange={(e) => updateCfg('instructor', e.target.value)} disabled={isView} />
              </div>
              <div className="space-y-2">
                <Label>Pista</Label>
                <Input value={form.configuration?.court ?? ''} onChange={(e) => updateCfg('court', e.target.value)} disabled={isView} />
              </div>
              <div className="space-y-2">
                <Label>Nivel</Label>
                <Select value={form.configuration?.level ?? ''} onValueChange={(v) => updateCfg('level', v)} disabled={isView}>
                  <SelectTrigger><SelectValue placeholder="Nivel" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Principiante">Principiante</SelectItem>
                    <SelectItem value="Intermedio">Intermedio</SelectItem>
                    <SelectItem value="Avanzado">Avanzado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Disponibles</Label>
                <Input type="number" value={form.configuration?.availableSpots ?? 0} onChange={(e) => updateCfg('availableSpots', Number(e.target.value))} disabled={isView} />
              </div>
              <div className="space-y-2">
                <Label>Totales</Label>
                <Input type="number" value={form.configuration?.totalSpots ?? 0} onChange={(e) => updateCfg('totalSpots', Number(e.target.value))} disabled={isView} />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.configuration?.status ?? ''} onValueChange={(v) => updateCfg('status', v)} disabled={isView}>
                  <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Disponible">Disponible</SelectItem>
                    <SelectItem value="Completa">Completa</SelectItem>
                    <SelectItem value="Cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Descripción (opcional)</Label>
            <Textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} disabled={isView} />
          </div>
        </div>

        <DialogFooter>
          {!isView && (
            <Button onClick={handleSave} disabled={saving}>{isCreate ? 'Crear' : 'Guardar'}</Button>
          )}
          {(!isCreate && !isView) && (
            <Button variant="outline" onClick={handleDelete}>Eliminar</Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


