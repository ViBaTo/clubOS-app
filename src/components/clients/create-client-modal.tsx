"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

const MaterialIcon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={cn("material-symbols-outlined", className)}>{name}</span>
)

interface CreateClientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Package data
const academiaPackages = [
  { id: "aca-1", name: "Escuela Iniciación", price: 80, duration: "3 meses", description: "Nivel principiante" },
  {
    id: "aca-2",
    name: "Perfeccionamiento Técnico",
    price: 100,
    duration: "4 meses",
    description: "Nivel intermedio",
  },
  { id: "aca-3", name: "Competición Avanzada", price: 120, duration: "Anual", description: "Nivel avanzado" },
]

const clasesPackages = [
  { id: "cls-1", name: "Paquete 4 Clases", price: 60, classes: 4, expiry: "1 mes" },
  { id: "cls-2", name: "Paquete 8 Clases", price: 110, classes: 8, expiry: "2 meses" },
  { id: "cls-3", name: "Paquete 10 Clases", price: 130, classes: 10, expiry: "2 meses" },
  { id: "cls-4", name: "Bono Mensual", price: 200, classes: "Ilimitadas", expiry: "1 mes" },
]

const categorias = ["Principiante", "Intermedio", "Avanzado", "Competición", "Veterano"]

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

export function CreateClientModal({ open, onOpenChange }: CreateClientModalProps) {
  const [serviceType, setServiceType] = useState<"academia" | "clases">("academia")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isPaid, setIsPaid] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    documento: "",
    telefono: "",
    email: "",
    categoria: "",
    package: "",
    metodoPago: "",
  })

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es requerido"
    if (!formData.documento.trim()) newErrors.documento = "El documento es requerido"
    if (!formData.telefono.trim()) newErrors.telefono = "El teléfono es requerido"
    if (!formData.email.trim()) newErrors.email = "El email es requerido"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Email inválido"
    if (!formData.categoria) newErrors.categoria = "La categoría es requerida"
    if (!formData.package) newErrors.package = "Debe seleccionar un paquete"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsLoading(false)
    setShowSuccess(true)

    // Reset form and close after success animation
    setTimeout(() => {
      setShowSuccess(false)
      setFormData({
        nombre: "",
        documento: "",
        telefono: "",
        email: "",
        categoria: "",
        package: "",
        metodoPago: "",
      })
      setServiceType("academia")
      setIsPaid(false)
      setErrors({})
      onOpenChange(false)
    }, 2000)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const currentPackages = serviceType === "academia" ? academiaPackages : clasesPackages

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-16 w-16 text-green-600 mb-4 animate-in zoom-in duration-300" />
            <h3 className="text-2xl font-semibold text-[#0F172A] mb-2">¡Cliente creado exitosamente!</h3>
            <p className="text-base text-[#64748B]">El cliente ha sido agregado al directorio</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-3xl font-semibold text-[#0F172A]">Crear Nuevo Cliente</DialogTitle>
              <DialogDescription className="text-base text-[#64748B]">
                Complete la información del cliente y seleccione el paquete de servicios
              </DialogDescription>
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
                      onChange={(e) => handleInputChange("nombre", e.target.value)}
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
                      onChange={(e) => handleInputChange("documento", e.target.value)}
                      placeholder="DNI/NIE/Pasaporte"
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
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => handleInputChange("telefono", e.target.value)}
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
                      onChange={(e) => handleInputChange("email", e.target.value)}
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
                  <Select value={formData.categoria} onValueChange={(value) => handleInputChange("categoria", value)}>
                    <SelectTrigger className={errors.categoria ? "border-red-500" : ""}>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((cat) => (
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
                      setFormData((prev) => ({ ...prev, package: "" }))
                    }}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-md font-medium transition-all duration-150",
                      serviceType === "academia"
                        ? "bg-white text-[#1E40AF] shadow-sm"
                        : "text-[#64748B] hover:text-[#0F172A]",
                    )}
                  >
                    <MaterialIcon name="school" className="text-lg mr-2 inline" />
                    Academia
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setServiceType("clases")
                      setFormData((prev) => ({ ...prev, package: "" }))
                    }}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-md font-medium transition-all duration-150",
                      serviceType === "clases"
                        ? "bg-white text-[#1E40AF] shadow-sm"
                        : "text-[#64748B] hover:text-[#0F172A]",
                    )}
                  >
                    <MaterialIcon name="event" className="text-lg mr-2 inline" />
                    Clases
                  </button>
                </div>
              </div>

              {/* Package Selection */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-[#0F172A]">
                  Seleccionar Paquete <span className="text-red-600">*</span>
                </h3>
                <Select value={formData.package} onValueChange={(value) => handleInputChange("package", value)}>
                  <SelectTrigger className={errors.package ? "border-red-500" : ""}>
                    <SelectValue placeholder="Seleccionar paquete" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentPackages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{pkg.name}</span>
                          <span className="text-sm text-[#64748B]">
                            €{pkg.price}
                            {serviceType === "academia"
                              ? ` - ${"duration" in pkg ? pkg.duration : ""}`
                              : ` - ${"classes" in pkg ? pkg.classes : ""} clases`}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.package && <p className="text-sm text-red-600">{errors.package}</p>}
              </div>

              {/* Payment Information */}
              <div className="space-y-4 border-t border-[#94A3B8]/20 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-[#0F172A]">Información de Pago (Opcional)</h3>
                  <button
                    type="button"
                    onClick={() => setIsPaid(!isPaid)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      isPaid ? "bg-[#059669]" : "bg-[#94A3B8]",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        isPaid ? "translate-x-6" : "translate-x-1",
                      )}
                    />
                  </button>
                </div>

                {isPaid && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="space-y-2">
                      <Label htmlFor="metodoPago">Método de pago</Label>
                      <Select
                        value={formData.metodoPago}
                        onValueChange={(value) => handleInputChange("metodoPago", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar método" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="efectivo">Efectivo</SelectItem>
                          <SelectItem value="transferencia">Transferencia</SelectItem>
                          <SelectItem value="tarjeta">Tarjeta</SelectItem>
                          <SelectItem value="bizum">Bizum</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Subir comprobante</Label>
                      <div className="border-2 border-dashed border-[#94A3B8]/30 rounded-lg p-6 text-center hover:border-[#1E40AF] transition-colors cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-[#64748B]" />
                        <p className="text-sm text-[#64748B]">
                          Haz clic o arrastra el archivo aquí
                          <br />
                          <span className="text-xs text-[#94A3B8]">PDF, JPG, PNG (máx. 5MB)</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
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
