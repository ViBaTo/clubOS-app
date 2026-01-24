"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { CalendarFilter } from "@/src/types/calendar"
import { mockInstructors, mockCourts } from "@/src/data/calendar-mock"

const MaterialIcon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={cn("material-symbols-outlined", className)}>{name}</span>
)

interface ActiveFiltersBarProps {
  filter: CalendarFilter
  onFilterChange: (filter: CalendarFilter) => void
  onClearAll: () => void
  totalResults: number
}

export function ActiveFiltersBar({ filter, onFilterChange, onClearAll, totalResults }: ActiveFiltersBarProps) {
  const hasActiveFilters =
    filter.instructores.length > 0 ||
    filter.tiposClase.length > 0 ||
    filter.pistas.length > 0 ||
    filter.estados.length > 0 ||
    filter.fechaInicio ||
    filter.fechaFin ||
    filter.busqueda

  if (!hasActiveFilters) return null

  const removeFilter = (type: keyof CalendarFilter, value?: string) => {
    if (type === "fechaInicio" || type === "fechaFin" || type === "busqueda") {
      onFilterChange({
        ...filter,
        [type]: type === "busqueda" ? "" : undefined,
      })
    } else if (value) {
      const currentArray = filter[type] as string[]
      onFilterChange({
        ...filter,
        [type]: currentArray.filter((item) => item !== value),
      })
    }
  }

  const getInstructorName = (id: string) => {
    return mockInstructors.find((i) => i.id === id)?.nombre || id
  }

  const getCourtName = (id: string) => {
    return mockCourts.find((c) => c.id === id)?.nombre || id
  }

  return (
    <div className="bg-white border-b border-[#E5E7EB] px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-[#6B7280]">
            {totalResults} {totalResults === 1 ? "resultado" : "resultados"}:
          </span>

          {/* Search filter */}
          {filter.busqueda && (
            <Badge variant="secondary" className="bg-[#1E40AF]/10 text-[#1E40AF] border-[#1E40AF]/20">
              <MaterialIcon name="search" className="text-sm mr-1" />"{filter.busqueda}"
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFilter("busqueda")}
                className="h-4 w-4 p-0 ml-1 hover:bg-[#1E40AF]/20"
              >
                <MaterialIcon name="close" className="text-xs" />
              </Button>
            </Badge>
          )}

          {/* Date range filters */}
          {(filter.fechaInicio || filter.fechaFin) && (
            <Badge variant="secondary" className="bg-[#059669]/10 text-[#059669] border-[#059669]/20">
              <MaterialIcon name="date_range" className="text-sm mr-1" />
              {filter.fechaInicio && filter.fechaFin
                ? `${new Date(filter.fechaInicio).toLocaleDateString("es-ES")} - ${new Date(filter.fechaFin).toLocaleDateString("es-ES")}`
                : filter.fechaInicio
                  ? `Desde ${new Date(filter.fechaInicio).toLocaleDateString("es-ES")}`
                  : `Hasta ${new Date(filter.fechaFin!).toLocaleDateString("es-ES")}`}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onFilterChange({
                    ...filter,
                    fechaInicio: undefined,
                    fechaFin: undefined,
                  })
                }}
                className="h-4 w-4 p-0 ml-1 hover:bg-[#059669]/20"
              >
                <MaterialIcon name="close" className="text-xs" />
              </Button>
            </Badge>
          )}

          {/* Instructor filters */}
          {filter.instructores.map((instructorId) => (
            <Badge
              key={instructorId}
              variant="secondary"
              className="bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/20"
            >
              <MaterialIcon name="person" className="text-sm mr-1" />
              {getInstructorName(instructorId)}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFilter("instructores", instructorId)}
                className="h-4 w-4 p-0 ml-1 hover:bg-[#7C3AED]/20"
              >
                <MaterialIcon name="close" className="text-xs" />
              </Button>
            </Badge>
          ))}

          {/* Class type filters */}
          {filter.tiposClase.map((tipo) => (
            <Badge key={tipo} variant="secondary" className="bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20">
              <MaterialIcon name="school" className="text-sm mr-1" />
              {tipo}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFilter("tiposClase", tipo)}
                className="h-4 w-4 p-0 ml-1 hover:bg-[#DC2626]/20"
              >
                <MaterialIcon name="close" className="text-xs" />
              </Button>
            </Badge>
          ))}

          {/* Court filters */}
          {filter.pistas.map((pistaId) => (
            <Badge key={pistaId} variant="secondary" className="bg-[#EA580C]/10 text-[#EA580C] border-[#EA580C]/20">
              <MaterialIcon name="location_on" className="text-sm mr-1" />
              {getCourtName(pistaId)}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFilter("pistas", pistaId)}
                className="h-4 w-4 p-0 ml-1 hover:bg-[#EA580C]/20"
              >
                <MaterialIcon name="close" className="text-xs" />
              </Button>
            </Badge>
          ))}

          {/* Status filters */}
          {filter.estados.map((estado) => (
            <Badge key={estado} variant="secondary" className="bg-[#0891B2]/10 text-[#0891B2] border-[#0891B2]/20">
              <MaterialIcon name="check_circle" className="text-sm mr-1" />
              {estado}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFilter("estados", estado)}
                className="h-4 w-4 p-0 ml-1 hover:bg-[#0891B2]/20"
              >
                <MaterialIcon name="close" className="text-xs" />
              </Button>
            </Badge>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-[#6B7280] hover:text-[#374151] hover:bg-[#F3F4F6]"
        >
          <MaterialIcon name="clear_all" className="text-lg mr-1" />
          Limpiar todo
        </Button>
      </div>
    </div>
  )
}
