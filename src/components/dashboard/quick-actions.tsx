import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, UserPlus, Calendar, Settings } from "lucide-react"

const actions = [
  {
    title: "Nuevo Cliente",
    description: "Registrar un nuevo miembro",
    icon: UserPlus,
    href: "/clientes/nuevo",
  },
  {
    title: "Programar Clase",
    description: "Crear una nueva sesión",
    icon: Calendar,
    href: "/productos/clases/nueva",
  },
  {
    title: "Nuevo Programa",
    description: "Crear programa de academia",
    icon: Plus,
    href: "/productos/academia/nuevo",
  },
  {
    title: "Configurar",
    description: "Ajustar configuraciones",
    icon: Settings,
    href: "/configuracion",
  },
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader className="p-0">
        <CardTitle className="text-xl font-semibold text-[#0F172A] leading-snug">Acciones Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {actions.map((action) => (
            <Button
              key={action.title}
              variant="ghost"
              className="h-auto p-6 flex flex-col items-start gap-2 text-[#1E40AF] hover:bg-[#1E40AF]/5 font-medium rounded-lg transition-all duration-150"
              asChild
            >
              <a href={action.href}>
                <action.icon className="h-5 w-5 text-[#1E40AF]" />
                <div className="text-left">
                  <div className="text-base font-normal text-[#64748B] leading-relaxed font-medium">{action.title}</div>
                  <div className="text-sm font-normal text-[#94A3B8] leading-normal">{action.description}</div>
                </div>
              </a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
