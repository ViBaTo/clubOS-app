import { Sidebar } from "@/app/components/layout/sidebar"
import { Navbar } from "@/app/components/layout/navbar"
import { MembersDirectory } from "@/app/components/members/members-directory"
import { BottomNav } from "@/components/layout/BottomNav"

export default function ClientesPage() {
  return (
    <div className="flex h-screen bg-[#F1F5F9]">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-8 pb-20 md:pb-8">
          <div className="space-y-6">
            <MembersDirectory />
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
