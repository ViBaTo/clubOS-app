import { Sidebar } from "@/src/components/layout/sidebar"
import { Navbar } from "@/src/components/layout/navbar"

export default function Home() {
  return (
    <div className="flex h-screen bg-[#F1F5F9]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-5xl font-bold text-[#0F172A] leading-tight tracking-tight text-balance">
                  Bienvenido a ClubOS
                </h1>
                <p className="text-base font-normal text-[#64748B] leading-relaxed mt-1">
                  Tu plataforma de gestión deportiva integral.
                </p>
              </div>
            </div>

            {/* Welcome content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#14B8A6]/10 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#14B8A6] text-xl">dashboard</span>
                  </div>
                  <h3 className="text-lg font-semibold text-[#0F172A]">Panel de Control</h3>
                </div>
                <p className="text-sm text-[#64748B] mb-4">
                  Accede a métricas, análisis financiero y estadísticas de tu club.
                </p>
                <a
                  href="/dashboard"
                  className="inline-flex items-center gap-2 text-[#14B8A6] hover:text-[#0F766E] font-medium text-sm"
                >
                  Ver Dashboard
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#14B8A6]/10 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#14B8A6] text-xl">group</span>
                  </div>
                  <h3 className="text-lg font-semibold text-[#0F172A]">Gestión de Clientes</h3>
                </div>
                <p className="text-sm text-[#64748B] mb-4">
                  Administra perfiles, paquetes y seguimiento de asistencia.
                </p>
                <a
                  href="/clientes"
                  className="inline-flex items-center gap-2 text-[#14B8A6] hover:text-[#0F766E] font-medium text-sm"
                >
                  Ver Clientes
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#14B8A6]/10 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#14B8A6] text-xl">inventory_2</span>
                  </div>
                  <h3 className="text-lg font-semibold text-[#0F172A]">Productos y Servicios</h3>
                </div>
                <p className="text-sm text-[#64748B] mb-4">
                  Configura paquetes de clases, academia y servicios adicionales.
                </p>
                <a
                  href="/productos/clases"
                  className="inline-flex items-center gap-2 text-[#14B8A6] hover:text-[#0F766E] font-medium text-sm"
                >
                  Ver Productos
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
