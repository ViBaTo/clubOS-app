import { NextResponse } from 'next/server'
import { getSupabaseRouteClientWithAuth } from '@/app/lib/supabaseServer'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseRouteClientWithAuth(request)
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await context.params

    const { data, error } = await supabase
      .from('product_sales')
      .select(
        `id, client_id, product_id, organization_id, quantity, unit_price, total_price, discount, status, payment_status, classes_total, classes_remaining, expiry_date, created_at, updated_at, products ( name, product_type )`
      )
      .eq('client_id', id)
      .order('created_at', { ascending: false })

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ purchases: data ?? [] })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}
