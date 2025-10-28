import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserCheck, TrendingUp } from 'lucide-react'

type ChangeType = 'positive' | 'neutral' | 'negative'
type Stat = {
  title: string
  value: string
  change: string
  changeType: ChangeType
  icon: React.ElementType
  subtitle: string
}

const stats: Stat[] = [
  {
    title: 'Total Clientes',
    value: '1,234',
    change: '+12%',
    changeType: 'positive',
    icon: Users,
    subtitle: 'desde el mes pasado'
  },
  {
    title: 'Clientes Activos',
    value: '892',
    change: '72%',
    changeType: 'neutral',
    icon: UserCheck,
    subtitle: 'ratio activos/inactivos'
  },
  {
    title: 'Ingresos Totales',
    value: '€45,678',
    change: '+15%',
    changeType: 'positive',
    icon: TrendingUp,
    subtitle: 'crecimiento mensual'
  }
]

export function StatsCards() {
  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
      {stats.map((stat) => (
        <Card key={stat.title} className='bg-white border-[#E2E8F0] border'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 p-4'>
            <CardTitle className='text-sm font-medium text-[#64748B] uppercase tracking-wide'>
              {stat.title}
            </CardTitle>
            <stat.icon className='h-5 w-5 text-[#14B8A6]' />
          </CardHeader>
          <CardContent className='px-4 pb-4 pt-0'>
            <div className='text-2xl font-bold text-[#0F172A] leading-tight'>
              {stat.value}
            </div>
            <div className='flex items-center gap-2 mt-2'>
              <span
                className={`text-sm font-medium ${
                  stat.changeType === 'positive'
                    ? 'text-[#10B981]'
                    : stat.changeType === 'negative'
                    ? 'text-[#EF4444]'
                    : 'text-[#14B8A6]'
                }`}
              >
                {stat.change}
              </span>
              <span className='text-sm text-[#64748B]'>{stat.subtitle}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
