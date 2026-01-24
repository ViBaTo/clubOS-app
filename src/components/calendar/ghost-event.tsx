"use client"

import { cn } from "@/lib/utils"
import type { CalendarEvent } from "@/src/types/calendar"
import { formatTime } from "@/src/utils/calendar-helpers"

interface GhostEventProps {
  event: CalendarEvent
  newDate: Date
  newHour?: string
  isValid: boolean
  className?: string
}

export function GhostEvent({ event, newDate, newHour, isValid, className }: GhostEventProps) {
  const newStartDate = new Date(newDate)
  if (newHour) {
    const [hourNum, minuteNum] = newHour.split(":").map(Number)
    newStartDate.setHours(hourNum, minuteNum, 0, 0)
  }

  const originalDuration = new Date(event.fechaFin).getTime() - new Date(event.fechaInicio).getTime()
  const newEndDate = new Date(newStartDate.getTime() + originalDuration)

  return (
    <div
      className={cn(
        "absolute inset-1 rounded-lg border-2 border-dashed transition-all duration-200 pointer-events-none z-20",
        isValid ? "border-green-400 bg-green-50/80" : "border-red-400 bg-red-50/80",
        className,
      )}
    >
      <div className="p-2 h-full flex flex-col justify-center">
        <div className={cn("text-xs font-medium truncate", isValid ? "text-green-700" : "text-red-700")}>
          {event.titulo}
        </div>
        <div className={cn("text-xs truncate", isValid ? "text-green-600" : "text-red-600")}>
          {formatTime(newStartDate)} - {formatTime(newEndDate)}
        </div>
        <div className={cn("text-xs truncate", isValid ? "text-green-600" : "text-red-600")}>{event.pista.nombre}</div>
      </div>
    </div>
  )
}
