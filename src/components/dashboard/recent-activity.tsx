import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const activities = [
  {
    id: 1,
    user: "María García",
    action: "Se inscribió en",
    target: "Yoga Matutino",
    time: "Hace 2 horas",
    avatar: "/placeholder-avatar.jpg",
    type: "enrollment",
  },
  {
    id: 2,
    user: "Carlos López",
    action: "Completó",
    target: "Programa de Fuerza",
    time: "Hace 4 horas",
    avatar: "/placeholder-avatar.jpg",
    type: "completion",
  },
  {
    id: 3,
    user: "Ana Martínez",
    action: "Canceló",
    target: "Clase de Pilates",
    time: "Hace 6 horas",
    avatar: "/placeholder-avatar.jpg",
    type: "cancellation",
  },
  {
    id: 4,
    user: "Roberto Silva",
    action: "Se inscribió en",
    target: "Entrenamiento Personal",
    time: "Hace 1 día",
    avatar: "/placeholder-avatar.jpg",
    type: "enrollment",
  },
]

const getTypeBadge = (type: string) => {
  switch (type) {
    case "enrollment":
      return (
        <Badge variant="default" className="bg-success text-success-foreground">
          Inscripción
        </Badge>
      )
    case "completion":
      return (
        <Badge variant="default" className="bg-primary text-primary-foreground">
          Completado
        </Badge>
      )
    case "cancellation":
      return <Badge variant="destructive">Cancelación</Badge>
    default:
      return <Badge variant="secondary">Actividad</Badge>
  }
}

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={activity.avatar || "/placeholder.svg"} alt={activity.user} />
                <AvatarFallback className="bg-muted">
                  {activity.user
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm">
                  <span className="font-medium">{activity.user}</span>{" "}
                  <span className="text-muted-foreground">{activity.action}</span>{" "}
                  <span className="font-medium">{activity.target}</span>
                </p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
              {getTypeBadge(activity.type)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
