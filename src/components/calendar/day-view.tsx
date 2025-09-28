"use client"

import type React from "react"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { CalendarEvent } from "@/src/types/calendar"
import { getHourSlots, getEventsForDate, formatTime } from "@/src/utils/calendar-helpers"

interface DayViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onTimeSlotClick: (date: Date, hour: string) => void
  onEventDragStart: (event: CalendarEvent, e: React.DragEvent) => void
}

export function DayView({ currentDate, events, onEventClick, onTimeSlotClick, onEventDragStart }: DayViewProps) {
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null)

  const hourSlots = getHourSlots(8, 22) // 8 AM to 10 PM
  const dayEvents = getEventsForDate(events, currentDate)

  const handleDragStart = (event: CalendarEvent, e: React.DragEvent) => {
    setDraggedEvent(event)
    onEventDragStart(event, e)
  }

  const handleDragEnd = () => {
    setDraggedEvent(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (hour: string, e: React.DragEvent) => {
    e.preventDefault()
    // Handle drop logic will be implemented in drag & drop task
    setDraggedEvent(null)
  }

  const getEventsForHour = (hour: string) => {
    const [hourNum] = hour.split(":").map(Number)
    return dayEvents.filter((event) => {
      const eventDate = new Date(event.fechaInicio)
      const eventHour = eventDate.getHours()
      const eventMinute = eventDate.getMinutes()

      return eventHour === hourNum && (eventMinute === 0 || eventMinute === 30)
    })
  }

  const getEventPosition = (event: CalendarEvent) => {
    const startDate = new Date(event.fechaInicio)
    const endDate = new Date(event.fechaFin)
    const startMinutes = startDate.getHours() * 60 + startDate.getMinutes()
    const endMinutes = endDate.getHours() * 60 + endDate.getMinutes()
    const duration = endMinutes - startMinutes

    // Each hour slot is 80px, so calculate proportional height
    const height = Math.max((duration / 60) * 80, 40) // Minimum 40px height

    return { height }
  }

  return (
    <div className="flex-1 bg-white">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] bg-[#F9FAFB] p-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-[#0F172A]">
            {currentDate.toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h2>
          <p className="text-sm text-[#6B7280] mt-1">
            {dayEvents.length} {dayEvents.length === 1 ? "clase programada" : "clases programadas"}
          </p>
        </div>
      </div>

      {/* Time slots and events */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {hourSlots.map((hour) => {
            const hourEvents = getEventsForHour(hour)

            return (
              <div key={hour} className="flex border-b border-[#E5E7EB] min-h-[80px]">
                {/* Time column */}
                <div className="w-20 p-4 text-right border-r border-[#E5E7EB] bg-[#F9FAFB]">
                  <span className="text-sm font-medium text-[#6B7280]">{hour}</span>
                </div>

                {/* Events column */}
                <div
                  className="flex-1 p-4 cursor-pointer hover:bg-[#F9FAFB] transition-colors relative"
                  onClick={() => onTimeSlotClick(currentDate, hour)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(hour, e)}
                >
                  {hourEvents.length === 0 ? (
                    <div className="text-sm text-[#9CA3AF] italic">Disponible</div>
                  ) : (
                    <div className="space-y-2">
                      {hourEvents.map((event) => {
                        const { height } = getEventPosition(event)

                        return (
                          <div
                            key={event.id}
                            className={cn(
                              "rounded-lg p-4 cursor-pointer transition-all hover:shadow-md",
                              draggedEvent?.id === event.id && "opacity-50",
                            )}
                            style={{
                              backgroundColor: `${event.color}10`,
                              borderLeft: `6px solid ${event.color}`,
                              minHeight: `${height}px`,
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              onEventClick(event)
                            }}
                            draggable
                            onDragStart={(e) => handleDragStart(event, e)}
                            onDragEnd={handleDragEnd}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-[#0F172A] mb-1">{event.titulo}</h3>

                                <div className="flex items-center gap-4 text-sm text-[#6B7280] mb-2">
                                  <span>
                                    {formatTime(new Date(event.fechaInicio))} - {formatTime(new Date(event.fechaFin))}
                                  </span>
                                  <span>•</span>
                                  <span>{event.pista.nombre}</span>
                                  <span>•</span>
                                  <span>{event.instructor.nombre}</span>
                                </div>

                                {event.descripcion && <p className="text-sm text-[#6B7280]">{event.descripcion}</p>}
                              </div>

                              <div className="flex flex-col items-end gap-2">
                                <div
                                  className="px-2 py-1 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: event.color,
                                    color: "white",
                                  }}
                                >
                                  {event.tipoClase}
                                </div>

                                {event.precio && (
                                  <span className="text-sm font-medium text-[#059669]">€{event.precio}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
