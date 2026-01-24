import { NextRequest, NextResponse } from 'next/server'
import { mockDataStore } from '@/src/data/mock-data'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = mockDataStore.products.find(p => p.id === id)

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const productIndex = mockDataStore.products.findIndex(p => p.id === id)
    if (productIndex === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const updatable = [
      'name',
      'description',
      'product_type',
      'price',
      'currency',
      'duration_days',
      'classes_included',
      'is_active',
      'display_order',
      'configuration'
    ]

    const payload: Record<string, any> = {}
    for (const key of updatable) {
      if (key in body) payload[key] = body[key]
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
    }

    // Update the product
    mockDataStore.products[productIndex] = {
      ...mockDataStore.products[productIndex],
      ...payload,
      updated_at: new Date().toISOString()
    }

    return NextResponse.json({ product: mockDataStore.products[productIndex] })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productIndex = mockDataStore.products.findIndex(p => p.id === id)

    if (productIndex === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    mockDataStore.products.splice(productIndex, 1)

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}
