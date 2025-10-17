import { NextResponse } from 'next/server'
import { getSupabaseRouteClientWithAuth } from '@/src/lib/supabaseServer'

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseRouteClientWithAuth(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { client_id, product_id, quantity, unit_price, total_price, status, organization_id } = body

    if (!client_id || !product_id || !organization_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create product_sale (enrollment)
    const { data, error } = await supabase.from('product_sales').insert({
      client_id,
      product_id,
      organization_id,
      quantity: quantity || 1,
      unit_price: unit_price || 0,
      total_price: total_price || 0,
      status: status || 'active',
      payment_status: 'pending'
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ enrollment: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}

