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
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    setShowConfetti(true)
    const timer = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  const isNewClub = type === "nuevo-club"

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
              {isNewClub ? "¡Club creado exitosamente!" : "¡Solicitud enviada!"}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {isNewClub
                ? "Tu club ha sido registrado correctamente en ClubOS"
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
            ) : (
              <>
                <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <h3 className="font-semibold mb-1">¿Qué sigue?</h3>
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <li>• El administrador del club revisará tu solicitud</li>
                        <li>• Recibirás un email cuando sea aprobada</li>
                        <li>• Podrás acceder al sistema con tus credenciales</li>
                        <li>• Mientras tanto, revisa tu email de confirmación</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link href="/login">
                    <Button className="w-full h-11 text-base font-medium">Volver al inicio de sesión</Button>
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    ¿Tienes preguntas?{" "}
                    <button className="text-primary hover:text-primary/80 font-medium transition-colors">
                      Contacta con soporte
                    </button>
                  </p>
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
