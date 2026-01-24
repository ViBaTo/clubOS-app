import type { CalendarEventDB, ReservationDB, Client, Facility } from '@/src/types/calendar'

// ============================================
// Configuration (can be moved to club_settings)
// ============================================

export interface BookingRules {
  // Reservation limits
  maxActiveReservationsPerClient: number
  maxAdvanceBookingDays: number
  minCancellationHours: number
  
  // Class limits
  maxParticipantsDefault: number
  minBookingNoticeMinutes: number
  
  // Time constraints
  openingHour: number // 0-23
  closingHour: number // 0-23
  slotDurationMinutes: number
  
  // Business rules
  allowSameDayBooking: boolean
  allowWeekendBooking: boolean
  requirePaymentUpfront: boolean
}

export const DEFAULT_BOOKING_RULES: BookingRules = {
  maxActiveReservationsPerClient: 2,
  maxAdvanceBookingDays: 7,
  minCancellationHours: 24,
  maxParticipantsDefault: 4,
  minBookingNoticeMinutes: 60,
  openingHour: 8,
  closingHour: 22,
  slotDurationMinutes: 60,
  allowSameDayBooking: true,
  allowWeekendBooking: true,
  requirePaymentUpfront: false
}

// ============================================
// Validation Result Type
// ============================================

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// ============================================
// Validation Functions
// ============================================

/**
 * Validate a new reservation request
 */
export function validateReservation(
  reservation: Partial<ReservationDB>,
  existingReservations: ReservationDB[],
  rules: BookingRules = DEFAULT_BOOKING_RULES
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const startTime = reservation.start_time ? new Date(reservation.start_time) : null
  const endTime = reservation.end_time ? new Date(reservation.end_time) : null
  const now = new Date()

  // Check required fields
  if (!reservation.facility_id) {
    errors.push('Facility is required')
  }
  if (!reservation.client_id) {
    errors.push('Client is required')
  }
  if (!startTime || !endTime) {
    errors.push('Start time and end time are required')
    return { valid: false, errors, warnings }
  }

  // Time validations
  if (startTime >= endTime) {
    errors.push('End time must be after start time')
  }

  // Check booking notice
  const minutesUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60)
  if (minutesUntilStart < rules.minBookingNoticeMinutes) {
    errors.push(`Reservations must be made at least ${rules.minBookingNoticeMinutes} minutes in advance`)
  }

  // Check same day booking
  if (!rules.allowSameDayBooking && startTime.toDateString() === now.toDateString()) {
    errors.push('Same-day reservations are not allowed')
  }

  // Check advance booking limit
  const daysUntilStart = minutesUntilStart / (60 * 24)
  if (daysUntilStart > rules.maxAdvanceBookingDays) {
    errors.push(`Reservations can only be made up to ${rules.maxAdvanceBookingDays} days in advance`)
  }

  // Check weekend booking
  const dayOfWeek = startTime.getDay()
  if (!rules.allowWeekendBooking && (dayOfWeek === 0 || dayOfWeek === 6)) {
    errors.push('Weekend reservations are not allowed')
  }

  // Check operating hours
  const startHour = startTime.getHours()
  const endHour = endTime.getHours()
  if (startHour < rules.openingHour || endHour > rules.closingHour) {
    errors.push(`Reservations must be between ${rules.openingHour}:00 and ${rules.closingHour}:00`)
  }

  // Check active reservations limit for this client
  if (reservation.client_id) {
    const activeReservations = existingReservations.filter(r => 
      r.client_id === reservation.client_id &&
      r.status !== 'cancelled' &&
      r.status !== 'completed' &&
      new Date(r.start_time) > now
    )
    
    if (activeReservations.length >= rules.maxActiveReservationsPerClient) {
      errors.push(`Maximum of ${rules.maxActiveReservationsPerClient} active reservations allowed per client`)
    }
  }

  // Check for conflicts (handled by DB trigger, but good to catch early)
  const conflictingReservation = existingReservations.find(r => 
    r.facility_id === reservation.facility_id &&
    r.status !== 'cancelled' &&
    r.id !== reservation.id &&
    hasTimeOverlap(startTime, endTime, new Date(r.start_time), new Date(r.end_time))
  )
  
  if (conflictingReservation) {
    errors.push('This time slot is already reserved')
  }

  // Warnings (non-blocking)
  if (minutesUntilStart < 120) {
    warnings.push('This reservation is less than 2 hours away')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate a new calendar event
 */
export function validateCalendarEvent(
  event: Partial<CalendarEventDB>,
  existingEvents: CalendarEventDB[],
  rules: BookingRules = DEFAULT_BOOKING_RULES
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const startTime = event.start_time ? new Date(event.start_time) : null
  const endTime = event.end_time ? new Date(event.end_time) : null
  const now = new Date()

  // Check required fields
  if (!event.title) {
    errors.push('Title is required')
  }
  if (!event.event_type) {
    errors.push('Event type is required')
  }
  if (!startTime || !endTime) {
    errors.push('Start time and end time are required')
    return { valid: false, errors, warnings }
  }

  // Time validations
  if (startTime >= endTime) {
    errors.push('End time must be after start time')
  }

  // Check operating hours
  const startHour = startTime.getHours()
  const endHour = endTime.getHours()
  if (startHour < rules.openingHour || endHour > rules.closingHour) {
    warnings.push(`Event is outside normal operating hours (${rules.openingHour}:00 - ${rules.closingHour}:00)`)
  }

  // Check for instructor conflicts
  if (event.instructor_id) {
    const conflictingEvent = existingEvents.find(e => 
      e.instructor_id === event.instructor_id &&
      e.status !== 'cancelled' &&
      e.id !== event.id &&
      hasTimeOverlap(startTime, endTime, new Date(e.start_time), new Date(e.end_time))
    )
    
    if (conflictingEvent) {
      errors.push('Instructor has a conflicting event at this time')
    }
  }

  // Check for facility conflicts
  if (event.facility_id) {
    const conflictingEvent = existingEvents.find(e => 
      e.facility_id === event.facility_id &&
      e.status !== 'cancelled' &&
      e.id !== event.id &&
      hasTimeOverlap(startTime, endTime, new Date(e.start_time), new Date(e.end_time))
    )
    
    if (conflictingEvent) {
      errors.push('Facility is already booked at this time')
    }
  }

  // Check participant limits for group classes
  if (event.event_type === 'group_class' || event.event_type === 'academy') {
    if (!event.max_participants) {
      warnings.push('No participant limit set for group class')
    }
  }

  // Check if private class has a client
  if (event.event_type === 'private_class' && !event.client_id) {
    warnings.push('Private class has no client assigned')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate cancellation request
 */
export function validateCancellation(
  startTime: Date,
  rules: BookingRules = DEFAULT_BOOKING_RULES
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const now = new Date()

  const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursUntilStart < 0) {
    errors.push('Cannot cancel past events')
  } else if (hoursUntilStart < rules.minCancellationHours) {
    warnings.push(`Cancellation within ${rules.minCancellationHours} hours may incur a fee`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate participant addition to event
 */
export function validateParticipantAddition(
  event: CalendarEventDB,
  clientId: string,
  existingParticipantIds: string[]
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check if client is already a participant
  if (existingParticipantIds.includes(clientId)) {
    errors.push('Client is already registered for this event')
  }

  // Check capacity
  if (event.max_participants && event.current_participants >= event.max_participants) {
    errors.push('Event is at full capacity')
  }

  // Check if event is in the past
  if (new Date(event.start_time) < new Date()) {
    errors.push('Cannot register for past events')
  }

  // Check if event is cancelled
  if (event.status === 'cancelled') {
    errors.push('Cannot register for cancelled events')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Check if two time ranges overlap
 */
export function hasTimeOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && end1 > start2
}

/**
 * Get available time slots for a facility on a given date
 */
export function getAvailableTimeSlots(
  facilityId: string,
  date: Date,
  existingEvents: CalendarEventDB[],
  existingReservations: ReservationDB[],
  rules: BookingRules = DEFAULT_BOOKING_RULES
): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = []
  const slotMinutes = rules.slotDurationMinutes

  // Get all bookings for this facility on this date
  const dateStr = date.toISOString().split('T')[0]
  const bookings = [
    ...existingEvents.filter(e => 
      e.facility_id === facilityId && 
      e.status !== 'cancelled' &&
      e.start_time.startsWith(dateStr)
    ).map(e => ({ start: new Date(e.start_time), end: new Date(e.end_time) })),
    ...existingReservations.filter(r => 
      r.facility_id === facilityId && 
      r.status !== 'cancelled' &&
      r.start_time.startsWith(dateStr)
    ).map(r => ({ start: new Date(r.start_time), end: new Date(r.end_time) }))
  ].sort((a, b) => a.start.getTime() - b.start.getTime())

  // Generate slots
  const dayStart = new Date(date)
  dayStart.setHours(rules.openingHour, 0, 0, 0)
  
  const dayEnd = new Date(date)
  dayEnd.setHours(rules.closingHour, 0, 0, 0)

  let currentSlotStart = new Date(dayStart)

  while (currentSlotStart < dayEnd) {
    const currentSlotEnd = new Date(currentSlotStart.getTime() + slotMinutes * 60 * 1000)
    
    if (currentSlotEnd > dayEnd) break

    // Check if slot overlaps with any booking
    const isOccupied = bookings.some(b => 
      hasTimeOverlap(currentSlotStart, currentSlotEnd, b.start, b.end)
    )

    if (!isOccupied) {
      slots.push({
        start: currentSlotStart.toISOString(),
        end: currentSlotEnd.toISOString()
      })
    }

    currentSlotStart = currentSlotEnd
  }

  return slots
}

/**
 * Calculate class consumption from a package
 */
export function calculateClassConsumption(
  classType: string,
  packageType: string
): number {
  // Different class types may consume different amounts from packages
  const consumptionRates: Record<string, Record<string, number>> = {
    'class_package': {
      'private_class': 2, // Private classes consume 2 credits
      'group_class': 1,   // Group classes consume 1 credit
      'academy': 1        // Academy sessions consume 1 credit
    }
  }

  return consumptionRates[packageType]?.[classType] || 1
}

/**
 * Check if a client has available classes in their package
 */
export function hasAvailableClasses(
  remainingClasses: number,
  classType: string,
  packageType: string
): boolean {
  const consumption = calculateClassConsumption(classType, packageType)
  return remainingClasses >= consumption
}
