import { Sidebar } from "@/src/components/layout/sidebar"
import { Navbar } from "@/src/components/layout/navbar"
import { AcademyCard } from "@/src/components/products/academy-card"

// Mock data for academy programs
const academyPrograms = [
  {
    id: 1,
    name: "Escuela Iniciación",
    instructor: "Carlos Martínez",
    instructorAvatar: "/instructor-teaching.png",
    schedule: "Lunes y Miércoles 18:00-19:30",
    level: "Principiante",
    duration: "3 meses",
    price: 80,
    availableSpots: 8,
    totalSpots: 12,
    image: "/padel-academy-training.jpg",
  },
  {
    id: 2,
    name: "Perfeccionamiento Técnico",
    instructor: "Ana García",
    instructorAvatar: "/female-instructor.png",
    schedule: "Martes y Jueves 19:00-20:30",
    level: "Intermedio",
    duration: "4 meses",
    price: 95,
    availableSpots: 3,
    totalSpots: 10,
    image: "/padel-technique-training.jpg",
  },
  {
    id: 3,
    name: "Competición Avanzada",
    instructor: "Miguel Rodríguez",
    instructorAvatar: "/male-coach.png",
    schedule: "Lunes, Miércoles y Viernes 20:00-21:30",
    level: "Avanzado",
    duration: "Curso anual",
    price: 120,
    availableSpots: 2,
    totalSpots: 8,
    image: "/competitive-padel-training.jpg",
  },
  {
    id: 4,
    name: "Escuela Juvenil",
    instructor: "Laura Fernández",
    instructorAvatar: "/young-female-instructor.jpg",
    schedule: "Sábados 10:00-11:30",
    level: "Principiante",
    duration: "6 meses",
    price: 60,
    availableSpots: 15,
    totalSpots: 20,
    image: "/placeholder-cjhrd.png",
  },
  {
    id: 5,
    name: "Táctica y Estrategia",
    instructor: "David López",
    instructorAvatar: "/tactical-coach.jpg",
    schedule: "Jueves 19:30-21:00",
    level: "Intermedio",
    duration: "2 meses",
    price: 85,
    availableSpots: 6,
    totalSpots: 12,
    image: "/padel-strategy-training.jpg",
  },
  {
    id: 6,
    name: "Preparación Física",
    instructor: "Roberto Sánchez",
    instructorAvatar: "/diverse-fitness-coach.png",
    schedule: "Martes y Viernes 17:00-18:00",
    level: "Intermedio",
    duration: "3 meses",
    price: 70,
    availableSpots: 10,
    totalSpots: 15,
    image: "/padel-fitness-training.jpg",
  },
  {
    id: 7,
    name: "Escuela Femenina",
    instructor: "Carmen Ruiz",
    instructorAvatar: "/female-padel-coach.jpg",
    schedule: "Miércoles y Viernes 11:00-12:30",
    level: "Principiante",
    duration: "4 meses",
    price: 75,
    availableSpots: 12,
    totalSpots: 16,
    image: "/women-padel-training.jpg",
  },
  {
    id: 8,
    name: "Clínic de Fin de Semana",
    instructor: "Javier Moreno",
    instructorAvatar: "/weekend-coach.jpg",
    schedule: "Sábados y Domingos 16:00-18:00",
    level: "Avanzado",
    duration: "1 mes",
    price: 150,
    availableSpots: 4,
    totalSpots: 8,
    image: "/intensive-padel-clinic.jpg",
  },
]

export default function AcademiaPage() {
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
                  <span className="material-symbols-outlined text-3xl text-[#1E40AF]">school</span>
                  <h1 className="text-5xl font-bold text-[#0F172A] leading-tight tracking-tight text-balance">
                    Academia de Pádel
                  </h1>
                </div>
                <p className="text-base font-normal text-[#64748B] leading-relaxed">
                  Programas de entrenamiento estructurados para todos los niveles
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
                  <option>Todos los instructores</option>
                  <option>Carlos Martínez</option>
                  <option>Ana García</option>
                  <option>Miguel Rodríguez</option>
                </select>
                <select className="border border-[#94A3B8]/30 focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 rounded-lg px-4 py-3 text-[#0F172A] bg-white transition-all duration-150">
                  <option>Disponibilidad</option>
                  <option>Plazas disponibles</option>
                  <option>Lista de espera</option>
                </select>
              </div>
            </div>

            {/* Academy programs grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {academyPrograms.map((program) => (
                <AcademyCard key={program.id} program={program} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
