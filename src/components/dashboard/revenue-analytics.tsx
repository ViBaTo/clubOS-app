'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Calendar, TrendingUp } from 'lucide-react'

const PAYMENT_COLORS: Record<string, string> = {
  Tarjeta: '#14B8A6',
  Efectivo: '#3B82F6',
  Transferencia: '#8B5CF6',
  Otros: '#F59E0B'
}

export function RevenueAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('year')
  const [showComparison, setShowComparison] = useState(false)
  const [selectedDataPoint, setSelectedDataPoint] = useState<any>(null)
  const [showBreakdownModal, setShowBreakdownModal] = useState(false)
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [paymentMethodData, setPaymentMethodData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { getSupabaseClient } = await import('@/app/lib/supabaseClient')
        const supabase = getSupabaseClient()
        const session = (await supabase.auth.getSession()).data.session
        const token = session?.access_token
        const res = await fetch(
          `/api/analytics/revenue?period=${selectedPeriod}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined
          }
        )
        if (res.ok) {
          const json = await res.json()
          setRevenueData(Array.isArray(json.series) ? json.series : [])
          const pm = Array.isArray(json.paymentMethods)
            ? json.paymentMethods
            : []
          setPaymentMethodData(
            pm.map((m: any) => ({
              ...m,
              color: PAYMENT_COLORS[m.name] || '#94A3B8'
            }))
          )
        } else {
          setRevenueData([])
          setPaymentMethodData([])
        }
      } catch (e: any) {
        setError(null)
        setRevenueData([])
        setPaymentMethodData([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedPeriod])

  const handleDataPointClick = (data: any) => {
    setSelectedDataPoint(data)
    setShowBreakdownModal(true)
  }

  return (
    <div className='space-y-6'>
      {/* Temporal Filters */}
      <Card className='bg-white border-[#E2E8F0]'>
        <CardContent className='p-6'>
          <div className='flex flex-wrap items-center gap-4'>
            <div className='flex items-center gap-2'>
              <Button
                size='sm'
                variant={selectedPeriod === 'month' ? 'default' : 'outline'}
                onClick={() => setSelectedPeriod('month')}
                className='h-8 text-xs'
              >
                Último mes
              </Button>
              <Button
                size='sm'
                variant={selectedPeriod === 'quarter' ? 'default' : 'outline'}
                onClick={() => setSelectedPeriod('quarter')}
                className='h-8 text-xs'
              >
                Últimos 3 meses
              </Button>
              <Button
                size='sm'
                variant={selectedPeriod === 'year' ? 'default' : 'outline'}
                onClick={() => setSelectedPeriod('year')}
                className='h-8 text-xs'
              >
                Último año
              </Button>
              <Button
                size='sm'
                variant={selectedPeriod === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedPeriod('all')}
                className='h-8 text-xs'
              >
                Todo
              </Button>
            </div>

            <div className='flex items-center gap-2 ml-auto'>
              <Button
                size='sm'
                variant={showComparison ? 'default' : 'outline'}
                onClick={() => setShowComparison(!showComparison)}
                className='h-8 text-xs'
              >
                <TrendingUp className='h-3 w-3 mr-1' />
                Comparar periodo anterior
              </Button>

              <Select>
                <SelectTrigger className='w-40 h-8 text-xs'>
                  <SelectValue placeholder='Rango personalizado' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='custom'>Rango personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Chart */}
      <Card className='bg-white border-[#E2E8F0]'>
        <CardHeader className='p-6 pb-4'>
          <CardTitle className='text-xl font-semibold text-[#0F172A] leading-snug'>
            Análisis de Ingresos
          </CardTitle>
          <p className='text-sm text-[#64748B]'>
            Haz clic en cualquier punto para ver el desglose detallado
          </p>
        </CardHeader>
        <CardContent className='p-6 pt-0'>
          {error && <div className='text-sm text-red-600'>{error}</div>}
          {loading ? (
            <div className='text-sm text-[#94A3B8]'>Cargando...</div>
          ) : revenueData.length === 0 ? (
            <div className='text-sm text-[#94A3B8]'>
              No hay datos de ingresos para el periodo seleccionado.
            </div>
          ) : (
            <div className='h-80'>
              <ResponsiveContainer width='100%' height='100%'>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray='3 3' stroke='#E2E8F0' />
                  <XAxis dataKey='month' stroke='#64748B' fontSize={12} />
                  <YAxis
                    stroke='#64748B'
                    fontSize={12}
                    tickFormatter={(value) =>
                      `€${Number(value).toLocaleString()}`
                    }
                  />
                  <Tooltip
                    formatter={(value: any) => [
                      `€${Number(value).toLocaleString()}`,
                      'Ingresos'
                    ]}
                    labelStyle={{ color: '#0F172A' }}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    type='monotone'
                    dataKey='revenue'
                    stroke='#14B8A6'
                    strokeWidth={3}
                    dot={{ fill: '#14B8A6', strokeWidth: 2, r: 4 }}
                    activeDot={{
                      r: 6,
                      fill: '#14B8A6',
                      cursor: 'pointer',
                      onClick: handleDataPointClick
                    }}
                  />
                  {showComparison && (
                    <Line
                      type='monotone'
                      dataKey='previousYear'
                      stroke='#94A3B8'
                      strokeWidth={2}
                      strokeDasharray='5 5'
                      dot={{ fill: '#94A3B8', strokeWidth: 2, r: 3 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue Breakdown Modal */}
      <Dialog open={showBreakdownModal} onOpenChange={setShowBreakdownModal}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Calendar className='h-5 w-5 text-[#14B8A6]' />
              Desglose de Ingresos - {selectedDataPoint?.month}
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-6'>
            {/* Monthly Breakdown */}
            <div>
              <h3 className='text-lg font-semibold text-[#0F172A] mb-3'>
                Resumen Mensual
              </h3>
              <div className='grid grid-cols-2 gap-4'>
                <div className='bg-[#F8FAFC] p-4 rounded-lg'>
                  <div className='text-2xl font-bold text-[#0F172A]'>
                    €{Number(selectedDataPoint?.revenue || 0).toLocaleString()}
                  </div>
                  <div className='text-sm text-[#64748B]'>Ingresos totales</div>
                </div>
                <div className='bg-[#F8FAFC] p-4 rounded-lg'>
                  <div className='text-2xl font-bold text-[#10B981]'>
                    +
                    {selectedDataPoint?.previousYear
                      ? Math.round(
                          (((selectedDataPoint?.revenue || 0) -
                            (selectedDataPoint?.previousYear || 0)) /
                            (selectedDataPoint?.previousYear || 1)) *
                            100
                        )
                      : 0}
                    %
                  </div>
                  <div className='text-sm text-[#64748B]'>vs año anterior</div>
                </div>
              </div>
            </div>

            {/* Payment Methods Distribution */}
            <div>
              <h3 className='text-lg font-semibold text-[#0F172A] mb-3'>
                Distribución por Método de Pago
              </h3>
              <div className='flex items-center gap-6'>
                <div className='h-48 w-48'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <PieChart>
                      <Pie
                        data={paymentMethodData}
                        cx='50%'
                        cy='50%'
                        innerRadius={40}
                        outerRadius={80}
                        dataKey='value'
                      >
                        {paymentMethodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className='flex-1 space-y-2'>
                  {paymentMethodData.map((method) => (
                    <div
                      key={method.name}
                      className='flex items-center justify-between'
                    >
                      <div className='flex items-center gap-2'>
                        <div
                          className='w-3 h-3 rounded-full'
                          style={{ backgroundColor: method.color }}
                        />
                        <span className='text-sm text-[#64748B]'>
                          {method.name}
                        </span>
                      </div>
                      <span className='text-sm font-medium text-[#0F172A]'>
                        {method.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Revenue Sources */}
            <div>
              <h3 className='text-lg font-semibold text-[#0F172A] mb-3'>
                Principales Fuentes de Ingresos
              </h3>
              <div className='space-y-2'>
                {(selectedDataPoint?.topSources || []).length === 0 ? (
                  <div className='text-sm text-[#94A3B8]'>
                    No hay desglose disponible.
                  </div>
                ) : (
                  (selectedDataPoint?.topSources || []).map((item: any) => (
                    <div
                      key={item.source}
                      className='flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg'
                    >
                      <div>
                        <div className='font-medium text-[#0F172A]'>
                          {item.source}
                        </div>
                        <div className='text-sm text-[#64748B]'>
                          {item.percentage}% del total
                        </div>
                      </div>
                      <div className='text-lg font-semibold text-[#14B8A6]'>
                        €{Number(item.amount).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
