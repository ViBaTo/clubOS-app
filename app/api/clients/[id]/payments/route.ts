import { NextResponse } from 'next/server'

// Mock payments data
const mockPayments = [
  { id: 'pay-1', date: '2024-01-15', amount: 350, description: 'Bono 10 Clases', method: 'card', status: 'completed' },
  { id: 'pay-2', date: '2024-01-01', amount: 75, description: 'Academia Mensual', method: 'transfer', status: 'completed' },
  { id: 'pay-3', date: '2023-12-15', amount: 45, description: 'Clase Suelta', method: 'cash', status: 'completed' },
  { id: 'pay-4', date: '2023-12-01', amount: 75, description: 'Academia Mensual', method: 'card', status: 'completed' },
]

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    return NextResponse.json({
      payments: mockPayments,
      summary: {
        total_paid: mockPayments.reduce((sum, p) => sum + p.amount, 0),
        count: mockPayments.length,
      }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { amount, description, method = 'cash' } = body || {}

    if (!amount) {
      return NextResponse.json({ error: 'amount is required' }, { status: 400 })
    }

    const newPayment = {
      id: `pay-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount,
      description: description || 'Pago',
      method,
      status: 'completed'
    }

    return NextResponse.json({ payment: newPayment }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}
