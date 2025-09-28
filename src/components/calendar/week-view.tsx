"use client"

import type React from "react"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { CalendarEvent } from "@/src/types/calendar"
import { getWeekDays, getHourSlots, isSameDay, formatTime } from "@/src/utils/calendar-helpers"

interface WeekViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onTimeSlotClick: (date: Date, hour: string) => void
  onEventDragStart: (event: CalendarEvent, e: React.DragEvent) => void
}

export function WeekView({ currentDate, events, onEventClick, onTimeSlotClick, onEventDragStart }: WeekViewProps) {
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null)

  const today = new Date()
  const weekDays = getWeekDays(currentDate)
  const hourSlots = getHourSlots(8, 22) // 8 AM to 10 PM

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

  const handleDrop = (date: Date, hour: string, e: React.DragEvent) => {
    e.preventDefault()
    // Handle drop logic will be implemented in drag & drop task
    setDraggedEvent(null)
  }

  const getEventsForDayAndHour = (date: Date, hour: string) => {
    const [hourNum] = hour.split(":").map(Number)
    return events.filter((event) => {
      const eventDate = new Date(event.fechaInicio)
      const eventHour = eventDate.getHours()
      const eventMinute = eventDate.getMinutes()

      return isSameDay(eventDate, date) && eventHour === hourNum && (eventMinute === 0 || eventMinute === 30)
    })
  }

  const getEventPosition = (event: CalendarEvent) => {
    const startDate = new Date(event.fechaInicio)
    const endDate = new Date(event.fechaFin)
    const startMinutes = startDate.getHours() * 60 + startDate.getMinutes()
    const endMinutes = endDate.getHours() * 60 + endDate.getMinutes()
    const duration = endMinutes - startMinutes

    // Each hour slot is 60px, so 1 minute = 1px
    const top = ((startMinutes - 8 * 60) / 30) * 30 // Align to 30-minute slots
    const height = Math.max(duration, 30) // Minimum 30 minutes height

    return { top, height }
  }

  return (
    <div className="flex-1 bg-white overflow-hidden">
      {/* Header with days */}
      <div className="grid grid-cols-8 border-b border-[#E5E7EB] bg-[#F9FAFB]">
        <div className="p-4 border-r border-[#E5E7EB]"></div>
        {weekDays.map((date, index) => {
          const isToday = isSameDay(date, today)
          return (
            <div key={index} className={cn("p-4 text-center border-r border-[#E5E7EB]", isToday && "bg-[#1E40AF]/5")}>
              <div className="text-sm font-medium text-[#6B7280]">
                {date.toLocaleDateString("es-ES", { weekday: "short" })}
              </div>
              <div
                className={cn(
                  "text-lg font-semibold mt-1",
                  isToday
                    ? "bg-[#1E40AF] text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto"
                    : "text-[#374151]",
                )}
              >
                {date.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Time slots and events */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-8 relative">
          {/* Time column */}
          <div className="border-r border-[#E5E7EB]">
            {hourSlots.map((hour) => (
              <div key={hour} className="h-[60px] border-b border-[#E5E7EB] p-2 text-right">
                <span className="text-sm text-[#6B7280]">{hour}</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((date, dayIndex) => (
            <div key={dayIndex} className="border-r border-[#E5E7EB] relative">
              {hourSlots.map((hour) => (
                <div
                  key={hour}
                  className="h-[60px] border-b border-[#E5E7EB] cursor-pointer hover:bg-[#F9FAFB] transition-colors relative"
                  onClick={() => onTimeSlotClick(date, hour)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(date, hour, e)}
                >
                  {/* Events positioned absolutely */}
                  {getEventsForDayAndHour(date, hour).map((event) => {
                    const { top, height } = getEventPosition(event)
                    return (
                      <div
                        key={event.id}
                        className={cn(
                          "absolute left-1 right-1 rounded-lg p-2 cursor-pointer transition-all hover:shadow-md z-10",
                          draggedEvent?.id === event.id && "opacity-50",
                        )}
                        style={{
                          backgroundColor: `${event.color}15`,
                          borderLeft: `4px solid ${event.color}`,
                          color: event.color,
                          height: `${Math.min(height, 60)}px`,
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEventClick(event)
                        }}
                        draggable
                        onDragStart={(e) => handleDragStart(event, e)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="text-xs font-medium truncate">{event.titulo}</div>
                        <div className="text-xs opacity-75 truncate">{formatTime(new Date(event.fechaInicio))}</div>
                        <div className="text-xs opacity-75 truncate">{event.pista.nombre}</div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
