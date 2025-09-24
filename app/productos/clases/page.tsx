import { Sidebar } from "@/src/components/layout/sidebar"
import { Navbar } from "@/src/components/layout/navbar"
import { ClassCard } from "@/src/components/products/class-card"

// Mock data for classes
const upcomingClasses = [
  {
    id: 1,
    date: "2024-01-15",
    time: "09:00",
    type: "Clase particular",
    instructor: "Carlos Martínez",
    instructorAvatar: "/instructor-teaching.png",
    court: "Pista 1",
    level: "Intermedio",
    price: 35,
    availableSpots: 1,
    totalSpots: 2,
    status: "Disponible",
  },
  {
    id: 2,
    date: "2024-01-15",
    time: "10:30",
    type: "Clase grupal",
    instructor: "Ana García",
    instructorAvatar: "/female-instructor.png",
    court: "Pista 2",
    level: "Principiante",
    price: 20,
    availableSpots: 0,
    totalSpots: 4,
    status: "Completa",
  },
  {
    id: 3,
    date: "2024-01-15",
    time: "12:00",
    type: "Clínic",
    instructor: "Miguel Rodríguez",
    instructorAvatar: "/male-coach.png",
    court: "Pista 3",
    level: "Avanzado",
    price: 45,
    availableSpots: 3,
    totalSpots: 6,
    status: "Disponible",
  },
  {
    id: 4,
    date: "2024-01-15",
    time: "16:00",
    type: "Clase grupal",
    instructor: "Laura Fernández",
    instructorAvatar: "/young-female-instructor.jpg",
    court: "Pista 1",
    level: "Principiante",
    price: 18,
    availableSpots: 2,
    totalSpots: 4,
    status: "Disponible",
  },
  {
    id: 5,
    date: "2024-01-15",
    time: "18:00",
    type: "Clase particular",
    instructor: "David López",
    instructorAvatar: "/tactical-coach.jpg",
    court: "Pista 2",
    level: "Avanzado",
    price: 40,
    availableSpots: 0,
    totalSpots: 2,
    status: "Completa",
  },
  {
    id: 6,
    date: "2024-01-16",
    time: "09:30",
    type: "Clínic",
    instructor: "Roberto Sánchez",
    instructorAvatar: "/diverse-fitness-coach.png",
    court: "Pista 3",
    level: "Intermedio",
    price: 35,
    availableSpots: 4,
    totalSpots: 8,
    status: "Disponible",
  },
  {
    id: 7,
    date: "2024-01-16",
    time: "11:00",
    type: "Clase grupal",
    instructor: "Carmen Ruiz",
    instructorAvatar: "/female-padel-coach.jpg",
    court: "Pista 1",
    level: "Principiante",
    price: 22,
    availableSpots: 1,
    totalSpots: 4,
    status: "Disponible",
  },
  {
    id: 8,
    date: "2024-01-16",
    time: "17:30",
    type: "Clase particular",
    instructor: "Javier Moreno",
    instructorAvatar: "/weekend-coach.jpg",
    court: "Pista 2",
    level: "Avanzado",
    price: 45,
    availableSpots: 2,
    totalSpots: 2,
    status: "Disponible",
  },
  {
    id: 9,
    date: "2024-01-17",
    time: "10:00",
    type: "Clínic",
    instructor: "Carlos Martínez",
    instructorAvatar: "/instructor-teaching.png",
    court: "Pista 3",
    level: "Intermedio",
    price: 38,
    availableSpots: 0,
    totalSpots: 6,
    status: "Cancelada",
  },
  {
    id: 10,
    date: "2024-01-17",
    time: "15:00",
    type: "Clase grupal",
    instructor: "Ana García",
    instructorAvatar: "/female-instructor.png",
    court: "Pista 1",
    level: "Intermedio",
    price: 25,
    availableSpots: 3,
    totalSpots: 4,
    status: "Disponible",
  },
]

export default function ClasesPage() {
  return (
    <div className="flex h-screen bg-[#F1F5F9]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-3xl text-[#1E40AF]">event</span>
                  <h1 className="text-5xl font-bold text-[#0F172A] leading-tight tracking-tight text-balance">
                    Clases de Pádel
                  </h1>
                </div>
                <p className="text-base font-normal text-[#64748B] leading-relaxed">
                  Reserva clases individuales y grupales con nuestros instructores
                </p>
              </div>
            </div>

            {/* Filter options */}
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex flex-wrap gap-4">
                <select className="border border-[#94A3B8]/30 focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 rounded-lg px-4 py-3 text-[#0F172A] bg-white transition-all duration-150">
                  <option>Todos los niveles</option>
                  <option>Principiante</option>
                  <option>Intermedio</option>
                  <option>Avanzado</option>
                </select>
                <select className="border border-[#94A3B8]/30 focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 rounded-lg px-4 py-3 text-[#0F172A] bg-white transition-all duration-150">
                  <option>Tipo de clase</option>
                  <option>Clase particular</option>
                  <option>Clase grupal</option>
                  <option>Clínic</option>
                </select>
                <select className="border border-[#94A3B8]/30 focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 rounded-lg px-4 py-3 text-[#0F172A] bg-white transition-all duration-150">
                  <option>Disponibilidad</option>
                  <option>Disponible</option>
                  <option>Completa</option>
                  <option>Cancelada</option>
                </select>
              </div>
            </div>

            {/* Classes grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {upcomingClasses.map((classItem) => (
                <ClassCard key={classItem.id} classItem={classItem} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
