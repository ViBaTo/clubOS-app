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
    const { sale_id, amount, payment_method, receipt_url } = body || {}

    if (!clientId || !sale_id)
      return NextResponse.json(
        { error: 'sale_id es obligatorio' },
        { status: 400 }
      )

    // Verify sale belongs to client
    const { data: sale, error: saleErr } = await supabase
      .from('product_sales')
      .select('id, client_id, organization_id, total_price')
      .eq('id', sale_id)
      .eq('client_id', clientId)
      .maybeSingle()

    if (saleErr || !sale)
      return NextResponse.json(
        { error: 'Venta no encontrada para este cliente' },
        { status: 404 }
      )

    // Ensure a payment row exists and optionally set receipt_url
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('product_sale_id', sale_id)
      .maybeSingle()

    let paymentId: string | null = existingPayment?.id ?? null
    if (!paymentId) {
      const { data: createdPayment } = await supabase
        .from('payments')
        .insert({
          organization_id: sale.organization_id,
          client_id: clientId,
          product_sale_id: sale_id,
          amount: amount ?? sale.total_price ?? 0,
          payment_method: payment_method ?? 'cash'
        })
        .select('id')
        .single()
      paymentId = createdPayment?.id ?? null
    }

    if (paymentId && receipt_url) {
      await supabase
        .from('payments')
        .update({ receipt_url })
        .eq('id', paymentId)
    }

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

    return NextResponse.json({ sale: updated, payment_id: paymentId })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}
