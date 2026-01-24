"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { CalendarView } from "@/src/types/calendar"

const MaterialIcon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={cn("material-symbols-outlined", className)}>{name}</span>
)

interface CalendarToolbarProps {
  view: CalendarView
  onViewChange: (view: CalendarView) => void
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
  searchTerm: string
  onSearchChange: (search: string) => void
  activeFilters: number
  onFiltersClick: () => void
}

export function CalendarToolbar({
  view,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
  searchTerm,
  onSearchChange,
  activeFilters,
  onFiltersClick,
}: CalendarToolbarProps) {
  const getDateTitle = () => {
    const date = view.fecha
    switch (view.tipo) {
      case "month":
        return date.toLocaleDateString("es-ES", { month: "long", year: "numeric" })
      case "week":
        const startOfWeek = new Date(date)
        const day = startOfWeek.getDay()
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
        startOfWeek.setDate(diff)

        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)

        if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
          return `${startOfWeek.getDate()}-${endOfWeek.getDate()} ${startOfWeek.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}`
        } else {
          return `${startOfWeek.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} - ${endOfWeek.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}`
        }
      case "day":
        return date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      default:
        return ""
    }
  }

  return (
    <div className="bg-white border-b border-[#E5E7EB] px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left side: Navigation and date */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrevious}
              className="h-8 w-8 p-0 hover:bg-[#F3F4F6] text-[#6B7280]"
            >
              <MaterialIcon name="chevron_left" className="text-lg" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onNext}
              className="h-8 w-8 p-0 hover:bg-[#F3F4F6] text-[#6B7280]"
            >
              <MaterialIcon name="chevron_right" className="text-lg" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onToday}
              className="h-8 px-3 text-sm font-medium text-[#1E40AF] hover:bg-[#1E40AF]/5"
            >
              Hoy
            </Button>
          </div>

          <h1 className="text-2xl font-semibold text-[#0F172A] capitalize">{getDateTitle()}</h1>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <MaterialIcon
              name="search"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9CA3AF] text-lg"
            />
            <Input
              placeholder="Buscar clases, clientes, instructores..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 border-[#E5E7EB] focus:border-[#1E40AF] focus:ring-[#1E40AF]/20 bg-[#F9FAFB] text-sm"
            />
          </div>
        </div>

        {/* Right side: View controls and filters */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onFiltersClick}
            className={cn(
              "h-8 px-3 text-sm font-medium hover:bg-[#F3F4F6]",
              activeFilters > 0 ? "text-[#1E40AF] bg-[#1E40AF]/5" : "text-[#6B7280]",
            )}
          >
            <MaterialIcon name="filter_list" className="text-lg mr-1" />
            Filtros
            {activeFilters > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs bg-[#1E40AF] text-white">
                {activeFilters}
              </Badge>
            )}
          </Button>

          <div className="h-4 w-px bg-[#E5E7EB]" />

          <div className="flex items-center bg-[#F3F4F6] rounded-lg p-1">
            {(["month", "week", "day"] as const).map((tipo) => (
              <Button
                key={tipo}
                variant="ghost"
                size="sm"
                onClick={() => onViewChange({ ...view, tipo })}
                className={cn(
                  "h-7 px-3 text-sm font-medium rounded-md transition-all",
                  view.tipo === tipo ? "bg-white text-[#1E40AF] shadow-sm" : "text-[#6B7280] hover:text-[#374151]",
                )}
              >
                {tipo === "month" && "Mes"}
                {tipo === "week" && "Semana"}
                {tipo === "day" && "Día"}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
