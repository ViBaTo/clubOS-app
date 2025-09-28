import type { CalendarEvent } from "@/src/types/calendar"

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export const formatShortDate = (date: Date): string => {
  return date.toLocaleDateString("es-ES", {
    month: "short",
    day: "numeric",
  })
}

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

export const isSameWeek = (date1: Date, date2: Date): boolean => {
  const startOfWeek1 = getStartOfWeek(date1)
  const startOfWeek2 = getStartOfWeek(date2)
  return isSameDay(startOfWeek1, startOfWeek2)
}

export const getStartOfWeek = (date: Date): Date => {
  const result = new Date(date)
  const day = result.getDay()
  const diff = result.getDate() - day + (day === 0 ? -6 : 1) // Monday as first day
  result.setDate(diff)
  result.setHours(0, 0, 0, 0)
  return result
}

export const getEndOfWeek = (date: Date): Date => {
  const result = getStartOfWeek(date)
  result.setDate(result.getDate() + 6)
  result.setHours(23, 59, 59, 999)
  return result
}

export const getStartOfMonth = (date: Date): Date => {
  const result = new Date(date)
  result.setDate(1)
  result.setHours(0, 0, 0, 0)
  return result
}

export const getEndOfMonth = (date: Date): Date => {
  const result = new Date(date)
  result.setMonth(result.getMonth() + 1, 0)
  result.setHours(23, 59, 59, 999)
  return result
}

export const getDaysInMonth = (date: Date): Date[] => {
  const start = getStartOfMonth(date)
  const end = getEndOfMonth(date)
  const days: Date[] = []

  const current = new Date(start)
  while (current <= end) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  return days
}

export const getWeekDays = (date: Date): Date[] => {
  const start = getStartOfWeek(date)
  const days: Date[] = []

  for (let i = 0; i < 7; i++) {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    days.push(day)
  }

  return days
}

export const getHourSlots = (startHour = 8, endHour = 22): string[] => {
  const slots: string[] = []

  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`)
    slots.push(`${hour.toString().padStart(2, "0")}:30`)
  }

  return slots
}

export const filterEvents = (
  events: CalendarEvent[],
  filter: import("@/src/types/calendar").CalendarFilter,
): CalendarEvent[] => {
  return events.filter((event) => {
    // Filter by instructors
    if (filter.instructores.length > 0 && !filter.instructores.includes(event.instructor.id)) {
      return false
    }

    // Filter by class types
    if (filter.tiposClase.length > 0 && !filter.tiposClase.includes(event.tipoClase)) {
      return false
    }

    // Filter by courts
    if (filter.pistas.length > 0 && !filter.pistas.includes(event.pista.id)) {
      return false
    }

    // Filter by status
    if (filter.estados.length > 0 && !filter.estados.includes(event.estado)) {
      return false
    }

    // Filter by date range
    const eventDate = new Date(event.fechaInicio)
    if (filter.fechaInicio && eventDate < new Date(filter.fechaInicio)) {
      return false
    }
    if (filter.fechaFin && eventDate > new Date(filter.fechaFin)) {
      return false
    }

    // Filter by search term
    if (filter.busqueda) {
      const searchTerm = filter.busqueda.toLowerCase()
      const searchableText = [
        event.titulo,
        event.descripcion,
        event.instructor.nombre,
        event.cliente?.nombre,
        event.clientes?.map((c) => c.nombre).join(" "),
        event.pista.nombre,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      if (!searchableText.includes(searchTerm)) {
        return false
      }
    }

    return true
  })
}

export const getEventsForDate = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  return events.filter((event) => {
    const eventDate = new Date(event.fechaInicio)
    return isSameDay(eventDate, date)
  })
}

export const getEventsForWeek = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  const startOfWeek = getStartOfWeek(date)
  const endOfWeek = getEndOfWeek(date)

  return events.filter((event) => {
    const eventDate = new Date(event.fechaInicio)
    return eventDate >= startOfWeek && eventDate <= endOfWeek
  })
}

export const getEventsForMonth = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  const startOfMonth = getStartOfMonth(date)
  const endOfMonth = getEndOfMonth(date)

  return events.filter((event) => {
    const eventDate = new Date(event.fechaInicio)
    return eventDate >= startOfMonth && eventDate <= endOfMonth
  })
}

export const hasTimeConflict = (event1: CalendarEvent, event2: CalendarEvent): boolean => {
  const start1 = new Date(event1.fechaInicio)
  const end1 = new Date(event1.fechaFin)
  const start2 = new Date(event2.fechaInicio)
  const end2 = new Date(event2.fechaFin)

  // Same court and overlapping time
  if (event1.pista.id === event2.pista.id) {
    return start1 < end2 && start2 < end1
  }

  return false
}

export const getEventDuration = (event: CalendarEvent): number => {
  const start = new Date(event.fechaInicio)
  const end = new Date(event.fechaFin)
  return (end.getTime() - start.getTime()) / (1000 * 60) // Duration in minutes
}

export const getStatusColor = (estado: CalendarEvent["estado"]): string => {
  switch (estado) {
    case "Confirmada":
      return "bg-green-100 text-green-800 border-green-200"
    case "Pendiente":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "Cancelada":
      return "bg-red-100 text-red-800 border-red-200"
    case "Completada":
      return "bg-blue-100 text-blue-800 border-blue-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

export const getTypeColor = (tipoClase: CalendarEvent["tipoClase"]): string => {
  switch (tipoClase) {
    case "Clase particular":
      return "#1E40AF" // Blue
    case "Grupal":
      return "#059669" // Green
    case "Academia":
      return "#7C3AED" // Purple
    default:
      return "#6B7280" // Gray
  }
}
