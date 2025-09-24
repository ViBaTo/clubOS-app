import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

interface ClassItem {
  id: number
  date: string
  time: string
  type: string
  instructor: string
  instructorAvatar: string
  court: string
  level: string
  price: number
  availableSpots: number
  totalSpots: number
  status: string
}

interface ClassCardProps {
  classItem: ClassItem
}

export function ClassCard({ classItem }: ClassCardProps) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case "Principiante":
        return "bg-green-100 text-green-800 border-green-200"
      case "Intermedio":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Avanzado":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Disponible":
        return "bg-green-100 text-green-800 border-green-200"
      case "Completa":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "Cancelada":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Clase particular":
        return "person"
      case "Clase grupal":
        return "group"
      case "Clínic":
        return "school"
      default:
        return "event"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
  }

  const isDisabled = classItem.status === "Completa" || classItem.status === "Cancelada"

  return (
    <div className="bg-white rounded-xl shadow-sm border-0 p-6 hover:shadow-md transition-shadow duration-200">
      {/* Date and time header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-2xl font-bold text-[#0F172A]">{classItem.time}</p>
          <p className="text-sm text-[#64748B] capitalize">{formatDate(classItem.date)}</p>
        </div>
        <Badge className={`${getStatusColor(classItem.status)} font-medium`}>{classItem.status}</Badge>
      </div>

      {/* Class type */}
      <div className="flex items-center gap-3 mb-4">
        <span className="material-symbols-outlined text-[#1E40AF] text-xl">{getTypeIcon(classItem.type)}</span>
        <div>
          <p className="text-lg font-semibold text-[#0F172A]">{classItem.type}</p>
          <p className="text-sm text-[#94A3B8]">Pista {classItem.court.split(" ")[1]}</p>
        </div>
      </div>

      {/* Instructor */}
      <div className="flex items-center gap-3 mb-4">
        <Image
          src={classItem.instructorAvatar || "/placeholder.svg"}
          alt={classItem.instructor}
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <p className="text-sm font-medium text-[#0F172A]">{classItem.instructor}</p>
          <p className="text-xs text-[#94A3B8]">Instructor</p>
        </div>
      </div>

      {/* Level and court */}
      <div className="flex items-center justify-between mb-4">
        <Badge className={`${getLevelColor(classItem.level)} font-medium`}>{classItem.level}</Badge>
        <div className="flex items-center gap-1 text-sm text-[#64748B]">
          <span className="material-symbols-outlined text-[#94A3B8] text-lg">sports_tennis</span>
          {classItem.court}
        </div>
      </div>

      {/* Price and availability */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-2xl font-bold text-[#0F172A]">€{classItem.price}</p>
          <p className="text-xs text-[#94A3B8]">por clase</p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-medium ${classItem.availableSpots === 0 ? "text-orange-600" : "text-[#059669]"}`}>
            {classItem.availableSpots}/{classItem.totalSpots}
          </p>
          <p className="text-xs text-[#94A3B8]">plazas</p>
        </div>
      </div>

      {/* Separator */}
      <div className="h-px bg-[#94A3B8]/20 mb-4"></div>

      {/* Action button */}
      <Button
        className="w-full bg-[#1E40AF] hover:bg-[#1D4ED8] text-white transition-all duration-150"
        disabled={isDisabled}
      >
        {classItem.status === "Cancelada" ? "Cancelada" : classItem.status === "Completa" ? "Completa" : "Reservar"}
      </Button>
    </div>
  )
}
