export interface Instructor {
  id: string
  nombre: string
  email: string
  telefono: string
  especialidades: string[]
  avatar?: string
  activo: boolean
}

export interface Court {
  id: string
  nombre: string
  tipo: "Interior" | "Exterior" | "Multiuso"
  capacidad: number
  activo: boolean
}

export interface Client {
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
  fechaInicio: string // ISO string
  fechaFin: string // ISO string
  tipoClase: "Clase particular" | "Grupal" | "Academia"
  estado: "Confirmada" | "Pendiente" | "Cancelada" | "Completada"
  instructor: Instructor
  cliente?: Client // For individual classes
  clientes?: Client[] // For group classes
  pista: Court
  precio?: number
  notas?: string
  color?: string // For visual distinction
  recurrente?: {
    tipo: "diaria" | "semanal" | "mensual"
    intervalo: number // Every X days/weeks/months
    diasSemana?: number[] // 0-6, Sunday-Saturday
    fechaFin?: string // When recurrence ends
  }
}

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
