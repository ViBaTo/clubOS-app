"use client"

import { useState, useCallback } from "react"
import type { CalendarEvent } from "@/src/types/calendar"
import { hasTimeConflict } from "@/src/utils/calendar-helpers"

interface DragDropState {
  isDragging: boolean
  draggedEvent: CalendarEvent | null
  dropZone: {
    date: Date
    hour?: string
    isValid: boolean
  } | null
  conflicts: CalendarEvent[]
}

interface UseDragDropProps {
  events: CalendarEvent[]
  onEventMove: (event: CalendarEvent, newDate: Date, newHour?: string) => Promise<boolean>
}

export function useDragDrop({ events, onEventMove }: UseDragDropProps) {
  const [dragState, setDragState] = useState<DragDropState>({
    isDragging: false,
    draggedEvent: null,
    dropZone: null,
    conflicts: [],
  })

  const startDrag = useCallback((event: CalendarEvent) => {
    setDragState({
      isDragging: true,
      draggedEvent: event,
      dropZone: null,
      conflicts: [],
    })
  }, [])

  const endDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedEvent: null,
      dropZone: null,
      conflicts: [],
    })
  }, [])

  const updateDropZone = useCallback(
    (date: Date, hour?: string) => {
      if (!dragState.draggedEvent) return

      // Create a temporary event with new date/time to check conflicts
      const newStartDate = new Date(date)
      if (hour) {
        const [hourNum, minuteNum] = hour.split(":").map(Number)
        newStartDate.setHours(hourNum, minuteNum, 0, 0)
      }

      const originalDuration =
        new Date(dragState.draggedEvent.fechaFin).getTime() - new Date(dragState.draggedEvent.fechaInicio).getTime()
      const newEndDate = new Date(newStartDate.getTime() + originalDuration)

      const tempEvent: CalendarEvent = {
        ...dragState.draggedEvent,
        fechaInicio: newStartDate.toISOString(),
        fechaFin: newEndDate.toISOString(),
      }

      // Check for conflicts with other events (excluding the dragged event)
      const conflicts = events
        .filter((e) => e.id !== dragState.draggedEvent!.id)
        .filter((e) => hasTimeConflict(tempEvent, e))

      const isValid = conflicts.length === 0

      setDragState((prev) => ({
        ...prev,
        dropZone: {
          date,
          hour,
          isValid,
        },
        conflicts,
      }))
    },
    [dragState.draggedEvent, events],
  )

  const executeDrop = useCallback(async () => {
    if (!dragState.draggedEvent || !dragState.dropZone) return false

    try {
      const success = await onEventMove(dragState.draggedEvent, dragState.dropZone.date, dragState.dropZone.hour)
      if (success) {
        endDrag()
      }
      return success
    } catch (error) {
      console.error("Error moving event:", error)
      return false
    }
  }, [dragState.draggedEvent, dragState.dropZone, onEventMove, endDrag])

  return {
    dragState,
    startDrag,
    endDrag,
    updateDropZone,
    executeDrop,
  }
}
