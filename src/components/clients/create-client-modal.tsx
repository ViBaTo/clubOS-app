"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Loader2, Upload, CheckCircle2 } from "lucide-react"

const MaterialIcon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={cn("material-symbols-outlined", className)}>{name}</span>
)

interface CreateClientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface AcademyPackage {
  id: string
  name: string
  price: number
  duration: string
  description: string
}

interface ClassPackage {
  id: string
  name: string
  price: number
  classes: number
  expiry: string
}

const academyPackages: AcademyPackage[] = [
  { id: "esc-ini", name: "Escuela Iniciación", price: 80, duration: "Mensual", description: "Nivel básico" },
  { id: "perf", name: "Perfeccionamiento", price: 100, duration: "Mensual", description: "Nivel intermedio" },
  { id: "comp", name: "Competición", price: 120, duration: "Mensual", description: "Nivel avanzado" },
]

const classPackages: ClassPackage[] = [
  { id: "pack-4", name: "Paquete 4 Clases", price: 60, classes: 4, expiry: "30 días" },
  { id: "pack-8", name: "Paquete 8 Clases", price: 110, classes: 8, expiry: "60 días" },
  { id: "pack-10", name: "Paquete 10 Clases", price: 130, classes: 10, expiry: "60 días" },
  { id: "bono", name: "Bono Mensual", price: 200, classes: 999, expiry: "30 días" },
]

const categories = ["Principiante", "Intermedio", "Avanzado", "Competición", "Veterano"]
const paymentMethods = ["Efectivo", "Transferencia", "Tarjeta", "Bizum"]

export function CreateClientModal({ open, onOpenChange, onSuccess }: CreateClientModalProps) {
  const [serviceType, setServiceType] = useState<"academia" | "clases">("academia")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    documento: "",
    telefono: "+34 ",
    email: "",
    categoria: "",
    packageId: "",
    paymentMethod: "",
    isPaid: false,
  })

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es requerido"
    if (!formData.documento.trim()) newErrors.documento = "El documento es requerido"
    if (!formData.telefono || formData.telefono === "+34 ") newErrors.telefono = "El teléfono es requerido"
    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido"
    }
    if (!formData.categoria) newErrors.categoria = "La categoría es requerida"
    if (!formData.packageId) newErrors.packageId = "Debe seleccionar un paquete"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    try {
      // attach bearer token
      const { getSupabaseClient } = await import("@/src/lib/supabaseClient")
      const supabase = getSupabaseClient()
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token

      const payload = {
        full_name: formData.nombre,
        email: formData.email,
        phone: formData.telefono,
        document_id: formData.documento,
        categoria_id: null as string | null, // map UI category if/when you connect categories
        status: 'active'
      }

      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload)
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'No se pudo crear el cliente')

      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        onOpenChange(false)
        resetForm()
        onSuccess?.()
      }, 1200)
    } catch (err: any) {
      // Basic inline error display using existing errors map
      setErrors((prev) => ({ ...prev, api: err.message }))
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: "",
      documento: "",
      telefono: "+34 ",
      email: "",
      categoria: "",
      packageId: "",
      paymentMethod: "",
      isPaid: false,
    })
    setErrors({})
    setReceiptFile(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0])
    }
  }

  const getCategoryBadgeColor = (categoria: string) => {
    switch (categoria) {
      case "Principiante":
        return "bg-blue-100 text-blue-800"
      case "Intermedio":
        return "bg-yellow-100 text-yellow-800"
      case "Avanzado":
        return "bg-orange-100 text-orange-800"
      case "Competición":
        return "bg-red-100 text-red-800"
      case "Veterano":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const selectedPackage =
    serviceType === "academia"
      ? academyPackages.find((p) => p.id === formData.packageId)
      : classPackages.find((p) => p.id === formData.packageId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-16 w-16 text-green-600 mb-4 animate-in zoom-in duration-300" />
            <h3 className="text-2xl font-semibold text-[#0F172A] mb-2">¡Cliente creado exitosamente!</h3>
            <p className="text-base text-[#64748B]">Redirigiendo...</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-3xl font-semibold text-[#0F172A]">Crear Nuevo Cliente</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-[#0F172A]">Información Básica</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">
                      Nombre completo <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Juan Pérez García"
                      className={errors.nombre ? "border-red-500" : ""}
                    />
                    {errors.nombre && <p className="text-sm text-red-600">{errors.nombre}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="documento">
                      Documento ID <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="documento"
                      value={formData.documento}
                      onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                      placeholder="12345678A"
                      className={errors.documento ? "border-red-500" : ""}
                    />
                    {errors.documento && <p className="text-sm text-red-600">{errors.documento}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono">
                      Teléfono <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      placeholder="+34 612 345 678"
                      className={errors.telefono ? "border-red-500" : ""}
                    />
                    {errors.telefono && <p className="text-sm text-red-600">{errors.telefono}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="juan@ejemplo.com"
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoria">
                    Categoría <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger className={errors.categoria ? "border-red-500" : ""}>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={getCategoryBadgeColor(cat)}>
                              {cat}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoria && <p className="text-sm text-red-600">{errors.categoria}</p>}
                </div>
              </div>

              {/* Service Type Selector */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-[#0F172A]">Tipo de Servicio</h3>
                <div className="flex gap-2 p-1 bg-[#F1F5F9] rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setServiceType("academia")
                      setFormData({ ...formData, packageId: "" })
                    }}
                    className={cn(
                      "flex-1 py-2 px-4 rounded-md font-medium transition-all duration-150",
                      serviceType === "academia"
                        ? "bg-white text-[#1E40AF] shadow-sm"
                        : "text-[#64748B] hover:text-[#0F172A]",
                    )}
                  >
                    Academia
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setServiceType("clases")
                      setFormData({ ...formData, packageId: "" })
                    }}
                    className={cn(
                      "flex-1 py-2 px-4 rounded-md font-medium transition-all duration-150",
                      serviceType === "clases"
                        ? "bg-white text-[#1E40AF] shadow-sm"
                        : "text-[#64748B] hover:text-[#0F172A]",
                    )}
                  >
                    Clases
                  </button>
                </div>
              </div>

              {/* Package Selection */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-[#0F172A]">Selección de Paquete</h3>
                <div className="space-y-2">
                  <Label htmlFor="package">
                    Paquete <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={formData.packageId}
                    onValueChange={(value) => setFormData({ ...formData, packageId: value })}
                  >
                    <SelectTrigger className={errors.packageId ? "border-red-500" : ""}>
                      <SelectValue placeholder="Seleccionar paquete" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceType === "academia"
                        ? academyPackages.map((pkg) => (
                            <SelectItem key={pkg.id} value={pkg.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{pkg.name}</span>
                                <span className="text-sm text-[#64748B]">
                                  €{pkg.price}/{pkg.duration} - {pkg.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        : classPackages.map((pkg) => (
                            <SelectItem key={pkg.id} value={pkg.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{pkg.name}</span>
                                <span className="text-sm text-[#64748B]">
                                  €{pkg.price} - {pkg.classes === 999 ? "Ilimitadas" : `${pkg.classes} clases`} - Válido{" "}
                                  {pkg.expiry}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                  {errors.packageId && <p className="text-sm text-red-600">{errors.packageId}</p>}

                  {selectedPackage && (
                    <div className="mt-2 p-4 bg-[#F1F5F9] rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-[#0F172A]">{selectedPackage.name}</p>
                          <p className="text-sm text-[#64748B]">
                            {serviceType === "academia"
                              ? (selectedPackage as AcademyPackage).description
                              : `${(selectedPackage as ClassPackage).classes === 999 ? "Ilimitadas" : (selectedPackage as ClassPackage).classes} clases`}
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-[#1E40AF]">€{selectedPackage.price}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Information */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-[#0F172A]">Información de Pago (Opcional)</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Método de pago</Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar método" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentStatus">Estado de pago</Label>
                    <div className="flex items-center gap-2 h-10">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isPaid: !formData.isPaid })}
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                          formData.isPaid ? "bg-[#059669]" : "bg-[#94A3B8]",
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                            formData.isPaid ? "translate-x-6" : "translate-x-1",
                          )}
                        />
                      </button>
                      <span className="text-sm text-[#64748B]">{formData.isPaid ? "Pagado" : "Pendiente"}</span>
                    </div>
                  </div>
                </div>

                {formData.isPaid && (
                  <div className="space-y-2">
                    <Label htmlFor="receipt">Subir comprobante</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="receipt"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("receipt")?.click()}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {receiptFile ? receiptFile.name : "Seleccionar archivo"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false)
                    resetForm()
                  }}
                  disabled={isLoading}
                  className="border border-[#1E40AF] text-[#1E40AF] hover:bg-[#1E40AF] hover:text-white font-medium px-6 py-3 rounded-lg transition-all duration-150"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#1E40AF] hover:bg-[#1D4ED8] active:bg-[#1E3A8A] text-white font-medium px-6 py-3 rounded-lg transition-all duration-150 shadow-sm hover:shadow-md"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Crear Cliente"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
