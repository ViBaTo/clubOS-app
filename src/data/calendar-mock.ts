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
    nombre: "Carlos Jiménez",
    email: "carlos.jimenez@clubos.com",
    telefono: "+34 611 234 567",
    avatar: "/client-carlos.jpg",
  },
  {
    id: "2",
    nombre: "María Fernández",
    email: "maria.fernandez@clubos.com",
    telefono: "+34 622 345 678",
    avatar: "/client-laura.jpg",
  },
  {
    id: "3",
    nombre: "Roberto García",
    email: "roberto.garcia@clubos.com",
    telefono: "+34 633 456 789",
    avatar: "/client-roberto.jpg",
  },
  {
    id: "4",
    nombre: "Elena Martínez",
    email: "elena.martinez@clubos.com",
    telefono: "+34 644 567 890",
    avatar: "/client-elena.jpg",
  },
  {
    id: "5",
    nombre: "Miguel López",
    email: "miguel.lopez@clubos.com",
    telefono: "+34 655 678 901",
    avatar: "/client-miguel.jpg",
  },
]

const createSeededRandom = (seed: number) => {
  let state = seed % 2147483647
  if (state <= 0) {
    state += 2147483646
  }

  return () => {
    state = (state * 16807) % 2147483647
    return (state - 1) / 2147483646
  }
}

const seededRandom = createSeededRandom(123456789)

const randomInt = (min: number, max: number) => Math.floor(seededRandom() * (max - min + 1)) + min
const randomBool = (probability = 0.5) => seededRandom() < probability
const randomChoice = <T,>(items: T[]): T => items[Math.floor(seededRandom() * items.length)]

const pickRandomClients = (count: number) => {
  const pool = [...mockClients]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}

const BASE_DATE = new Date("2024-05-01T00:00:00")

function generateCalendarEvents(): CalendarEvent[] {
  const events: CalendarEvent[] = []
  const startDate = new Date(BASE_DATE)
  startDate.setDate(BASE_DATE.getDate() - 7)

  const colors = {
    "Clase particular": "#1E40AF",
    Grupal: "#059669",
    Academia: "#7C3AED",
  }

  for (let day = 0; day < 21; day++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + day)

    if (currentDate.getDay() === 0) continue

    const eventsPerDay = randomInt(3, 8)

    for (let i = 0; i < eventsPerDay; i++) {
      const startHour = randomInt(8, 19)
      const startMinute = randomBool(0.5) ? 0 : 30
      const duration = randomBool(0.7) ? 90 : 60

      const fechaInicio = new Date(currentDate)
      fechaInicio.setHours(startHour, startMinute, 0, 0)

      const fechaFin = new Date(fechaInicio)
      fechaFin.setMinutes(fechaInicio.getMinutes() + duration)

      const tipoClase = randomChoice(["Clase particular", "Grupal", "Academia"]) as CalendarEvent["tipoClase"]
      const instructor = randomChoice(mockInstructors)
      const pista = randomChoice(mockCourts)
      const estado = randomBool(0.85)
        ? "Confirmada"
        : randomBool(0.5)
          ? "Pendiente"
          : "Cancelada"

      let cliente: Client | undefined
      let clientes: Client[] | undefined
      let titulo: string

      if (tipoClase === "Clase particular") {
        cliente = randomChoice(mockClients)
        titulo = `Clase particular - ${cliente.nombre}`
      } else if (tipoClase === "Grupal") {
        const numClientes = randomInt(2, 4)
        clientes = pickRandomClients(numClientes)
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
        estado: estado as CalendarEvent["estado"],
        instructor,
        cliente,
        clientes,
        pista,
        precio: tipoClase === "Clase particular" ? 45 : tipoClase === "Grupal" ? 25 : 20,
        color: colors[tipoClase],
        notas: randomBool(0.3) ? "Clase de prueba" : undefined,
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
