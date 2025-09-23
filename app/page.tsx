import { Sidebar } from "@/src/components/layout/sidebar"
import { Navbar } from "@/src/components/layout/navbar"
import { StatsCards } from "@/src/components/dashboard/stats-cards"
import { RecentActivity } from "@/src/components/dashboard/recent-activity"
import { QuickActions } from "@/src/components/dashboard/quick-actions"

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground text-balance">Panel de Control</h1>
                <p className="text-muted-foreground mt-1">Bienvenido de vuelta. Aquí tienes un resumen de tu club.</p>
              </div>
            </div>

            {/* Stats cards */}
            <StatsCards />

            {/* Content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RecentActivity />
              </div>
              <div>
                <QuickActions />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
