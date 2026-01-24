"use client"

import type React from "react"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { CalendarEvent } from "@/src/types/calendar"
import { getDaysInMonth, getStartOfWeek, isSameDay, getEventsForDate } from "@/src/utils/calendar-helpers"

interface MonthViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onDateClick: (date: Date) => void
  onEventDragStart: (event: CalendarEvent, e: React.DragEvent) => void
}

export function MonthView({ currentDate, events, onEventClick, onDateClick, onEventDragStart }: MonthViewProps) {
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null)

  const today = new Date()
  const daysInMonth = getDaysInMonth(currentDate)
  const firstDayOfMonth = daysInMonth[0]
  const startOfCalendar = getStartOfWeek(firstDayOfMonth)

  // Generate calendar grid (6 weeks)
  const calendarDays: Date[] = []
  const current = new Date(startOfCalendar)

  for (let i = 0; i < 42; i++) {
    calendarDays.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

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

  const handleDrop = (date: Date, e: React.DragEvent) => {
    e.preventDefault()
    // Handle drop logic will be implemented in drag & drop task
    setDraggedEvent(null)
  }

  return (
    <div className="flex-1 bg-white">
      {/* Header with weekdays */}
      <div className="grid grid-cols-7 border-b border-[#E5E7EB]">
        {weekDays.map((day) => (
          <div key={day} className="p-4 text-center text-sm font-medium text-[#6B7280] bg-[#F9FAFB]">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 flex-1">
        {calendarDays.map((date, index) => {
          const dayEvents = getEventsForDate(events, date)
          const isToday = isSameDay(date, today)
          const isCurrentMonth = date.getMonth() === currentDate.getMonth()
          const isWeekend = date.getDay() === 0 || date.getDay() === 6

          return (
            <div
              key={index}
              className={cn(
                "min-h-[120px] border-r border-b border-[#E5E7EB] p-2 cursor-pointer transition-colors hover:bg-[#F9FAFB]",
                !isCurrentMonth && "bg-[#F9FAFB]/50 text-[#9CA3AF]",
                isWeekend && "bg-[#F8FAFC]",
              )}
              onClick={() => onDateClick(date)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(date, e)}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={cn(
                    "text-sm font-medium",
                    isToday && "bg-[#1E40AF] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs",
                    !isCurrentMonth && "text-[#9CA3AF]",
                    isCurrentMonth && !isToday && "text-[#374151]",
                  )}
                >
                  {date.getDate()}
                </span>

                {dayEvents.length > 3 && (
                  <span className="text-xs text-[#6B7280] bg-[#F3F4F6] px-2 py-1 rounded-full">
                    +{dayEvents.length - 3}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "text-xs p-1.5 rounded-md cursor-pointer transition-all hover:shadow-sm",
                      draggedEvent?.id === event.id && "opacity-50",
                    )}
                    style={{
                      backgroundColor: `${event.color}15`,
                      borderLeft: `3px solid ${event.color}`,
                      color: event.color,
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventClick(event)
                    }}
                    draggable
                    onDragStart={(e) => handleDragStart(event, e)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="font-medium truncate">{event.titulo}</div>
                    <div className="text-[#6B7280] truncate">
                      {new Date(event.fechaInicio).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
