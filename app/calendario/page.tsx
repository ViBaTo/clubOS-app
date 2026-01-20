"use client"

import { useState, useEffect, useMemo } from "react"
import { Sidebar } from "@/app/components/layout/sidebar"
import { Navbar } from "@/app/components/layout/navbar"
import { CalendarToolbar } from "@/src/components/calendar/calendar-toolbar"
import { ActiveFiltersBar } from "@/src/components/calendar/active-filters-bar"
import { CalendarFilters } from "@/src/components/calendar/calendar-filters"
import { SearchSuggestions } from "@/src/components/calendar/search-suggestions"
import { EnhancedMonthView } from "@/src/components/calendar/enhanced-month-view"
import { WeekView } from "@/src/components/calendar/week-view"
import { DayView } from "@/src/components/calendar/day-view"
import { EventCard } from "@/src/components/calendar/event-card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import type { CalendarView, CalendarEvent } from "@/src/types/calendar"
import { mockCalendarEvents } from "@/src/data/calendar-mock"
import { useCalendarSearch } from "@/src/hooks/use-calendar-search"
import { useCalendarEvents } from "@/src/hooks/use-calendar-events"

// Set to true to use real API data, false to use mock data
const USE_REAL_API = process.env.NEXT_PUBLIC_USE_REAL_CALENDAR_API === 'true'

const MaterialIcon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
)

export default function CalendarPage() {
  const [view, setView] = useState<CalendarView>({
    tipo: "month",
    fecha: new Date(),
  })

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [localEvents, setLocalEvents] = useState(mockCalendarEvents)

  // Calculate date range for API fetch based on current view
  const dateRange = useMemo(() => {
    const start = new Date(view.fecha)
    const end = new Date(view.fecha)
    
    if (view.tipo === 'month') {
      start.setDate(1)
      start.setMonth(start.getMonth() - 1) // Include previous month for overlap
      end.setMonth(end.getMonth() + 2)
      end.setDate(0)
    } else if (view.tipo === 'week') {
      const day = start.getDay()
      start.setDate(start.getDate() - day)
      end.setDate(end.getDate() + (6 - day) + 7)
    } else {
      start.setDate(start.getDate() - 1)
      end.setDate(end.getDate() + 1)
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    }
  }, [view.fecha, view.tipo])

  // Use the real API hook
  const { 
    events: apiEvents, 
    loading: apiLoading, 
    error: apiError,
    moveEvent: apiMoveEvent,
    refetch: refetchEvents
  } = useCalendarEvents({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    autoFetch: USE_REAL_API
  })

  // Use either API events or local mock events
  const events = USE_REAL_API ? apiEvents : localEvents
  const setEvents = USE_REAL_API 
    ? () => { /* API handles state */ } 
    : setLocalEvents

  const {
    filter,
    searchTerm,
    filteredEvents,
    eventCounts,
    showSuggestions,
    hasActiveFilters,
    activeFiltersCount,
    handleFilterChange,
    handleSearchChange,
    handleSuggestionClick,
    clearFilters,
    setShowSuggestions,
  } = useCalendarSearch({
    events,
  })

  const handlePrevious = () => {
    const newDate = new Date(view.fecha)
    switch (view.tipo) {
      case "month":
        newDate.setMonth(newDate.getMonth() - 1)
        break
      case "week":
        newDate.setDate(newDate.getDate() - 7)
        break
      case "day":
        newDate.setDate(newDate.getDate() - 1)
        break
    }
    setView({ ...view, fecha: newDate })
  }

  const handleNext = () => {
    const newDate = new Date(view.fecha)
    switch (view.tipo) {
      case "month":
        newDate.setMonth(newDate.getMonth() + 1)
        break
      case "week":
        newDate.setDate(newDate.getDate() + 7)
        break
      case "day":
        newDate.setDate(newDate.getDate() + 1)
        break
    }
    setView({ ...view, fecha: newDate })
  }

  const handleToday = () => {
    setView({ ...view, fecha: new Date() })
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
  }

  const handleDateClick = (date: Date) => {
    if (view.tipo !== "day") {
      setView({ tipo: "day", fecha: date })
    }
  }

  const handleTimeSlotClick = (date: Date, hour: string) => {
    // Handle creating new event at specific time
    toast({
      title: "Crear nueva clase",
      description: `${date.toLocaleDateString("es-ES")} a las ${hour}`,
    })
  }

  const handleEventMove = async (event: CalendarEvent, newDate: Date, newHour?: string): Promise<boolean> => {
    try {
      const originalStartDate = new Date(event.fechaInicio)
      const newStartDate = new Date(newDate)

      if (newHour) {
        const [hourNum, minuteNum] = newHour.split(":").map(Number)
        newStartDate.setHours(hourNum, minuteNum, 0, 0)
      } else {
        newStartDate.setHours(
          originalStartDate.getHours(),
          originalStartDate.getMinutes(),
          originalStartDate.getSeconds(),
          originalStartDate.getMilliseconds(),
        )
      }

      const originalDuration = new Date(event.fechaFin).getTime() - new Date(event.fechaInicio).getTime()
      const newEndDate = new Date(newStartDate.getTime() + originalDuration)

      if (USE_REAL_API) {
        // Use API to move event
        const success = await apiMoveEvent(event.id, newStartDate.toISOString(), newEndDate.toISOString())
        if (success) {
          toast({
            title: "Clase movida",
            description: `${event.titulo} ha sido reprogramada correctamente.`,
          })
          return true
        } else {
          throw new Error('Failed to move event')
        }
      } else {
        // Update local mock state
        await new Promise((resolve) => setTimeout(resolve, 500))
        
        const updatedEvents = localEvents.map((e) => {
          if (e.id === event.id) {
            return {
              ...e,
              fechaInicio: newStartDate.toISOString(),
              fechaFin: newEndDate.toISOString(),
            }
          }
          return e
        })

        setLocalEvents(updatedEvents)

        toast({
          title: "Clase movida",
          description: `${event.titulo} ha sido reprogramada correctamente.`,
        })

        return true
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo mover la clase. Inténtalo de nuevo.",
        variant: "destructive",
      })
      return false
    }
  }

  const renderCalendarView = () => {
    const commonProps = {
      currentDate: view.fecha,
      events: filteredEvents,
      onEventClick: handleEventClick,
      onEventMove: handleEventMove, // Added onEventMove prop to all views
    }

    switch (view.tipo) {
      case "month":
        return <EnhancedMonthView {...commonProps} onDateClick={handleDateClick} />
      case "week":
        return <WeekView {...commonProps} onTimeSlotClick={handleTimeSlotClick} />
      case "day":
        return <DayView {...commonProps} onTimeSlotClick={handleTimeSlotClick} />
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen bg-[#F1F5F9]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Calendar Toolbar */}
          <div className="relative">
            <CalendarToolbar
              view={view}
              onViewChange={setView}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onToday={handleToday}
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              activeFilters={activeFiltersCount}
              onFiltersClick={() => setShowFilters((prev) => !prev)}
            />

            {/* Search Suggestions */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-full max-w-md z-50">
              <SearchSuggestions
                searchTerm={searchTerm}
                events={events}
                onSuggestionClick={handleSuggestionClick}
                isVisible={showSuggestions}
              />
            </div>

            {/* Filters Popover */}
            <CalendarFilters
              filter={filter}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
              isOpen={showFilters}
              onToggle={setShowFilters}
              eventCounts={eventCounts}
            />
          </div>

          {/* Active Filters Bar */}
          {hasActiveFilters && (
            <ActiveFiltersBar
              filter={filter}
              onFilterChange={handleFilterChange}
              onClearAll={clearFilters}
              totalResults={filteredEvents.length}
            />
          )}

          {/* Calendar Content */}
          <div className="flex-1 overflow-hidden">{renderCalendarView()}</div>
        </div>
      </div>

      {/* Event Details Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#0F172A] flex items-center gap-3">
              <MaterialIcon name="event" className="text-2xl text-[#1E40AF]" />
              Detalles de la clase
            </DialogTitle>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-6">
              <EventCard event={selectedEvent} />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[#6B7280]">Fecha:</span>
                  <p className="text-[#0F172A] font-medium">
                    {new Date(selectedEvent.fechaInicio).toLocaleDateString("es-ES", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <div>
                  <span className="text-[#6B7280]">Hora:</span>
                  <p className="text-[#0F172A] font-medium">
                    {new Date(selectedEvent.fechaInicio).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}{" "}
                    -{" "}
                    {new Date(selectedEvent.fechaFin).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </p>
                </div>

                <div>
                  <span className="text-[#6B7280]">Instructor:</span>
                  <p className="text-[#0F172A] font-medium">{selectedEvent.instructor.nombre}</p>
                </div>

                <div>
                  <span className="text-[#6B7280]">Pista:</span>
                  <p className="text-[#0F172A] font-medium">{selectedEvent.pista.nombre}</p>
                </div>

                {selectedEvent.cliente && (
                  <div>
                    <span className="text-[#6B7280]">Cliente:</span>
                    <p className="text-[#0F172A] font-medium">{selectedEvent.cliente.nombre}</p>
                  </div>
                )}

                {selectedEvent.clientes && selectedEvent.clientes.length > 0 && (
                  <div>
                    <span className="text-[#6B7280]">Clientes:</span>
                    <p className="text-[#0F172A] font-medium">
                      {selectedEvent.clientes.map((c) => c.nombre).join(", ")}
                    </p>
                  </div>
                )}

                {selectedEvent.precio && (
                  <div>
                    <span className="text-[#6B7280]">Precio:</span>
                    <p className="text-[#0F172A] font-medium">€{selectedEvent.precio}</p>
                  </div>
                )}
              </div>

              {selectedEvent.descripcion && (
                <div>
                  <span className="text-[#6B7280]">Descripción:</span>
                  <p className="text-[#0F172A] mt-1">{selectedEvent.descripcion}</p>
                </div>
              )}

              {selectedEvent.notas && (
                <div>
                  <span className="text-[#6B7280]">Notas:</span>
                  <p className="text-[#0F172A] mt-1">{selectedEvent.notas}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-[#E5E7EB]">
                <Button
                  className="bg-[#1E40AF] hover:bg-[#1D4ED8] text-white"
                  onClick={() => {
                    toast({
                      title: "Editar clase",
                      description: "Función de edición en desarrollo",
                    })
                  }}
                >
                  <MaterialIcon name="edit" className="text-lg mr-2" />
                  Editar
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "Cancelar clase",
                      description: "Función de cancelación en desarrollo",
                    })
                  }}
                >
                  <MaterialIcon name="cancel" className="text-lg mr-2" />
                  Cancelar
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "Duplicar clase",
                      description: "Función de duplicación en desarrollo",
                    })
                  }}
                >
                  <MaterialIcon name="content_copy" className="text-lg mr-2" />
                  Duplicar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
