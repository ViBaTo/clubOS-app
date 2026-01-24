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
    const {
      sale_id,
      instructor,
      date, // ISO date string
      classes_used = 1,
      facility_id,
      notes
    } = body || {}

    if (!clientId || !sale_id || !instructor)
      return NextResponse.json(
        { error: 'sale_id e instructor son obligatorios' },
        { status: 400 }
      )

    // Verify sale belongs to client and is eligible
    const { data: sale, error: saleErr } = await supabase
      .from('product_sales')
      .select(
        'id, client_id, organization_id, status, classes_total, classes_remaining'
      )
      .eq('id', sale_id)
      .eq('client_id', clientId)
      .maybeSingle()

    if (saleErr || !sale)
      return NextResponse.json(
        { error: 'Venta/paquete no encontrado para este cliente' },
        { status: 404 }
      )

    if (sale.status !== 'active')
      return NextResponse.json(
        { error: 'El paquete no está activo' },
        { status: 400 }
      )

    const safeClassesUsed = Math.max(1, Number(classes_used || 1))

    // Insert usage record
    const { data: usage, error: usageErr } = await supabase
      .from('class_usage')
      .insert({
        organization_id: sale.organization_id,
        sale_id,
        client_id: clientId,
        classes_used: safeClassesUsed,
        description: notes ?? null,
        usage_date: date
          ? new Date(date).toISOString()
          : new Date().toISOString(),
        instructor,
        facility_id: facility_id ?? null,
        notes: notes ?? null
      })
      .select('*')
      .single()

    if (usageErr)
      return NextResponse.json({ error: usageErr.message }, { status: 400 })

    // Decrement classes_remaining if tracked
    let nextRemaining: number | null = null
    let nextStatus: 'active' | 'expired' | 'cancelled' | 'consumed' | undefined
    const total = sale.classes_total as number | null
    const remaining = sale.classes_remaining as number | null
    if (total !== null) {
      const currentRemaining = remaining === null ? total : remaining
      nextRemaining = Math.max(0, currentRemaining - safeClassesUsed)
      if (nextRemaining === 0) nextStatus = 'consumed'
    }

    if (nextRemaining !== null || nextStatus) {
      const updatePayload: Record<string, any> = {}
      if (nextRemaining !== null)
        updatePayload.classes_remaining = nextRemaining
      if (nextStatus) updatePayload.status = nextStatus
      await supabase
        .from('product_sales')
        .update(updatePayload)
        .eq('id', sale_id)
    }

    // Optionally, update last_class_date in clients
    if (date) {
      await supabase
        .from('clients')
        .update({ last_class_date: date })
        .eq('id', clientId)
    }

    return NextResponse.json({ usage, classes_remaining: nextRemaining })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}
