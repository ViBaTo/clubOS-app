"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Eye, EyeOff, Info } from "lucide-react"

const ROLES = ["Gestor", "Profesor/Entrenador", "Administración", "Recepción"]

export default function UnirsePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    clubCode: "",
    role: "",
    message: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate registration process
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsLoading(false)
    router.push("/registro/exito?type=unirse")
  }

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: "" }
    if (password.length < 6) return { strength: 1, label: "Débil", color: "bg-red-500" }
    if (password.length < 10) return { strength: 2, label: "Media", color: "bg-yellow-500" }
    return { strength: 3, label: "Fuerte", color: "bg-green-500" }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8 px-4">
      <div className="w-full max-w-2xl mx-auto">
        {/* Back Button */}
        <Link
          href="/registro"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a opciones de registro
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Unirse a un club existente</h1>
          <p className="text-muted-foreground">Completa el formulario para solicitar acceso</p>
        </div>

        {/* Form */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Información personal</CardTitle>
            <CardDescription>Proporciona tus datos para crear tu cuenta</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre completo *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    placeholder="Juan Pérez"
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="tu@email.com"
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      placeholder="••••••••"
                      className="h-11 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              level <= passwordStrength.strength ? passwordStrength.color : "bg-border"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Seguridad: {passwordStrength.label || "Ingresa una contraseña"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      placeholder="••••••••"
                      className="h-11 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-red-500">Las contraseñas no coinciden</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+34 600 000 000"
                    className="h-11"
                    required
                  />
                </div>
              </div>

              {/* Club Access Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">Acceso al club</h3>

                <div className="space-y-2">
                  <Label htmlFor="clubCode">Código de acceso del club *</Label>
                  <Input
                    id="clubCode"
                    value={formData.clubCode}
                    onChange={(e) => handleInputChange("clubCode", e.target.value.toUpperCase())}
                    placeholder="ABC12345"
                    className="h-11 font-mono tracking-wider"
                    maxLength={8}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Solicita este código al administrador de tu club</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Rol solicitado *</Label>
                  <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                    <SelectTrigger id="role" className="h-11">
                      <SelectValue placeholder="Selecciona tu rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensaje para el administrador (opcional)</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleInputChange("message", e.target.value)}
                    placeholder="Cuéntale al administrador sobre tu experiencia y por qué quieres unirte..."
                    className="min-h-24 resize-none"
                  />
                </div>
              </div>

              {/* Verification Notice */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Tu solicitud será revisada por el administrador del club. Recibirás un email cuando sea aprobada.
                </AlertDescription>
              </Alert>

              {/* Submit Button */}
              <Button type="submit" className="w-full h-11 text-base font-medium" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>Enviando solicitud...</span>
                  </div>
                ) : (
                  "Enviar solicitud"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
