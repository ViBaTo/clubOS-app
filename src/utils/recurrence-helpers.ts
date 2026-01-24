import type { EventRecurrence, CalendarEventDB, RecurrenceFrequency } from '@/src/types/calendar'

/**
 * Generate occurrence dates based on recurrence pattern
 */
export function generateRecurrenceOccurrences(
  startDate: Date,
  recurrence: EventRecurrence,
  maxOccurrences = 52 // Default to 1 year of weekly events
): Date[] {
  const occurrences: Date[] = []
  const currentDate = new Date(startDate)
  const endDate = recurrence.end_date ? new Date(recurrence.end_date) : null
  const maxCount = recurrence.occurrences || maxOccurrences
  const exceptions = new Set(recurrence.exceptions || [])

  let count = 0
  const maxIterations = 365 // Safety limit

  for (let i = 0; i < maxIterations && count < maxCount; i++) {
    // Check if current date exceeds end date
    if (endDate && currentDate > endDate) {
      break
    }

    // Check if this date is in the exceptions list
    const dateStr = currentDate.toISOString().split('T')[0]
    if (!exceptions.has(dateStr)) {
      // For weekly recurrence, check if the day matches
      if (recurrence.frequency === 'weekly') {
        const dayOfWeek = currentDate.getDay()
        if (recurrence.days_of_week.length === 0 || recurrence.days_of_week.includes(dayOfWeek)) {
          occurrences.push(new Date(currentDate))
          count++
        }
      } else {
        occurrences.push(new Date(currentDate))
        count++
      }
    }

    // Move to next interval
    switch (recurrence.frequency) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + recurrence.interval_value)
        break
      case 'weekly':
        // If specific days are set, move day by day within the week
        if (recurrence.days_of_week.length > 0) {
          currentDate.setDate(currentDate.getDate() + 1)
          // Skip to next week after completing current week
          if (currentDate.getDay() === 0 && recurrence.interval_value > 1) {
            currentDate.setDate(currentDate.getDate() + (recurrence.interval_value - 1) * 7)
          }
        } else {
          currentDate.setDate(currentDate.getDate() + (recurrence.interval_value * 7))
        }
        break
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + recurrence.interval_value)
        break
    }
  }

  return occurrences
}

/**
 * Generate event instances from a recurring event
 */
export function generateEventInstances(
  masterEvent: CalendarEventDB,
  recurrence: EventRecurrence,
  rangeStart: Date,
  rangeEnd: Date
): CalendarEventDB[] {
  if (!masterEvent.is_recurring || !recurrence) {
    return [masterEvent]
  }

  const startTime = new Date(masterEvent.start_time)
  const endTime = new Date(masterEvent.end_time)
  const duration = endTime.getTime() - startTime.getTime()

  // Generate all occurrences
  const allOccurrences = generateRecurrenceOccurrences(startTime, recurrence)

  // Filter to only those within the requested range
  const filteredOccurrences = allOccurrences.filter(date => {
    return date >= rangeStart && date <= rangeEnd
  })

  // Create event instances
  return filteredOccurrences.map((occurrenceDate, index) => {
    const instanceStartTime = new Date(occurrenceDate)
    instanceStartTime.setHours(
      startTime.getHours(),
      startTime.getMinutes(),
      startTime.getSeconds()
    )
    
    const instanceEndTime = new Date(instanceStartTime.getTime() + duration)

    return {
      ...masterEvent,
      id: `${masterEvent.id}-instance-${index}`,
      start_time: instanceStartTime.toISOString(),
      end_time: instanceEndTime.toISOString(),
      parent_event_id: masterEvent.id,
      // Keep reference to the original event for editing
      metadata: {
        ...masterEvent.metadata,
        _originalEventId: masterEvent.id,
        _instanceIndex: index,
        _instanceDate: occurrenceDate.toISOString()
      }
    }
  })
}

/**
 * Check if a date falls within a recurrence pattern
 */
export function isDateInRecurrence(
  date: Date,
  masterStartDate: Date,
  recurrence: EventRecurrence
): boolean {
  const exceptions = new Set(recurrence.exceptions || [])
  const dateStr = date.toISOString().split('T')[0]

  // Check if date is in exceptions
  if (exceptions.has(dateStr)) {
    return false
  }

  // Check if date is after end date
  if (recurrence.end_date && date > new Date(recurrence.end_date)) {
    return false
  }

  // Check if date is before start date
  if (date < masterStartDate) {
    return false
  }

  const daysDiff = Math.floor((date.getTime() - masterStartDate.getTime()) / (1000 * 60 * 60 * 24))

  switch (recurrence.frequency) {
    case 'daily':
      return daysDiff % recurrence.interval_value === 0
    
    case 'weekly':
      const dayOfWeek = date.getDay()
      if (recurrence.days_of_week.length > 0 && !recurrence.days_of_week.includes(dayOfWeek)) {
        return false
      }
      const weeksDiff = Math.floor(daysDiff / 7)
      return weeksDiff % recurrence.interval_value === 0
    
    case 'monthly':
      const startDay = masterStartDate.getDate()
      const checkDay = date.getDate()
      if (startDay !== checkDay) {
        return false
      }
      const monthsDiff = 
        (date.getFullYear() - masterStartDate.getFullYear()) * 12 +
        (date.getMonth() - masterStartDate.getMonth())
      return monthsDiff % recurrence.interval_value === 0
    
    default:
      return false
  }
}

/**
 * Get human-readable description of recurrence pattern
 */
export function getRecurrenceDescription(recurrence: EventRecurrence): string {
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  
  let description = ''
  
  switch (recurrence.frequency) {
    case 'daily':
      description = recurrence.interval_value === 1 
        ? 'Todos los días'
        : `Cada ${recurrence.interval_value} días`
      break
    
    case 'weekly':
      if (recurrence.interval_value === 1) {
        if (recurrence.days_of_week.length === 0) {
          description = 'Todas las semanas'
        } else if (recurrence.days_of_week.length === 7) {
          description = 'Todos los días'
        } else {
          const days = recurrence.days_of_week.map(d => dayNames[d]).join(', ')
          description = `Cada semana los ${days}`
        }
      } else {
        const days = recurrence.days_of_week.length > 0
          ? ` los ${recurrence.days_of_week.map(d => dayNames[d]).join(', ')}`
          : ''
        description = `Cada ${recurrence.interval_value} semanas${days}`
      }
      break
    
    case 'monthly':
      description = recurrence.interval_value === 1
        ? 'Todos los meses'
        : `Cada ${recurrence.interval_value} meses`
      break
  }

  // Add end condition
  if (recurrence.end_date) {
    description += ` hasta el ${new Date(recurrence.end_date).toLocaleDateString('es-ES')}`
  } else if (recurrence.occurrences) {
    description += ` (${recurrence.occurrences} veces)`
  }

  return description
}

/**
 * Create recurrence pattern from simple options
 */
export function createRecurrencePattern(options: {
  frequency: RecurrenceFrequency
  interval?: number
  daysOfWeek?: number[]
  endDate?: string
  occurrences?: number
}): Omit<EventRecurrence, 'id' | 'event_id' | 'created_at'> {
  return {
    frequency: options.frequency,
    interval_value: options.interval || 1,
    days_of_week: options.daysOfWeek || [],
    end_date: options.endDate || null,
    occurrences: options.occurrences || null,
    exceptions: []
  }
}

/**
 * Add exception date to recurrence pattern
 */
export function addRecurrenceException(
  recurrence: EventRecurrence,
  exceptionDate: Date
): EventRecurrence {
  const dateStr = exceptionDate.toISOString().split('T')[0]
  const exceptions = new Set(recurrence.exceptions)
  exceptions.add(dateStr)
  
  return {
    ...recurrence,
    exceptions: Array.from(exceptions)
  }
}

/**
 * Remove exception date from recurrence pattern
 */
export function removeRecurrenceException(
  recurrence: EventRecurrence,
  exceptionDate: Date
): EventRecurrence {
  const dateStr = exceptionDate.toISOString().split('T')[0]
  
  return {
    ...recurrence,
    exceptions: recurrence.exceptions.filter(d => d !== dateStr)
  }
}
