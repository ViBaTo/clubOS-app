"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { CalendarFilter } from "@/src/types/calendar"
import { mockInstructors, mockCourts } from "@/src/data/calendar-mock"

const MaterialIcon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={cn("material-symbols-outlined", className)}>{name}</span>
)

interface CalendarFiltersProps {
  filter: CalendarFilter
  onFilterChange: (filter: CalendarFilter) => void
  onClearFilters: () => void
  isOpen: boolean
  onToggle: () => void
}

export function CalendarFilters({ filter, onFilterChange, onClearFilters, isOpen, onToggle }: CalendarFiltersProps) {
  const [tempFilter, setTempFilter] = useState<CalendarFilter>(filter)

  const tiposClase = ["Clase particular", "Grupal", "Academia"]
  const estados = ["Confirmada", "Pendiente", "Cancelada", "Completada"]

  const handleApplyFilters = () => {
    onFilterChange(tempFilter)
    onToggle()
  }

  const handleResetFilters = () => {
    const resetFilter: CalendarFilter = {
      instructores: [],
      tiposClase: [],
      pistas: [],
      estados: [],
      busqueda: "",
    }
    setTempFilter(resetFilter)
    onFilterChange(resetFilter)
  }

  const getActiveFiltersCount = () => {
    return (
      tempFilter.instructores.length +
      tempFilter.tiposClase.length +
      tempFilter.pistas.length +
      tempFilter.estados.length +
      (tempFilter.fechaInicio ? 1 : 0) +
      (tempFilter.fechaFin ? 1 : 0)
    )
  }

  const toggleArrayFilter = (key: keyof CalendarFilter, value: string) => {
    const currentArray = tempFilter[key] as string[]
    const newArray = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value]

    setTempFilter((prev) => ({
      ...prev,
      [key]: newArray,
    }))
  }

  return (
    <Popover open={isOpen} onOpenChange={onToggle}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-3 text-sm font-medium hover:bg-[#F3F4F6]",
            getActiveFiltersCount() > 0 ? "text-[#1E40AF] bg-[#1E40AF]/5" : "text-[#6B7280]",
          )}
        >
          <MaterialIcon name="filter_list" className="text-lg mr-1" />
          Filtros
          {getActiveFiltersCount() > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs bg-[#1E40AF] text-white">
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b border-[#E5E7EB]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#0F172A]">Filtros</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-[#6B7280] hover:text-[#374151]"
            >
              <MaterialIcon name="refresh" className="text-lg mr-1" />
              Limpiar
            </Button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Date Range */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-[#0F172A] flex items-center gap-2">
                <MaterialIcon name="date_range" className="text-lg text-[#1E40AF]" />
                Rango de fechas
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-[#6B7280]">Desde</Label>
                  <Input
                    type="date"
                    value={tempFilter.fechaInicio || ""}
                    onChange={(e) =>
                      setTempFilter((prev) => ({
                        ...prev,
                        fechaInicio: e.target.value || undefined,
                      }))
                    }
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#6B7280]">Hasta</Label>
                  <Input
                    type="date"
                    value={tempFilter.fechaFin || ""}
                    onChange={(e) =>
                      setTempFilter((prev) => ({
                        ...prev,
                        fechaFin: e.target.value || undefined,
                      }))
                    }
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Instructors */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-[#0F172A] flex items-center gap-2">
                <MaterialIcon name="person" className="text-lg text-[#1E40AF]" />
                Instructores ({tempFilter.instructores.length})
              </Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {mockInstructors.map((instructor) => (
                  <div key={instructor.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`instructor-${instructor.id}`}
                      checked={tempFilter.instructores.includes(instructor.id)}
                      onCheckedChange={() => toggleArrayFilter("instructores", instructor.id)}
                    />
                    <Label
                      htmlFor={`instructor-${instructor.id}`}
                      className="text-sm text-[#374151] cursor-pointer flex-1"
                    >
                      {instructor.nombre}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Class Types */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-[#0F172A] flex items-center gap-2">
                <MaterialIcon name="school" className="text-lg text-[#1E40AF]" />
                Tipos de clase ({tempFilter.tiposClase.length})
              </Label>
              <div className="space-y-2">
                {tiposClase.map((tipo) => (
                  <div key={tipo} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tipo-${tipo}`}
                      checked={tempFilter.tiposClase.includes(tipo)}
                      onCheckedChange={() => toggleArrayFilter("tiposClase", tipo)}
                    />
                    <Label htmlFor={`tipo-${tipo}`} className="text-sm text-[#374151] cursor-pointer flex-1">
                      {tipo}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Courts */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-[#0F172A] flex items-center gap-2">
                <MaterialIcon name="location_on" className="text-lg text-[#1E40AF]" />
                Pistas ({tempFilter.pistas.length})
              </Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {mockCourts.map((court) => (
                  <div key={court.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`court-${court.id}`}
                      checked={tempFilter.pistas.includes(court.id)}
                      onCheckedChange={() => toggleArrayFilter("pistas", court.id)}
                    />
                    <Label htmlFor={`court-${court.id}`} className="text-sm text-[#374151] cursor-pointer flex-1">
                      {court.nombre}
                      <span className="text-xs text-[#6B7280] ml-1">({court.tipo})</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Status */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-[#0F172A] flex items-center gap-2">
                <MaterialIcon name="check_circle" className="text-lg text-[#1E40AF]" />
                Estados ({tempFilter.estados.length})
              </Label>
              <div className="space-y-2">
                {estados.map((estado) => (
                  <div key={estado} className="flex items-center space-x-2">
                    <Checkbox
                      id={`estado-${estado}`}
                      checked={tempFilter.estados.includes(estado)}
                      onCheckedChange={() => toggleArrayFilter("estados", estado)}
                    />
                    <Label htmlFor={`estado-${estado}`} className="text-sm text-[#374151] cursor-pointer flex-1">
                      {estado}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#E5E7EB] bg-[#F9FAFB]">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onToggle} className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleApplyFilters} className="flex-1 bg-[#1E40AF] hover:bg-[#1D4ED8]">
              Aplicar filtros
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
