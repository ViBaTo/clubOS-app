'use client'

import { Sidebar } from "@/app/components/layout/sidebar"
import { Navbar } from "@/app/components/layout/navbar"
import { BottomNav } from "@/components/layout/BottomNav"
import { WelcomeModal } from "@/components/staff/WelcomeModal"
import { useNewStaffWelcome } from "@/hooks/useNewStaffWelcome"

export default function Home() {
  const {
    shouldShowWelcome,
    staffInfo,
    markWelcomeCompleted,
    requiresPasswordSetup,
    submitPassword
  } = useNewStaffWelcome()

  const handleWelcomeClose = async () => {
    try {
      await markWelcomeCompleted()
    } catch (error) {
      console.error('Failed to complete welcome flow:', error)
    }
  }
  return (
    <div className="flex h-screen bg-[#F1F5F9]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-8 pb-20 md:pb-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-5xl font-bold text-[#0F172A] leading-tight tracking-tight text-balance">
                  Welcome to ClubOS
                </h1>
                <p className="text-base font-normal text-[#64748B] leading-relaxed mt-1">
                  Your comprehensive sports club management platform.
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
                  <h3 className="text-lg font-semibold text-[#0F172A]">Dashboard</h3>
                </div>
                <p className="text-sm text-[#64748B] mb-4">
                  Access metrics, financial analysis and club statistics.
                </p>
                <a
                  href="/dashboard"
                  className="inline-flex items-center gap-2 text-[#14B8A6] hover:text-[#0F766E] font-medium text-sm"
                >
                  View Dashboard
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#14B8A6]/10 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#14B8A6] text-xl">group</span>
                  </div>
                  <h3 className="text-lg font-semibold text-[#0F172A]">Member Management</h3>
                </div>
                <p className="text-sm text-[#64748B] mb-4">
                  Manage profiles, packages and attendance tracking.
                </p>
                <a
                  href="/clientes"
                  className="inline-flex items-center gap-2 text-[#14B8A6] hover:text-[#0F766E] font-medium text-sm"
                >
                  View Members
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#14B8A6]/10 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#14B8A6] text-xl">inventory_2</span>
                  </div>
                  <h3 className="text-lg font-semibold text-[#0F172A]">Products & Services</h3>
                </div>
                <p className="text-sm text-[#64748B] mb-4">
                  Configure class packages, academy programs and additional services.
                </p>
                <a
                  href="/productos/clases"
                  className="inline-flex items-center gap-2 text-[#14B8A6] hover:text-[#0F766E] font-medium text-sm"
                >
                  View Products
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>

      {/* Welcome Modal for new staff members */}
      {shouldShowWelcome && staffInfo && (
        <WelcomeModal
          open={shouldShowWelcome}
          onOpenChange={handleWelcomeClose}
          userInfo={{
            name: staffInfo.full_name,
            role: staffInfo.role,
            organizationName: staffInfo.organization_name,
            specialties: staffInfo.specialties
          }}
          requiresPasswordSetup={requiresPasswordSetup}
          onPasswordSubmit={submitPassword}
        />
      )}
    </div>
  )
}
