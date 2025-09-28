import type { CalendarEvent, Instructor, Court, Client } from "@/src/types/calendar"

export const mockInstructors: Instructor[] = [
  {
    id: "1",
    nombre: "Ana García",
    email: "ana.garcia@clubos.com",
    telefono: "+34 612 345 678",
    especialidades: ["Tenis", "Pádel", "Clases grupales"],
    avatar: "/instructor-ana.jpg",
    activo: true,
  },
  {
    id: "2",
    nombre: "Carlos Méndez",
    email: "carlos.mendez@clubos.com",
    telefono: "+34 623 456 789",
    especialidades: ["Tenis", "Clases particulares", "Competición"],
    avatar: "/instructor-carlos.jpg",
    activo: true,
  },
  {
    id: "3",
    nombre: "María López",
    email: "maria.lopez@clubos.com",
    telefono: "+34 634 567 890",
    especialidades: ["Pádel", "Fitness", "Clases grupales"],
    avatar: "/instructor-maria.jpg",
    activo: true,
  },
  {
    id: "4",
    nombre: "David Ruiz",
    email: "david.ruiz@clubos.com",
    telefono: "+34 645 678 901",
    especialidades: ["Tenis", "Academia", "Iniciación"],
    avatar: "/instructor-david.jpg",
    activo: true,
  },
]

export const mockCourts: Court[] = [
  {
    id: "1",
    nombre: "Pista Central",
    tipo: "Interior",
    capacidad: 4,
    activo: true,
  },
  {
    id: "2",
    nombre: "Pista 2",
    tipo: "Exterior",
    capacidad: 4,
    activo: true,
  },
  {
    id: "3",
    nombre: "Pista 3",
    tipo: "Interior",
    capacidad: 4,
    activo: true,
  },
  {
    id: "4",
    nombre: "Pista Pádel 1",
    tipo: "Exterior",
    capacidad: 4,
    activo: true,
  },
  {
    id: "5",
    nombre: "Sala Multiuso",
    tipo: "Multiuso",
    capacidad: 20,
    activo: true,
  },
]

export const mockClients: Client[] = [
  {
    id: "1",
    nombre: "Carlos Rodríguez García",
    email: "carlos.rodriguez@email.com",
    telefono: "+34 612 345 678",
    avatar: "/client-carlos.jpg",
  },
  {
    id: "2",
    nombre: "Laura Martínez",
    email: "laura.martinez@email.com",
    telefono: "+34 623 456 789",
    avatar: "/client-laura.jpg",
  },
  {
    id: "3",
    nombre: "Miguel Fernández",
    email: "miguel.fernandez@email.com",
    telefono: "+34 634 567 890",
    avatar: "/client-miguel.jpg",
  },
  {
    id: "4",
    nombre: "Elena Sánchez",
    email: "elena.sanchez@email.com",
    telefono: "+34 645 678 901",
    avatar: "/client-elena.jpg",
  },
  {
    id: "5",
    nombre: "Roberto Silva",
    email: "roberto.silva@email.com",
    telefono: "+34 656 789 012",
    avatar: "/client-roberto.jpg",
  },
]

// Generate realistic calendar events for the current week and next few weeks
const generateCalendarEvents = (): CalendarEvent[] => {
  const events: CalendarEvent[] = []
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - 7) // Start from a week ago

  const colors = {
    "Clase particular": "#1E40AF", // Blue
    Grupal: "#059669", // Green
    Academia: "#7C3AED", // Purple
  }

  // Generate events for 3 weeks
  for (let day = 0; day < 21; day++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + day)

    // Skip Sundays for most activities
    if (currentDate.getDay() === 0) continue

    // Generate 3-8 events per day
    const eventsPerDay = Math.floor(Math.random() * 6) + 3

    for (let i = 0; i < eventsPerDay; i++) {
      const startHour = Math.floor(Math.random() * 12) + 8 // 8 AM to 8 PM
      const startMinute = Math.random() < 0.5 ? 0 : 30
      const duration = Math.random() < 0.7 ? 90 : 60 // 60 or 90 minutes

      const fechaInicio = new Date(currentDate)
      fechaInicio.setHours(startHour, startMinute, 0, 0)

      const fechaFin = new Date(fechaInicio)
      fechaFin.setMinutes(fechaInicio.getMinutes() + duration)

      const tipoClase = ["Clase particular", "Grupal", "Academia"][Math.floor(Math.random() * 3)] as any
      const instructor = mockInstructors[Math.floor(Math.random() * mockInstructors.length)]
      const pista = mockCourts[Math.floor(Math.random() * mockCourts.length)]
      const estado = Math.random() < 0.85 ? "Confirmada" : Math.random() < 0.5 ? "Pendiente" : "Cancelada"

      let cliente: Client | undefined
      let clientes: Client[] | undefined
      let titulo: string

      if (tipoClase === "Clase particular") {
        cliente = mockClients[Math.floor(Math.random() * mockClients.length)]
        titulo = `Clase particular - ${cliente.nombre}`
      } else if (tipoClase === "Grupal") {
        const numClientes = Math.floor(Math.random() * 3) + 2 // 2-4 clients
        clientes = mockClients.slice(0, numClientes)
        titulo = `Clase grupal (${numClientes} alumnos)`
      } else {
        titulo = "Clase de Academia"
      }

      events.push({
        id: `event-${day}-${i}`,
        titulo,
        descripcion: `Clase de ${instructor.especialidades[0]} con ${instructor.nombre}`,
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString(),
        tipoClase,
        estado: estado as any,
        instructor,
        cliente,
        clientes,
        pista,
        precio: tipoClase === "Clase particular" ? 45 : tipoClase === "Grupal" ? 25 : 20,
        color: colors[tipoClase],
        notas: Math.random() < 0.3 ? "Clase de prueba" : undefined,
      })
    }
  }

  return events.sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime())
}

export const mockCalendarEvents = generateCalendarEvents()

export const defaultCalendarFilter: import("@/src/types/calendar").CalendarFilter = {
  instructores: [],
  tiposClase: [],
  pistas: [],
  estados: [],
  busqueda: "",
}
