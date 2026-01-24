import { NextResponse } from 'next/server'
import { getSupabaseRouteClientWithAuth } from '@/app/lib/supabaseServer'

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; saleId: string }> }
) {
  try {
    const supabase = getSupabaseRouteClientWithAuth(request)
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: clientId, saleId } = await context.params

    // Verify sale belongs to client
    const { data: sale, error: saleErr } = await supabase
      .from('product_sales')
      .select('id, client_id')
      .eq('id', saleId)
      .maybeSingle()

    if (saleErr || !sale || sale.client_id !== clientId)
      return NextResponse.json(
        { error: 'Paquete no encontrado para este cliente' },
        { status: 404 }
      )

    // Delete dependent records first (payments, class_usage), then the sale
    const { error: payErr } = await supabase
      .from('payments')
      .delete()
      .eq('product_sale_id', saleId)
    if (payErr)
      return NextResponse.json({ error: payErr.message }, { status: 400 })

    const { error: usageErr } = await supabase
      .from('class_usage')
      .delete()
      .eq('sale_id', saleId)
    if (usageErr)
      return NextResponse.json({ error: usageErr.message }, { status: 400 })

    const { error: delErr } = await supabase
      .from('product_sales')
      .delete()
      .eq('id', saleId)
    if (delErr)
      return NextResponse.json({ error: delErr.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}
