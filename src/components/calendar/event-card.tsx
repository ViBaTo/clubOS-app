"use client"

import type React from "react"

import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { CalendarEvent } from "@/src/types/calendar"
import { formatTime, getStatusColor } from "@/src/utils/calendar-helpers"

const MaterialIcon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={cn("material-symbols-outlined", className)}>{name}</span>
)

interface EventCardProps {
  event: CalendarEvent
  compact?: boolean
  onClick?: () => void
  onDragStart?: (e: React.DragEvent) => void
  isDragging?: boolean
  className?: string
}

export function EventCard({
  event,
  compact = false,
  onClick,
  onDragStart,
  isDragging = false,
  className,
}: EventCardProps) {
  const startTime = new Date(event.fechaInicio)
  const endTime = new Date(event.fechaFin)

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
  }

  const getClientDisplay = () => {
    if (event.cliente) {
      return event.cliente.nombre
    }
    if (event.clientes && event.clientes.length > 0) {
      if (event.clientes.length === 1) {
        return event.clientes[0].nombre
      }
      return `${event.clientes[0].nombre} +${event.clientes.length - 1}`
    }
    return "Academia"
  }

  if (compact) {
    return (
      <div
        className={cn(
          "group relative bg-white rounded-lg border border-[#E5E7EB] p-3 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-[#1E40AF]/30",
          isDragging && "opacity-50 scale-95",
          className,
        )}
        onClick={onClick}
        draggable
        onDragStart={onDragStart}
        style={{ borderLeftColor: event.color, borderLeftWidth: "4px" }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-[#0F172A] truncate">{event.titulo}</p>
              <Badge variant="secondary" className={cn("text-xs", getStatusColor(event.estado))}>
                {event.estado}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#6B7280]">
              <MaterialIcon name="schedule" className="text-sm" />
              <span>
                {formatTime(startTime)} - {formatTime(endTime)}
              </span>
              <MaterialIcon name="location_on" className="text-sm" />
              <span>{event.pista.nombre}</span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <Avatar className="h-5 w-5">
                <AvatarImage src={event.instructor.avatar || "/placeholder.svg"} />
                <AvatarFallback className="text-xs bg-[#1E40AF]/10 text-[#1E40AF]">
                  {getInitials(event.instructor.nombre)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-[#6B7280] truncate">{event.instructor.nombre}</span>
            </div>
          </div>

          <MaterialIcon
            name="drag_indicator"
            className="text-[#9CA3AF] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "group relative bg-white rounded-xl border border-[#E5E7EB] p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-[#1E40AF]/30",
        isDragging && "opacity-50 scale-95",
        className,
      )}
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      style={{ borderLeftColor: event.color, borderLeftWidth: "6px" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-base font-semibold text-[#0F172A] truncate">{event.titulo}</h3>
            <Badge variant="secondary" className={cn("text-xs", getStatusColor(event.estado))}>
              {event.estado}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-[#6B7280]">
              <MaterialIcon name="schedule" className="text-lg" />
              <span>
                {formatTime(startTime)} - {formatTime(endTime)}
              </span>
              <span className="text-[#9CA3AF]">•</span>
              <MaterialIcon name="location_on" className="text-lg" />
              <span>{event.pista.nombre}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={event.instructor.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs bg-[#1E40AF]/10 text-[#1E40AF]">
                    {getInitials(event.instructor.nombre)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-[#6B7280]">{event.instructor.nombre}</span>
              </div>

              {(event.cliente || event.clientes) && (
                <>
                  <span className="text-[#9CA3AF]">•</span>
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="person" className="text-lg text-[#9CA3AF]" />
                    <span className="text-sm text-[#6B7280] truncate">{getClientDisplay()}</span>
                  </div>
                </>
              )}
            </div>

            {event.precio && (
              <div className="flex items-center gap-2 text-sm">
                <MaterialIcon name="euro" className="text-lg text-[#059669]" />
                <span className="text-[#059669] font-medium">€{event.precio}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <MaterialIcon
            name="drag_indicator"
            className="text-[#9CA3AF] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          />

          <Badge variant="outline" className="text-xs" style={{ color: event.color, borderColor: event.color }}>
            {event.tipoClase}
          </Badge>
        </div>
      </div>

      {event.descripcion && <p className="text-sm text-[#6B7280] mt-3 line-clamp-2">{event.descripcion}</p>}
    </div>
  )
}
