"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CalendarEvent } from "@/src/types/calendar"
import { mockInstructors, mockCourts, mockClients } from "@/src/data/calendar-mock"

const MaterialIcon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={cn("material-symbols-outlined", className)}>{name}</span>
)

interface SearchSuggestionsProps {
  searchTerm: string
  events: CalendarEvent[]
  onSuggestionClick: (suggestion: string) => void
  isVisible: boolean
}

interface Suggestion {
  type: "instructor" | "client" | "court" | "event" | "class_type"
  value: string
  label: string
  icon: string
  count?: number
}

export function SearchSuggestions({ searchTerm, events, onSuggestionClick, isVisible }: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setSuggestions([])
      return
    }

    const term = searchTerm.toLowerCase()
    const newSuggestions: Suggestion[] = []

    // Instructor suggestions
    mockInstructors
      .filter((instructor) => instructor.nombre.toLowerCase().includes(term))
      .forEach((instructor) => {
        const count = events.filter((e) => e.instructor.id === instructor.id).length
        newSuggestions.push({
          type: "instructor",
          value: instructor.nombre,
          label: instructor.nombre,
          icon: "person",
          count,
        })
      })

    // Client suggestions
    const allClients = [...mockClients]
    events.forEach((event) => {
      if (event.cliente && !allClients.find((c) => c.id === event.cliente!.id)) {
        allClients.push(event.cliente)
      }
      if (event.clientes) {
        event.clientes.forEach((client) => {
          if (!allClients.find((c) => c.id === client.id)) {
            allClients.push(client)
          }
        })
      }
    })

    allClients
      .filter((client) => client.nombre.toLowerCase().includes(term))
      .forEach((client) => {
        const count = events.filter(
          (e) => e.cliente?.id === client.id || e.clientes?.some((c) => c.id === client.id),
        ).length
        if (count > 0) {
          newSuggestions.push({
            type: "client",
            value: client.nombre,
            label: client.nombre,
            icon: "person_outline",
            count,
          })
        }
      })

    // Court suggestions
    mockCourts
      .filter((court) => court.nombre.toLowerCase().includes(term))
      .forEach((court) => {
        const count = events.filter((e) => e.pista.id === court.id).length
        newSuggestions.push({
          type: "court",
          value: court.nombre,
          label: `${court.nombre} (${court.tipo})`,
          icon: "location_on",
          count,
        })
      })

    // Class type suggestions
    const classTypes = ["Clase particular", "Grupal", "Academia"]
    classTypes
      .filter((type) => type.toLowerCase().includes(term))
      .forEach((type) => {
        const count = events.filter((e) => e.tipoClase === type).length
        newSuggestions.push({
          type: "class_type",
          value: type,
          label: type,
          icon: "school",
          count,
        })
      })

    // Event title suggestions
    const uniqueTitles = [...new Set(events.map((e) => e.titulo))]
    uniqueTitles
      .filter((title) => title.toLowerCase().includes(term))
      .slice(0, 5) // Limit to 5 event suggestions
      .forEach((title) => {
        const count = events.filter((e) => e.titulo === title).length
        newSuggestions.push({
          type: "event",
          value: title,
          label: title,
          icon: "event",
          count,
        })
      })

    // Sort by relevance (exact matches first, then by count)
    newSuggestions.sort((a, b) => {
      const aExact = a.label.toLowerCase().startsWith(term) ? 1 : 0
      const bExact = b.label.toLowerCase().startsWith(term) ? 1 : 0
      if (aExact !== bExact) return bExact - aExact
      return (b.count || 0) - (a.count || 0)
    })

    setSuggestions(newSuggestions.slice(0, 8)) // Limit to 8 suggestions
  }, [searchTerm, events])

  if (!isVisible || suggestions.length === 0) return null

  return (
    <div className="absolute top-full left-0 right-0 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-50 mt-1">
      <div className="p-2">
        <div className="text-xs text-[#6B7280] px-2 py-1 mb-1">Sugerencias</div>
        {suggestions.map((suggestion, index) => (
          <Button
            key={`${suggestion.type}-${suggestion.value}-${index}`}
            variant="ghost"
            size="sm"
            onClick={() => onSuggestionClick(suggestion.value)}
            className="w-full justify-start text-left h-auto p-2 hover:bg-[#F9FAFB]"
          >
            <MaterialIcon name={suggestion.icon} className="text-lg mr-2 text-[#6B7280]" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-[#0F172A] truncate">{suggestion.label}</div>
              {suggestion.count !== undefined && (
                <div className="text-xs text-[#6B7280]">
                  {suggestion.count} {suggestion.count === 1 ? "resultado" : "resultados"}
                </div>
              )}
            </div>
          </Button>
        ))}
      </div>
    </div>
  )
}
