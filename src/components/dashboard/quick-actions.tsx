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
      <CardHeader>
        <CardTitle>Acciones Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {actions.map((action) => (
            <Button
              key={action.title}
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-accent hover:text-accent-foreground bg-transparent"
              asChild
            >
              <a href={action.href}>
                <action.icon className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
