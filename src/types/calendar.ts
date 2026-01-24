// ============================================
// Database Types (matching Supabase schema)
// ============================================

export type EventType = 'private_class' | 'group_class' | 'academy' | 'court_rental' | 'tournament' | 'maintenance'
export type EventStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed'
export type ParticipationStatus = 'registered' | 'attended' | 'no_show' | 'cancelled'
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly'
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
export type LocationType = 'interior' | 'exterior' | 'multiuso'

// ============================================
// Database Entity Types
// ============================================

export interface Instructor {
  id: string
  full_name: string
  email: string
  phone?: string | null
  specialties?: string[] | null
  avatar_url?: string | null
  status?: string
  role?: string
}

export interface Facility {
  id: string
  organization_id: string
  name: string
  sport: string
  facility_type: string
  capacity?: number | null
  location_type: LocationType
  attributes?: Record<string, any>
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface Client {
  id: string
  full_name: string
  email?: string | null
  phone?: string | null
  avatar_url?: string | null
  status?: string
  categoria_id?: string | null
}

export interface EventRecurrence {
  id: string
  event_id: string
  frequency: RecurrenceFrequency
  interval_value: number
  days_of_week: number[]
  end_date?: string | null
  occurrences?: number | null
  exceptions: string[]
  created_at: string
}

export interface EventParticipant {
  id: string
  event_id: string
  client_id: string
  status: ParticipationStatus
  registered_at: string
  attended_at?: string | null
  product_sale_id?: string | null
  notes?: string | null
  client?: Client
}

export interface CalendarEventDB {
  id: string
  organization_id: string
  title: string
  description?: string | null
  start_time: string
  end_time: string
  event_type: EventType
  status: EventStatus
  instructor_id?: string | null
  facility_id?: string | null
  client_id?: string | null
  price?: number | null
  max_participants?: number | null
  current_participants: number
  color?: string | null
  notes?: string | null
  metadata?: Record<string, any>
  parent_event_id?: string | null
  is_recurring: boolean
  created_by?: string | null
  created_at: string
  updated_at: string
  // Relations (populated when fetched with joins)
  instructor?: Instructor | null
  facility?: Facility | null
  client?: Client | null
  participants?: EventParticipant[]
  recurrence?: EventRecurrence | null
}

export interface ReservationDB {
  id: string
  organization_id: string
  facility_id: string
  client_id: string
  start_time: string
  end_time: string
  status: ReservationStatus
  price?: number | null
  payment_status: 'paid' | 'pending' | 'refunded'
  payment_id?: string | null
  notes?: string | null
  booked_at: string
  confirmed_at?: string | null
  cancelled_at?: string | null
  cancellation_reason?: string | null
  created_at: string
  updated_at: string
  // Relations
  facility?: Facility | null
  client?: Client | null
}

// ============================================
// Frontend Display Types (for UI components)
// ============================================

// Legacy types for backward compatibility with existing UI components
export interface LegacyInstructor {
  id: string
  nombre: string
  email: string
  telefono: string
  especialidades: string[]
  avatar?: string
  activo: boolean
}

export interface LegacyCourt {
  id: string
  nombre: string
  tipo: "Interior" | "Exterior" | "Multiuso"
  capacidad: number
  activo: boolean
}

export interface LegacyClient {
  id: string
  nombre: string
  email: string
  telefono: string
  avatar?: string
}

export interface CalendarEvent {
  id: string
  titulo: string
  descripcion?: string
  fechaInicio: string
  fechaFin: string
  tipoClase: "Clase particular" | "Grupal" | "Academia"
  estado: "Confirmada" | "Pendiente" | "Cancelada" | "Completada"
  instructor: LegacyInstructor
  cliente?: LegacyClient
  clientes?: LegacyClient[]
  pista: LegacyCourt
  precio?: number
  notas?: string
  color?: string
  recurrente?: {
    tipo: "diaria" | "semanal" | "mensual"
    intervalo: number
    diasSemana?: number[]
    fechaFin?: string
  }
  // DB reference
  _dbId?: string
  _dbEvent?: CalendarEventDB
}

// ============================================
// Conversion Functions
// ============================================

export function mapEventTypeToLegacy(eventType: EventType): "Clase particular" | "Grupal" | "Academia" {
  const mapping: Record<EventType, "Clase particular" | "Grupal" | "Academia"> = {
    'private_class': 'Clase particular',
    'group_class': 'Grupal',
    'academy': 'Academia',
    'court_rental': 'Clase particular', // Default mapping
    'tournament': 'Grupal',
    'maintenance': 'Grupal'
  }
  return mapping[eventType]
}

export function mapLegacyEventType(tipoClase: string): EventType {
  const mapping: Record<string, EventType> = {
    'Clase particular': 'private_class',
    'Grupal': 'group_class',
    'Academia': 'academy'
  }
  return mapping[tipoClase] || 'private_class'
}

export function mapStatusToLegacy(status: EventStatus): "Confirmada" | "Pendiente" | "Cancelada" | "Completada" {
  const mapping: Record<EventStatus, "Confirmada" | "Pendiente" | "Cancelada" | "Completada"> = {
    'confirmed': 'Confirmada',
    'pending': 'Pendiente',
    'cancelled': 'Cancelada',
    'completed': 'Completada'
  }
  return mapping[status]
}

export function mapLegacyStatus(estado: string): EventStatus {
  const mapping: Record<string, EventStatus> = {
    'Confirmada': 'confirmed',
    'Pendiente': 'pending',
    'Cancelada': 'cancelled',
    'Completada': 'completed'
  }
  return mapping[estado] || 'pending'
}

export function mapLocationTypeToLegacy(locationType: LocationType): "Interior" | "Exterior" | "Multiuso" {
  const mapping: Record<LocationType, "Interior" | "Exterior" | "Multiuso"> = {
    'interior': 'Interior',
    'exterior': 'Exterior',
    'multiuso': 'Multiuso'
  }
  return mapping[locationType]
}

export function dbEventToLegacy(dbEvent: CalendarEventDB): CalendarEvent {
  const instructor: LegacyInstructor = dbEvent.instructor ? {
    id: dbEvent.instructor.id,
    nombre: dbEvent.instructor.full_name,
    email: dbEvent.instructor.email,
    telefono: dbEvent.instructor.phone || '',
    especialidades: dbEvent.instructor.specialties || [],
    avatar: dbEvent.instructor.avatar_url || undefined,
    activo: true
  } : {
    id: '',
    nombre: 'Sin asignar',
    email: '',
    telefono: '',
    especialidades: [],
    activo: true
  }

  const pista: LegacyCourt = dbEvent.facility ? {
    id: dbEvent.facility.id,
    nombre: dbEvent.facility.name,
    tipo: mapLocationTypeToLegacy(dbEvent.facility.location_type),
    capacidad: dbEvent.facility.capacity || 4,
    activo: dbEvent.facility.is_active
  } : {
    id: '',
    nombre: 'Sin pista',
    tipo: 'Interior',
    capacidad: 4,
    activo: true
  }

  const cliente: LegacyClient | undefined = dbEvent.client ? {
    id: dbEvent.client.id,
    nombre: dbEvent.client.full_name,
    email: dbEvent.client.email || '',
    telefono: dbEvent.client.phone || '',
    avatar: dbEvent.client.avatar_url || undefined
  } : undefined

  const clientes: LegacyClient[] = dbEvent.participants?.map(p => ({
    id: p.client?.id || p.client_id,
    nombre: p.client?.full_name || 'Cliente',
    email: p.client?.email || '',
    telefono: p.client?.phone || '',
    avatar: p.client?.avatar_url || undefined
  })) || []

  return {
    id: dbEvent.id,
    titulo: dbEvent.title,
    descripcion: dbEvent.description || undefined,
    fechaInicio: dbEvent.start_time,
    fechaFin: dbEvent.end_time,
    tipoClase: mapEventTypeToLegacy(dbEvent.event_type),
    estado: mapStatusToLegacy(dbEvent.status),
    instructor,
    cliente,
    clientes: clientes.length > 0 ? clientes : undefined,
    pista,
    precio: dbEvent.price ?? undefined,
    notas: dbEvent.notes || undefined,
    color: dbEvent.color || undefined,
    recurrente: dbEvent.recurrence ? {
      tipo: dbEvent.recurrence.frequency === 'daily' ? 'diaria' : 
            dbEvent.recurrence.frequency === 'weekly' ? 'semanal' : 'mensual',
      intervalo: dbEvent.recurrence.interval_value,
      diasSemana: dbEvent.recurrence.days_of_week,
      fechaFin: dbEvent.recurrence.end_date || undefined
    } : undefined,
    _dbId: dbEvent.id,
    _dbEvent: dbEvent
  }
}

export function legacyEventToDbPayload(event: Partial<CalendarEvent>): Partial<CalendarEventDB> {
  const payload: Partial<CalendarEventDB> = {}
  
  if (event.titulo !== undefined) payload.title = event.titulo
  if (event.descripcion !== undefined) payload.description = event.descripcion
  if (event.fechaInicio !== undefined) payload.start_time = event.fechaInicio
  if (event.fechaFin !== undefined) payload.end_time = event.fechaFin
  if (event.tipoClase !== undefined) payload.event_type = mapLegacyEventType(event.tipoClase)
  if (event.estado !== undefined) payload.status = mapLegacyStatus(event.estado)
  if (event.instructor?.id) payload.instructor_id = event.instructor.id
  if (event.pista?.id) payload.facility_id = event.pista.id
  if (event.cliente?.id) payload.client_id = event.cliente.id
  if (event.precio !== undefined) payload.price = event.precio
  if (event.notas !== undefined) payload.notes = event.notas
  if (event.color !== undefined) payload.color = event.color
  
  return payload
}

// ============================================
// Filter Types
// ============================================

export interface CalendarFilter {
  instructores: string[]
  tiposClase: string[]
  pistas: string[]
  estados: string[]
  fechaInicio?: string
  fechaFin?: string
  busqueda?: string
}

export interface CalendarView {
  tipo: "month" | "week" | "day"
  fecha: Date
}

export interface DragDropContext {
  isDragging: boolean
  draggedEvent?: CalendarEvent
  dropZone?: {
    fecha: string
    hora: string
    pista?: string
  }
}

// ============================================
// API Request/Response Types
// ============================================

export interface CreateEventRequest {
  title: string
  description?: string
  start_time: string
  end_time: string
  event_type: EventType
  status?: EventStatus
  instructor_id?: string
  facility_id?: string
  client_id?: string
  price?: number
  max_participants?: number
  color?: string
  notes?: string
  metadata?: Record<string, any>
  is_recurring?: boolean
  recurrence?: {
    frequency: RecurrenceFrequency
    interval_value?: number
    days_of_week?: number[]
    end_date?: string
    occurrences?: number
    exceptions?: string[]
  }
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  update_series?: boolean
}

export interface CreateReservationRequest {
  facility_id: string
  client_id: string
  start_time: string
  end_time: string
  price?: number
  notes?: string
}

export interface AvailabilityCheckRequest {
  facility_id?: string
  instructor_id?: string
  start_time: string
  end_time: string
  exclude_event_id?: string
}

export interface AvailabilityCheckResponse {
  available: boolean
  facility_available?: boolean
  instructor_available?: boolean
}
