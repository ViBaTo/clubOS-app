import { NextResponse } from 'next/server'
import { mockDataStore, generateProductId } from '@/src/data/mock-data'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productType = searchParams.get('type') || undefined

    let products = [...mockDataStore.products]

    // Filter by product type
    if (productType) {
      products = products.filter(p => p.product_type === productType)
    }

    // Sort by display_order, then created_at
    products.sort((a, b) => {
      if (a.display_order !== b.display_order) {
        return a.display_order - b.display_order
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return NextResponse.json({ products })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      product_type,
      price,
      currency = 'EUR',
      duration_days,
      classes_included,
      is_active = true,
      display_order = 0,
      configuration
    } = body || {}

    if (!name || !product_type) {
      return NextResponse.json({ error: 'name and product_type are required' }, { status: 400 })
    }

    const newProduct = {
      id: generateProductId(),
      name,
      description: description ?? null,
      product_type: product_type as 'bono' | 'clase' | 'academia' | 'membership',
      price: price ?? 0,
      currency,
      duration_days: duration_days ?? null,
      classes_included: classes_included ?? null,
      is_active,
      display_order,
      configuration: configuration ?? {},
      organization_id: 'org-001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    mockDataStore.products.push(newProduct)

    return NextResponse.json({ product: newProduct }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}
