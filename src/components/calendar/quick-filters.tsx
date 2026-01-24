"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { CalendarFilter } from "@/src/types/calendar"
import { mockCourts } from "@/src/data/calendar-mock"

const MaterialIcon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={cn("material-symbols-outlined", className)}>{name}</span>
)

interface QuickFiltersProps {
  filter: CalendarFilter
  onFilterChange: (filter: CalendarFilter) => void
  eventCounts: {
    today: number
    thisWeek: number
    pending: number
    confirmed: number
    courts: Record<string, number>
  }
}

export function QuickFilters({ filter, onFilterChange, eventCounts }: QuickFiltersProps) {
  const today = new Date()
  const startOfWeek = new Date(today)
  const day = startOfWeek.getDay()
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
  startOfWeek.setDate(diff)
  startOfWeek.setHours(0, 0, 0, 0)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  const topCourts = mockCourts
    .map((court) => ({
      ...court,
      count: eventCounts.courts[court.id] || 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  const quickFilters = [
    {
      id: "today",
      label: "Hoy",
      icon: "today",
      count: eventCounts.today,
      filter: {
        ...filter,
        fechaInicio: today.toISOString().split("T")[0],
        fechaFin: today.toISOString().split("T")[0],
      },
    },
    {
      id: "week",
      label: "Esta semana",
      icon: "date_range",
      count: eventCounts.thisWeek,
      filter: {
        ...filter,
        fechaInicio: startOfWeek.toISOString().split("T")[0],
        fechaFin: endOfWeek.toISOString().split("T")[0],
      },
    },
    {
      id: "pending",
      label: "Pendientes",
      icon: "schedule",
      count: eventCounts.pending,
      filter: {
        ...filter,
        estados: ["Pendiente"],
      },
    },
    {
      id: "confirmed",
      label: "Confirmadas",
      icon: "check_circle",
      count: eventCounts.confirmed,
      filter: {
        ...filter,
        estados: ["Confirmada"],
      },
    },
    ...topCourts.map((court) => ({
      id: `court-${court.id}`,
      label: court.nombre,
      icon: "sports_tennis",
      count: court.count,
      filter: {
        ...filter,
        pistas: [court.id],
      },
    })),
  ]

  const isFilterActive = (quickFilter: any) => {
    if (quickFilter.id === "today") {
      return (
        filter.fechaInicio === today.toISOString().split("T")[0] &&
        filter.fechaFin === today.toISOString().split("T")[0]
      )
    }
    if (quickFilter.id === "week") {
      return (
        filter.fechaInicio === startOfWeek.toISOString().split("T")[0] &&
        filter.fechaFin === endOfWeek.toISOString().split("T")[0]
      )
    }
    if (quickFilter.id === "pending") {
      return filter.estados.length === 1 && filter.estados.includes("Pendiente")
    }
    if (quickFilter.id === "confirmed") {
      return filter.estados.length === 1 && filter.estados.includes("Confirmada")
    }
    if (quickFilter.id.startsWith("court-")) {
      const courtId = quickFilter.id.replace("court-", "")
      return filter.pistas.length === 1 && filter.pistas.includes(courtId)
    }
    return false
  }

  return (
    <div className="flex items-center gap-2 p-4 bg-[#F9FAFB] border-b border-[#E5E7EB] overflow-x-auto">
      <span className="text-sm font-medium text-[#6B7280] mr-2 whitespace-nowrap">Filtros rápidos:</span>
      {quickFilters.map((quickFilter) => {
        const isActive = isFilterActive(quickFilter)
        return (
          <Button
            key={quickFilter.id}
            variant="ghost"
            size="sm"
            onClick={() => onFilterChange(quickFilter.filter)}
            className={cn(
              "h-8 px-3 text-sm font-medium transition-all whitespace-nowrap",
              isActive
                ? "bg-[#1E40AF] text-white hover:bg-[#1D4ED8]"
                : "text-[#6B7280] hover:text-[#374151] hover:bg-white",
            )}
          >
            <MaterialIcon name={quickFilter.icon} className="text-lg mr-1" />
            {quickFilter.label}
            <Badge
              variant="secondary"
              className={cn(
                "ml-2 h-5 px-1.5 text-xs",
                isActive ? "bg-white/20 text-white" : "bg-[#E5E7EB] text-[#6B7280]",
              )}
            >
              {quickFilter.count}
            </Badge>
          </Button>
        )
      })}
    </div>
  )
}
