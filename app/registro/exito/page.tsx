"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, Clock, Sparkles } from "lucide-react"

export default function ExitoPage() {
  const searchParams = useSearchParams()
  const type = searchParams.get("type")
  const orgName = searchParams.get("org")
  const email = searchParams.get("email")
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    setShowConfetti(true)
    const timer = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  const isNewClub = type === "nuevo-club"
  const isInvitation = type === "invitation"
  const isPending = type === "pending"

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ["#14B8A6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"][
                    Math.floor(Math.random() * 5)
                  ],
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="w-full max-w-2xl">
        <Card className="border-0 shadow-xl text-center">
          <CardHeader className="pb-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4 mx-auto">
              {isNewClub ? (
                <CheckCircle2 className="h-10 w-10 text-primary" />
              ) : (
                <Clock className="h-10 w-10 text-primary" />
              )}
            </div>
            <CardTitle className="text-3xl">
              {isNewClub 
                ? "¡Club creado exitosamente!" 
                : isInvitation 
                ? "¡Solicitud enviada!" 
                : isPending 
                ? "¡Cuenta creada!" 
                : "¡Solicitud enviada!"}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {isNewClub
                ? "Tu club ha sido registrado correctamente en ClubOS"
                : isInvitation && orgName
                ? `Tu solicitud de acceso a ${decodeURIComponent(orgName)} ha sido enviada al administrador`
                : isPending && email
                ? `Verifica tu email (${decodeURIComponent(email)}) para completar tu solicitud de acceso`
                : "Tu solicitud ha sido enviada al administrador del club"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isNewClub ? (
              <>
                <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <h3 className="font-semibold mb-1">Próximos pasos</h3>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <li>• Configura las instalaciones y servicios de tu club</li>
                        <li>• Invita a tu equipo de trabajo</li>
                        <li>• Comienza a registrar tus primeros clientes</li>
                        <li>• Explora todas las funcionalidades de ClubOS</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link href="/">
                    <Button className="w-full h-11 text-base font-medium">Comenzar tour de bienvenida</Button>
                  </Link>
                  <Link href="/">
                    <Button variant="outline" className="w-full h-11 text-base font-medium bg-transparent">
                      Ir al panel de control
                    </Button>
                  </Link>
                </div>
              </>
            ) : isPending ? (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <h3 className="font-semibold mb-1 text-blue-800">Verifica tu email</h3>
                      <ul className="text-sm text-blue-700 space-y-2">
                        <li>• Revisa tu bandeja de entrada en {email && decodeURIComponent(email)}</li>
                        <li>• Haz clic en el enlace de verificación</li>
                        <li>• Una vez verificado, completa tu solicitud de acceso al club</li>
                        <li>• Si no ves el email, revisa tu carpeta de spam</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link href="/login">
                    <Button className="w-full h-11 text-base font-medium">Ya verifiqué mi email</Button>
                  </Link>
                  <Link href="/registro/unirse">
                    <Button variant="outline" className="w-full h-11 text-base font-medium bg-transparent">
                      Intentar nuevamente
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <h3 className="font-semibold mb-1">¿Qué sigue ahora?</h3>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <li>• El administrador del club revisará tu solicitud</li>
                        <li>• Recibirás una notificación cuando sea aprobada</li>
                        <li>• Una vez aprobada, tendrás acceso completo a {orgName ? decodeURIComponent(orgName) : 'la organización'}</li>
                        <li>• El proceso normalmente toma entre 24-48 horas</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link href="/login">
                    <Button className="w-full h-11 text-base font-medium">Iniciar sesión</Button>
                  </Link>
                  <Link href="/">
                    <Button variant="outline" className="w-full h-11 text-base font-medium bg-transparent">
                      Volver al inicio
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  )
}
