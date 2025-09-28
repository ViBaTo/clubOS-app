"use client"

import { useState } from "react"
import { Sidebar } from "@/src/components/layout/sidebar"
import { Navbar } from "@/src/components/layout/navbar"
import { CalendarToolbar } from "@/src/components/calendar/calendar-toolbar"
import { QuickFilters } from "@/src/components/calendar/quick-filters"
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
  const [events, setEvents] = useState(mockCalendarEvents)

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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Update event in local state
      const updatedEvents = events.map((e) => {
        if (e.id === event.id) {
          const newStartDate = new Date(newDate)
          if (newHour) {
            const [hourNum, minuteNum] = newHour.split(":").map(Number)
            newStartDate.setHours(hourNum, minuteNum, 0, 0)
          }

          const originalDuration = new Date(e.fechaFin).getTime() - new Date(e.fechaInicio).getTime()
          const newEndDate = new Date(newStartDate.getTime() + originalDuration)

          return {
            ...e,
            fechaInicio: newStartDate.toISOString(),
            fechaFin: newEndDate.toISOString(),
          }
        }
        return e
      })

      setEvents(updatedEvents)

      toast({
        title: "Clase movida",
        description: `${event.titulo} ha sido reprogramada correctamente.`,
      })

      return true
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
              onFiltersClick={() => setShowFilters(!showFilters)}
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
              onToggle={() => setShowFilters(!showFilters)}
            />
          </div>

          {/* Quick Filters */}
          <QuickFilters filter={filter} onFilterChange={handleFilterChange} eventCounts={eventCounts} />

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
