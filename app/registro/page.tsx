"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Building2, UserPlus, ArrowLeft } from "lucide-react"

export default function RegistroPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Back to Login */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio de sesión
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <span className="text-2xl font-bold text-primary-foreground">CO</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Únete a ClubOS</h1>
          <p className="text-muted-foreground text-balance">Selecciona cómo quieres registrarte</p>
        </div>

        {/* Registration Options */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Create New Club */}
          <Card className="border-2 hover:border-primary transition-colors cursor-pointer group">
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4 mx-auto group-hover:bg-primary/20 transition-colors">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Crear un nuevo club</CardTitle>
              <CardDescription className="text-balance">
                Registra tu club deportivo y comienza a gestionarlo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/registro/nuevo-club">
                <Button className="w-full h-11 text-base font-medium">Crear club</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Join Existing Club */}
          <Card className="border-2 hover:border-primary transition-colors cursor-pointer group">
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4 mx-auto group-hover:bg-primary/20 transition-colors">
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Unirse a un club existente</CardTitle>
              <CardDescription className="text-balance">
                Únete como gestor, profesor o personal administrativo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/registro/unirse">
                <Button variant="outline" className="w-full h-11 text-base font-medium border-2 bg-transparent">
                  Unirse
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            ¿Necesitas ayuda?{" "}
            <button className="text-primary hover:text-primary/80 font-medium transition-colors">
              Contacta con soporte
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
