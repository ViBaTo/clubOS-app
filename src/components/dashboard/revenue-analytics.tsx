"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Cell,
} from "recharts"
import { Calendar, TrendingUp } from "lucide-react"

const revenueData = [
  { month: "Ene", revenue: 32000, previousYear: 28000 },
  { month: "Feb", revenue: 35000, previousYear: 31000 },
  { month: "Mar", revenue: 42000, previousYear: 38000 },
  { month: "Abr", revenue: 38000, previousYear: 35000 },
  { month: "May", revenue: 45000, previousYear: 41000 },
  { month: "Jun", revenue: 48000, previousYear: 43000 },
  { month: "Jul", revenue: 52000, previousYear: 47000 },
  { month: "Ago", revenue: 49000, previousYear: 45000 },
  { month: "Sep", revenue: 46000, previousYear: 42000 },
  { month: "Oct", revenue: 51000, previousYear: 46000 },
  { month: "Nov", revenue: 54000, previousYear: 49000 },
  { month: "Dic", revenue: 58000, previousYear: 52000 },
]

const paymentMethodData = [
  { name: "Tarjeta", value: 45, color: "#14B8A6" },
  { name: "Efectivo", value: 30, color: "#3B82F6" },
  { name: "Transferencia", value: 20, color: "#8B5CF6" },
  { name: "Otros", value: 5, color: "#F59E0B" },
]

export function RevenueAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState("year")
  const [showComparison, setShowComparison] = useState(false)
  const [selectedDataPoint, setSelectedDataPoint] = useState<any>(null)
  const [showBreakdownModal, setShowBreakdownModal] = useState(false)

  const handleDataPointClick = (data: any) => {
    setSelectedDataPoint(data)
    setShowBreakdownModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Temporal Filters */}
      <Card className="bg-white border-[#E2E8F0]">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={selectedPeriod === "month" ? "default" : "outline"}
                onClick={() => setSelectedPeriod("month")}
                className="h-8 text-xs"
              >
                Último mes
              </Button>
              <Button
                size="sm"
                variant={selectedPeriod === "quarter" ? "default" : "outline"}
                onClick={() => setSelectedPeriod("quarter")}
                className="h-8 text-xs"
              >
                Últimos 3 meses
              </Button>
              <Button
                size="sm"
                variant={selectedPeriod === "year" ? "default" : "outline"}
                onClick={() => setSelectedPeriod("year")}
                className="h-8 text-xs"
              >
                Último año
              </Button>
              <Button
                size="sm"
                variant={selectedPeriod === "all" ? "default" : "outline"}
                onClick={() => setSelectedPeriod("all")}
                className="h-8 text-xs"
              >
                Todo
              </Button>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                size="sm"
                variant={showComparison ? "default" : "outline"}
                onClick={() => setShowComparison(!showComparison)}
                className="h-8 text-xs"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Comparar periodo anterior
              </Button>

              <Select>
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue placeholder="Rango personalizado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Rango personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Chart */}
      <Card className="bg-white border-[#E2E8F0]">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-xl font-semibold text-[#0F172A] leading-snug">Análisis de Ingresos</CardTitle>
          <p className="text-sm text-[#64748B]">Haz clic en cualquier punto para ver el desglose detallado</p>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} tickFormatter={(value) => `€${value.toLocaleString()}`} />
                <Tooltip
                  formatter={(value: any) => [`€${value.toLocaleString()}`, "Ingresos"]}
                  labelStyle={{ color: "#0F172A" }}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#14B8A6"
                  strokeWidth={3}
                  dot={{ fill: "#14B8A6", strokeWidth: 2, r: 4 }}
                  activeDot={{
                    r: 6,
                    fill: "#14B8A6",
                    cursor: "pointer",
                    onClick: handleDataPointClick,
                  }}
                />
                {showComparison && (
                  <Line
                    type="monotone"
                    dataKey="previousYear"
                    stroke="#94A3B8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: "#94A3B8", strokeWidth: 2, r: 3 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Breakdown Modal */}
      <Dialog open={showBreakdownModal} onOpenChange={setShowBreakdownModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#14B8A6]" />
              Desglose de Ingresos - {selectedDataPoint?.month}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Monthly Breakdown */}
            <div>
              <h3 className="text-lg font-semibold text-[#0F172A] mb-3">Resumen Mensual</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#F8FAFC] p-4 rounded-lg">
                  <div className="text-2xl font-bold text-[#0F172A]">
                    €{selectedDataPoint?.revenue?.toLocaleString()}
                  </div>
                  <div className="text-sm text-[#64748B]">Ingresos totales</div>
                </div>
                <div className="bg-[#F8FAFC] p-4 rounded-lg">
                  <div className="text-2xl font-bold text-[#10B981]">
                    +
                    {Math.round(
                      ((selectedDataPoint?.revenue - selectedDataPoint?.previousYear) /
                        selectedDataPoint?.previousYear) *
                        100,
                    )}
                    %
                  </div>
                  <div className="text-sm text-[#64748B]">vs año anterior</div>
                </div>
              </div>
            </div>

            {/* Payment Methods Distribution */}
            <div>
              <h3 className="text-lg font-semibold text-[#0F172A] mb-3">Distribución por Método de Pago</h3>
              <div className="flex items-center gap-6">
                <div className="h-48 w-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={paymentMethodData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value">
                        {paymentMethodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {paymentMethodData.map((method) => (
                    <div key={method.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: method.color }} />
                        <span className="text-sm text-[#64748B]">{method.name}</span>
                      </div>
                      <span className="text-sm font-medium text-[#0F172A]">{method.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Revenue Sources */}
            <div>
              <h3 className="text-lg font-semibold text-[#0F172A] mb-3">Principales Fuentes de Ingresos</h3>
              <div className="space-y-2">
                {[
                  { source: "Paquetes de Clases", amount: 18500, percentage: 42 },
                  { source: "Membresías Mensuales", amount: 12800, percentage: 29 },
                  { source: "Clases Individuales", amount: 8900, percentage: 20 },
                  { source: "Productos y Equipos", amount: 3800, percentage: 9 },
                ].map((item) => (
                  <div key={item.source} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                    <div>
                      <div className="font-medium text-[#0F172A]">{item.source}</div>
                      <div className="text-sm text-[#64748B]">{item.percentage}% del total</div>
                    </div>
                    <div className="text-lg font-semibold text-[#14B8A6]">€{item.amount.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
