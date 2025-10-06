import { Sidebar } from "@/src/components/layout/sidebar"
import { Navbar } from "@/src/components/layout/navbar"
import { StatsCards } from "@/src/components/dashboard/stats-cards"
import { RevenueAnalytics } from "@/src/components/dashboard/revenue-analytics"
import { CompactQuickActions } from "@/src/components/dashboard/compact-quick-actions"

export default function Dashboard() {
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
                  Panel de Control
                </h1>
                <p className="text-base font-normal text-[#64748B] leading-relaxed mt-1">
                  Bienvenido de vuelta. Aquí tienes un resumen de tu club.
                </p>
              </div>
              <CompactQuickActions />
            </div>

            <StatsCards />

            <RevenueAnalytics />
          </div>
        </main>
      </div>
    </div>
  )
}
