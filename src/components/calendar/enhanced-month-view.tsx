"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import type { CalendarEvent } from "@/src/types/calendar"
import { getDaysInMonth, getEventsForDate, getStartOfWeek, isSameDay } from "@/src/utils/calendar-helpers"
import { useDragDrop } from "@/src/hooks/use-drag-drop"
import { DragDropOverlay } from "./drag-drop-overlay"
import { DropZoneIndicator } from "./drop-zone-indicator"
import { GhostEvent } from "./ghost-event"

interface EnhancedMonthViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onDateClick: (date: Date) => void
  onEventMove: (event: CalendarEvent, newDate: Date, newHour?: string) => Promise<boolean>
  onMonthChange?: (date: Date) => void
}

type TransitionPhase = "idle" | "start" | "moving"

export function EnhancedMonthView({
  currentDate,
  events,
  onEventClick,
  onDateClick,
  onEventMove,
  onMonthChange,
}: EnhancedMonthViewProps) {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const { dragState, startDrag, endDrag, updateDropZone, executeDrop } = useDragDrop({
    events,
    onEventMove,
  })

  const [displayedDate, setDisplayedDate] = useState(currentDate)
  const [transitionState, setTransitionState] = useState<{
    direction: "next" | "prev"
    targetDate: Date
  } | null>(null)
  const [transitionPhase, setTransitionPhase] = useState<TransitionPhase>("idle")

  const animationFrameRef = useRef<number | null>(null)
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollDeltaRef = useRef(0)
  const lastScrollTimeRef = useRef(0)

  const animationDuration = 320

  useEffect(() => {
    const isSameMonth =
      currentDate.getFullYear() === displayedDate.getFullYear() && currentDate.getMonth() === displayedDate.getMonth()

    if (isSameMonth) {
      return
    }

    const direction: "next" | "prev" = currentDate.getTime() > displayedDate.getTime() ? "next" : "prev"

    setTransitionState({ direction, targetDate: currentDate })
    setTransitionPhase("start")

    const frame = requestAnimationFrame(() => {
      setTransitionPhase("moving")
    })
    animationFrameRef.current = frame

    const timeout = window.setTimeout(() => {
      setDisplayedDate(currentDate)
      setTransitionState(null)
      setTransitionPhase("idle")
      scrollDeltaRef.current = 0
      animationFrameRef.current = null
      animationTimeoutRef.current = null
    }, animationDuration)
    animationTimeoutRef.current = timeout

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timeout)
    }
  }, [currentDate, displayedDate, animationDuration])

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
    }
  }, [])

  const today = new Date()
  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

  const handleDragStart = (event: CalendarEvent, e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", event.id)
    startDrag(event)
  }

  const handleDragEnd = () => {
    if (showConfirmation) return
    endDrag()
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDragEnter = (date: Date, e: React.DragEvent) => {
    e.preventDefault()
    if (dragState.isDragging) {
      updateDropZone(date)
    }
  }

  const handleDrop = (date: Date, e: React.DragEvent) => {
    e.preventDefault()
    if (dragState.isDragging && dragState.dropZone) {
      setShowConfirmation(true)
    }
  }

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!onMonthChange) return
    if (transitionPhase !== "idle") {
      event.preventDefault()
      return
    }

    const now = Date.now()
    const throttleMs = 300

    if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return

    scrollDeltaRef.current += event.deltaY

    const threshold = 80

    if (scrollDeltaRef.current > threshold && now - lastScrollTimeRef.current >= throttleMs) {
      event.preventDefault()
      const nextMonth = new Date(currentDate)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      onMonthChange(nextMonth)
      lastScrollTimeRef.current = now
      scrollDeltaRef.current = 0
    } else if (scrollDeltaRef.current < -threshold && now - lastScrollTimeRef.current >= throttleMs) {
      event.preventDefault()
      const previousMonth = new Date(currentDate)
      previousMonth.setMonth(previousMonth.getMonth() - 1)
      onMonthChange(previousMonth)
      lastScrollTimeRef.current = now
      scrollDeltaRef.current = 0
    }
  }

  const renderMonthContent = (monthDate: Date) => {
    const daysInMonth = getDaysInMonth(monthDate)
    const firstDayOfMonth = daysInMonth[0]
    const startOfCalendar = getStartOfWeek(firstDayOfMonth)

    const calendarDays: Date[] = []
    const cursor = new Date(startOfCalendar)

    for (let i = 0; i < 42; i++) {
      calendarDays.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }

    const monthCells = calendarDays.map((date, index) => {
      const dayEvents = getEventsForDate(events, date)
      const isToday = isSameDay(date, today)
      const isCurrentMonth =
        date.getMonth() === monthDate.getMonth() && date.getFullYear() === monthDate.getFullYear()
      const isWeekend = date.getDay() === 0 || date.getDay() === 6

      const isDropZone = dragState.dropZone && isSameDay(dragState.dropZone.date, date)
      const isValidDropZone = isDropZone && dragState.dropZone?.isValid

      return (
        <div
          key={`${monthDate.getFullYear()}-${monthDate.getMonth()}-${index}`}
          className={cn(
            "relative min-h-[120px] border-r border-b border-[#E5E7EB] p-2 cursor-pointer transition-colors hover:bg-[#F9FAFB]",
            !isCurrentMonth && "bg-[#F9FAFB]/50 text-[#9CA3AF]",
            isWeekend && "bg-[#F8FAFC]",
            dragState.isDragging && "transition-all duration-200",
          )}
          onClick={() => onDateClick(date)}
          onDragOver={handleDragOver}
          onDragEnter={(e) => handleDragEnter(date, e)}
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

          <div className="space-y-1 relative">
            {dayEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className={cn(
                  "text-xs p-1.5 rounded-md cursor-pointer transition-all hover:shadow-sm",
                  dragState.draggedEvent?.id === event.id && "opacity-30",
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

            {dragState.isDragging && isDropZone && dragState.draggedEvent && (
              <GhostEvent event={dragState.draggedEvent} newDate={date} isValid={isValidDropZone || false} />
            )}
          </div>

          <DropZoneIndicator isActive={(dragState.isDragging && isDropZone) || false} isValid={isValidDropZone || false} />
        </div>
      )
    })

    return (
      <>
        <div className="grid grid-cols-7 border-b border-[#E5E7EB]">
          {weekDays.map((day) => (
            <div key={day} className="p-4 text-center text-sm font-medium text-[#6B7280] bg-[#F9FAFB]">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 flex-1">{monthCells}</div>
      </>
    )
  }

  const handleConfirmMove = async () => {
    const success = await executeDrop()
    setShowConfirmation(false)
    if (!success) {
      console.error("Failed to move event")
    }
  }

  const handleCancelMove = () => {
    setShowConfirmation(false)
    endDrag()
  }

  const baseTransformClass =
    transitionState && transitionPhase === "moving"
      ? transitionState.direction === "next"
        ? "-translate-y-full"
        : "translate-y-full"
      : "translate-y-0"

  const overlayTransformClass = transitionState
    ? transitionPhase === "moving"
      ? "translate-y-0"
      : transitionState.direction === "next"
        ? "translate-y-full"
        : "-translate-y-full"
    : null

  return (
    <>
      <div className="relative flex-1 h-full bg-white overflow-hidden" onWheel={handleWheel}>
        <div
          className={cn(
            "flex flex-col h-full transition-transform duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            baseTransformClass,
          )}
        >
          {renderMonthContent(displayedDate)}
        </div>

        {transitionState && overlayTransformClass && (
          <div
            className={cn(
              "pointer-events-none absolute inset-0 flex flex-col transition-transform duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
              overlayTransformClass,
            )}
          >
            <div className="pointer-events-auto flex flex-col h-full">{renderMonthContent(transitionState.targetDate)}</div>
          </div>
        )}
      </div>

      {showConfirmation && dragState.draggedEvent && dragState.dropZone && (
        <DragDropOverlay
          draggedEvent={dragState.draggedEvent}
          dropZone={dragState.dropZone}
          conflicts={dragState.conflicts}
          onConfirm={handleConfirmMove}
          onCancel={handleCancelMove}
        />
      )}
    </>
  )
}
