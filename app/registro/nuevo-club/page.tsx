"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff } from "lucide-react"

const CLUB_TYPES = [
  "Club de Pádel",
  "Club de Tenis",
  "Club de Golf",
  "Gimnasio/Fitness",
  "Club de Natación",
  "Centro Deportivo Multidisciplinar",
  "Otro",
]

const SUBSCRIPTION_PLANS = [
  {
    name: "Basic",
    price: "29€/mes",
    features: ["Hasta 100 clientes", "Gestión básica", "Soporte por email"],
  },
  {
    name: "Pro",
    price: "79€/mes",
    features: ["Clientes ilimitados", "Funciones avanzadas", "Soporte prioritario", "Reportes personalizados"],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Contactar",
    features: ["Todo en Pro", "Múltiples sedes", "API personalizada", "Gestor de cuenta dedicado"],
  },
]

export default function NuevoClubPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    // Step 1: Club Information
    clubType: "",
    clubTypeOther: "",
    clubName: "",
    address: "",
    phone: "",
    clubEmail: "",
    cif: "",
    // Step 2: Administrator Account
    adminName: "",
    adminEmail: "",
    password: "",
    confirmPassword: "",
    adminPhone: "",
    // Step 3: Subscription
    selectedPlan: "Pro",
    acceptTerms: false,
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3))
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate registration process
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsLoading(false)
    router.push("/registro/exito?type=nuevo-club")
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
      <div className="w-full max-w-3xl mx-auto">
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Crear un nuevo club</h1>
          <p className="text-muted-foreground">Completa los siguientes pasos para registrar tu club</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    currentStep >= step
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {currentStep > step ? <Check className="h-5 w-5" /> : step}
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-colors ${currentStep > step ? "bg-primary" : "bg-border"}`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Información del club</span>
            <span>Cuenta administrador</span>
            <span>Plan de suscripción</span>
          </div>
        </div>

        {/* Form */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && "Información del club"}
              {currentStep === 2 && "Cuenta de administrador"}
              {currentStep === 3 && "Selecciona tu plan"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Proporciona los detalles de tu club deportivo"}
              {currentStep === 2 && "Crea tu cuenta de administrador"}
              {currentStep === 3 && "Elige el plan que mejor se adapte a tus necesidades"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              {/* Step 1: Club Information */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clubType">Tipo de club *</Label>
                    <Select value={formData.clubType} onValueChange={(value) => handleInputChange("clubType", value)}>
                      <SelectTrigger id="clubType" className="h-11">
                        <SelectValue placeholder="Selecciona el tipo de club" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLUB_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.clubType === "Otro" && (
                    <div className="space-y-2">
                      <Label htmlFor="clubTypeOther">Especifica el tipo de club *</Label>
                      <Input
                        id="clubTypeOther"
                        value={formData.clubTypeOther}
                        onChange={(e) => handleInputChange("clubTypeOther", e.target.value)}
                        placeholder="Ej: Centro de yoga"
                        className="h-11"
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="clubName">Nombre del club *</Label>
                    <Input
                      id="clubName"
                      value={formData.clubName}
                      onChange={(e) => handleInputChange("clubName", e.target.value)}
                      placeholder="Ej: Club Deportivo Madrid"
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección completa *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      placeholder="Calle, número, ciudad, código postal"
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
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

                    <div className="space-y-2">
                      <Label htmlFor="clubEmail">Email del club *</Label>
                      <Input
                        id="clubEmail"
                        type="email"
                        value={formData.clubEmail}
                        onChange={(e) => handleInputChange("clubEmail", e.target.value)}
                        placeholder="info@tuclub.com"
                        className="h-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cif">CIF/NIF *</Label>
                    <Input
                      id="cif"
                      value={formData.cif}
                      onChange={(e) => handleInputChange("cif", e.target.value)}
                      placeholder="B12345678"
                      className="h-11"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Administrator Account */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminName">Nombre completo *</Label>
                    <Input
                      id="adminName"
                      value={formData.adminName}
                      onChange={(e) => handleInputChange("adminName", e.target.value)}
                      placeholder="Juan Pérez"
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Email personal *</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={formData.adminEmail}
                      onChange={(e) => handleInputChange("adminEmail", e.target.value)}
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
                    <Label htmlFor="adminPhone">Teléfono personal *</Label>
                    <Input
                      id="adminPhone"
                      type="tel"
                      value={formData.adminPhone}
                      onChange={(e) => handleInputChange("adminPhone", e.target.value)}
                      placeholder="+34 600 000 000"
                      className="h-11"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Subscription Plan */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    {SUBSCRIPTION_PLANS.map((plan) => (
                      <Card
                        key={plan.name}
                        className={`cursor-pointer transition-all ${
                          formData.selectedPlan === plan.name
                            ? "border-2 border-primary shadow-lg"
                            : "border hover:border-primary/50"
                        } ${plan.popular ? "relative" : ""}`}
                        onClick={() => handleInputChange("selectedPlan", plan.name)}
                      >
                        {plan.popular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                              Más popular
                            </span>
                          </div>
                        )}
                        <CardHeader className="text-center pb-4">
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                          <div className="text-2xl font-bold text-primary mt-2">{plan.price}</div>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="flex items-start space-x-2 p-4 bg-muted/50 rounded-lg">
                    <Checkbox
                      id="terms"
                      checked={formData.acceptTerms}
                      onCheckedChange={(checked) => handleInputChange("acceptTerms", checked as boolean)}
                    />
                    <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                      Acepto los{" "}
                      <button type="button" className="text-primary hover:text-primary/80 font-medium">
                        términos y condiciones
                      </button>{" "}
                      y la{" "}
                      <button type="button" className="text-primary hover:text-primary/80 font-medium">
                        política de privacidad
                      </button>{" "}
                      de ClubOS
                    </Label>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-4 mt-6">
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={handleBack} className="flex-1 h-11 bg-transparent">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Anterior
                  </Button>
                )}

                {currentStep < 3 ? (
                  <Button type="button" onClick={handleNext} className="flex-1 h-11">
                    Siguiente
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="submit" className="flex-1 h-11" disabled={!formData.acceptTerms || isLoading}>
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        <span>Creando club...</span>
                      </div>
                    ) : (
                      "Crear club"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
