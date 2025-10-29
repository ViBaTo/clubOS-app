import { NextResponse } from 'next/server'
import { getSupabaseRouteClientWithAuth } from '@/app/lib/supabaseServer'

export async function POST(
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

    const { id: clientId } = await context.params
    const body = await request.json().catch(() => ({}))
    const { sale_id } = body || {}

    if (!clientId || !sale_id)
      return NextResponse.json(
        { error: 'sale_id es obligatorio' },
        { status: 400 }
      )

    // Verify sale belongs to client
    const { data: sale, error: saleErr } = await supabase
      .from('product_sales')
      .select('id, client_id')
      .eq('id', sale_id)
      .eq('client_id', clientId)
      .maybeSingle()

    if (saleErr || !sale)
      return NextResponse.json(
        { error: 'Venta no encontrada para este cliente' },
        { status: 404 }
      )

    const { data: updated, error: updateErr } = await supabase
      .from('product_sales')
      .update({
        payment_status: 'paid',
        last_payment_date: new Date().toISOString()
      })
      .eq('id', sale_id)
      .select('id, payment_status, last_payment_date')
      .single()

    if (updateErr)
      return NextResponse.json({ error: updateErr.message }, { status: 400 })

    return NextResponse.json({ sale: updated })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}
