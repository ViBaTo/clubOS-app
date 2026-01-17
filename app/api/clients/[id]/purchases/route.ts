import { NextResponse } from 'next/server'

// Mock purchases data
const mockPurchases = [
  { 
    id: 'pur-1', 
    product_name: 'Bono 10 Clases', 
    purchase_date: '2024-01-15',
    price: 350,
    classes_remaining: 7,
    classes_total: 10,
    expires_at: '2024-04-15',
    status: 'active'
  },
  { 
    id: 'pur-2', 
    product_name: 'Academia Adultos', 
    purchase_date: '2024-01-01',
    price: 90,
    classes_remaining: 4,
    classes_total: 8,
    expires_at: '2024-01-31',
    status: 'active'
  },
]

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    return NextResponse.json({ purchases: mockPurchases })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { product_id, product_name, price, classes_included, duration_days } = body || {}

    if (!product_id) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 })
    }

    const expiresAt = duration_days 
      ? new Date(Date.now() + duration_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : null

    const newPurchase = {
      id: `pur-${Date.now()}`,
      product_name: product_name || 'Producto',
      purchase_date: new Date().toISOString().split('T')[0],
      price: price || 0,
      classes_remaining: classes_included || 0,
      classes_total: classes_included || 0,
      expires_at: expiresAt,
      status: 'active'
    }

    return NextResponse.json({ purchase: newPurchase }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}
