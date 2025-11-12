"use client"

import { useState, useEffect, useMemo } from "react"
import type { CalendarEvent, CalendarFilter } from "@/src/types/calendar"
import { filterEvents } from "@/src/utils/calendar-helpers"
import { mockCourts } from "@/src/data/calendar-mock"

interface UseCalendarSearchProps {
  events: CalendarEvent[]
  initialFilter?: CalendarFilter
}

export function useCalendarSearch({ events, initialFilter }: UseCalendarSearchProps) {
  const [filter, setFilter] = useState<CalendarFilter>(
    initialFilter || {
      instructores: [],
      tiposClase: [],
      pistas: [],
      estados: [],
      busqueda: "",
    },
  )

  const [searchTerm, setSearchTerm] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Update filter when search term changes
  useEffect(() => {
    setFilter((prev) => ({
      ...prev,
      busqueda: searchTerm,
    }))
  }, [searchTerm])

  // Filter events based on current filter
  const filteredEvents = useMemo(() => {
    return filterEvents(events, filter)
  }, [events, filter])

  // Calculate event counts for quick filters
  const eventCounts = useMemo(() => {
    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]

    const startOfWeek = new Date(today)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
    startOfWeek.setDate(diff)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    // Adding court counts for quick filters
    const courtCounts = mockCourts.reduce(
      (acc, court) => {
        acc[court.id] = events.filter((event) => event.pista.id === court.id).length
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      today: events.filter((event) => {
        const eventDate = new Date(event.fechaInicio).toISOString().split("T")[0]
        return eventDate === todayStr
      }).length,
      thisWeek: events.filter((event) => {
        const eventDate = new Date(event.fechaInicio)
        return eventDate >= startOfWeek && eventDate <= endOfWeek
      }).length,
      pending: events.filter((event) => event.estado === "Pendiente").length,
      confirmed: events.filter((event) => event.estado === "Confirmada").length,
      // Adding court counts to return object
      courts: courtCounts,
    }
  }, [events])

  const handleFilterChange = (newFilter: CalendarFilter) => {
    setFilter(newFilter)
    if (newFilter.busqueda !== searchTerm) {
      setSearchTerm(newFilter.busqueda || "")
    }
  }

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setShowSuggestions(term.length >= 2)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion)
    setShowSuggestions(false)
  }

  const clearFilters = () => {
    const clearedFilter: CalendarFilter = {
      instructores: [],
      tiposClase: [],
      pistas: [],
      estados: [],
      busqueda: "",
    }
    setFilter(clearedFilter)
    setSearchTerm("")
    setShowSuggestions(false)
  }

  const hasActiveFilters = () => {
    return (
      filter.instructores.length > 0 ||
      filter.tiposClase.length > 0 ||
      filter.pistas.length > 0 ||
      filter.estados.length > 0 ||
      filter.fechaInicio ||
      filter.fechaFin ||
      filter.busqueda
    )
  }

  const getActiveFiltersCount = () => {
    return (
      filter.instructores.length +
      filter.tiposClase.length +
      filter.pistas.length +
      filter.estados.length +
      (filter.fechaInicio ? 1 : 0) +
      (filter.fechaFin ? 1 : 0) +
      (filter.busqueda ? 1 : 0)
    )
  }

  return {
    filter,
    searchTerm,
    filteredEvents,
    eventCounts,
    showSuggestions,
    hasActiveFilters: hasActiveFilters(),
    activeFiltersCount: getActiveFiltersCount(),
    handleFilterChange,
    handleSearchChange,
    handleSuggestionClick,
    clearFilters,
    setShowSuggestions,
  }
}
