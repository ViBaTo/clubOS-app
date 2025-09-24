import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, GraduationCap, Calendar, TrendingUp } from "lucide-react"

const stats = [
  {
    title: "Total Clientes",
    value: "1,234",
    change: "+12%",
    changeType: "positive" as const,
    icon: Users,
  },
  {
    title: "Clases Activas",
    value: "56",
    change: "+8%",
    changeType: "positive" as const,
    icon: Calendar,
  },
  {
    title: "Programas Academia",
    value: "12",
    change: "+2%",
    changeType: "positive" as const,
    icon: GraduationCap,
  },
  {
    title: "Ingresos Mensuales",
    value: "$45,678",
    change: "+15%",
    changeType: "positive" as const,
    icon: TrendingUp,
  },
]

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-[#94A3B8]" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-semibold text-[#0F172A] leading-tight">{stat.value}</div>
            <p className="text-sm font-normal text-[#94A3B8] leading-normal mt-1">{stat.change} desde el mes pasado</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
