"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
<<<<<<< HEAD
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
=======
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
>>>>>>> origin/login-dev-mockdata
    email: "",
    password: "",
    rememberMe: false,
  })
<<<<<<< HEAD
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<LoginFormData>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {}

    if (!formData.email) {
      newErrors.email = "El email es requerido"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido"
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida"
    } else if (formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      // Handle successful login here
      console.log("Login successful", formData)
    }, 2000)
  }

  const handleInputChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FBFAFC] via-[#F1F5F9] to-[#E2E8F0] flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fillRule=\"evenodd\"%3E%3Cg fill=\"%2314B8A6\" fillOpacity=\"0.03\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"2\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
      
      <div className="relative w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#14B8A6] rounded-2xl mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white">C</span>
          </div>
          <h1 className="text-3xl font-bold text-[#0F172A] mb-2">ClubOS</h1>
          <p className="text-[#64748B] text-sm font-medium">
            Gestiona tu club deportivo con facilidad
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center text-[#0F172A]">
              Iniciar sesión
            </CardTitle>
            <CardDescription className="text-center text-[#64748B]">
              Ingresa tus credenciales para acceder al panel
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-[#0F172A]">
                  Email o usuario
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748B] h-4 w-4" />
=======

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate login process
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsLoading(false)
    // Handle login logic here
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <span className="text-2xl font-bold text-primary-foreground">CO</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">ClubOS</h1>
          <p className="text-muted-foreground text-balance">Gestiona tu club deportivo con facilidad</p>
        </div>

        {/* Login Form */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center">Iniciar sesión</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Ingresa tus credenciales para acceder al panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email/Username Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email o usuario
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
>>>>>>> origin/login-dev-mockdata
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
<<<<<<< HEAD
                    className={`pl-10 h-11 bg-[#F8FAFC] border-[#E2E8F0] focus:border-[#14B8A6] focus:ring-[#14B8A6] ${
                      errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                    }`}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                )}
=======
                    className="pl-10 h-11"
                    required
                  />
                </div>
>>>>>>> origin/login-dev-mockdata
              </div>

              {/* Password Field */}
              <div className="space-y-2">
<<<<<<< HEAD
                <Label htmlFor="password" className="text-sm font-medium text-[#0F172A]">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748B] h-4 w-4" />
=======
                <Label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
>>>>>>> origin/login-dev-mockdata
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
<<<<<<< HEAD
                    className={`pl-10 pr-10 h-11 bg-[#F8FAFC] border-[#E2E8F0] focus:border-[#14B8A6] focus:ring-[#14B8A6] ${
                      errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                    }`}
                    disabled={isLoading}
=======
                    className="pl-10 pr-10 h-11"
                    required
>>>>>>> origin/login-dev-mockdata
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
<<<<<<< HEAD
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] transition-colors"
                    disabled={isLoading}
=======
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
>>>>>>> origin/login-dev-mockdata
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
<<<<<<< HEAD
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2 pt-2">
=======
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center space-x-2">
>>>>>>> origin/login-dev-mockdata
                <Checkbox
                  id="remember"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => handleInputChange("rememberMe", checked as boolean)}
<<<<<<< HEAD
                  className="border-[#E2E8F0] data-[state=checked]:bg-[#14B8A6] data-[state=checked]:border-[#14B8A6]"
                  disabled={isLoading}
                />
                <Label
                  htmlFor="remember"
                  className="text-sm text-[#64748B] cursor-pointer select-none"
=======
                />
                <Label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
>>>>>>> origin/login-dev-mockdata
                >
                  Recordarme
                </Label>
              </div>

              {/* Submit Button */}
<<<<<<< HEAD
              <Button
                type="submit"
                className="w-full h-11 bg-[#14B8A6] hover:bg-[#0F9488] text-white font-medium transition-colors mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
=======
              <Button type="submit" className="w-full h-11 text-base font-medium" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
>>>>>>> origin/login-dev-mockdata
                    <span>Iniciando sesión...</span>
                  </div>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>

              {/* Forgot Password Link */}
<<<<<<< HEAD
              <div className="text-center pt-4">
                <button
                  type="button"
                  className="text-sm text-[#14B8A6] hover:text-[#0F9488] font-medium transition-colors"
                  disabled={isLoading}
=======
              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
>>>>>>> origin/login-dev-mockdata
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

<<<<<<< HEAD
        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-[#64748B]">
            ¿No tienes cuenta?{" "}
            <button className="text-[#14B8A6] hover:text-[#0F9488] font-medium transition-colors">
              Contacta con soporte
            </button>
          </p>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center mt-4 text-xs text-[#94A3B8]">
          <Lock className="h-3 w-3 mr-1" />
          <span>Conexión segura SSL</span>
=======
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground mb-4">¿No tienes cuenta? </p>
          <Link href="/registro">
            <Button variant="outline" className="w-full h-11 text-base font-medium border-2 bg-transparent">
              Crear cuenta nueva
            </Button>
          </Link>
>>>>>>> origin/login-dev-mockdata
        </div>
      </div>
    </div>
  )
}
