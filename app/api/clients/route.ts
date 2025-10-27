import { NextResponse } from 'next/server'
import { getSupabaseRouteClientWithAuth } from '@/app/lib/supabaseServer'

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseRouteClientWithAuth(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const q = searchParams.get('q') || ''

    let query = supabase.from('clients').select('*').order('created_at', { ascending: false })
    if (status && status !== 'all') query = query.eq('status', status)
    if (q) query = query.ilike('full_name', `%${q}%`)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ clients: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseRouteClientWithAuth(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      full_name,
      email,
      phone,
      document_id,
      categoria_id,
      status = 'active',
      internal_notes,
      communications_consent,
      deletion_request,
      data_anonymized,
      pending_balance,
      last_class_date
    } = body || {}

    if (!full_name) return NextResponse.json({ error: 'full_name is required' }, { status: 400 })

    // Try to resolve user's organization (primary first)
    let organization_id: string | null = null
    try {
      const { data: orgRow } = await supabase
        .from('organization_users')
        .select('organization_id, is_primary, created_at')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      organization_id = orgRow?.organization_id ?? null
    } catch (_) {
      // ignore, rely on DB defaults/triggers/RLS
    }

    const insertPayload: Record<string, any> = {
      full_name,
      email: email ?? null,
      phone: phone ?? null,
      document_id: document_id ?? null,
      status,
    }
    if (categoria_id) insertPayload.categoria_id = categoria_id
    if (internal_notes !== undefined) insertPayload.internal_notes = internal_notes
    if (communications_consent !== undefined) insertPayload.communications_consent = communications_consent
    if (deletion_request !== undefined) insertPayload.deletion_request = deletion_request
    if (data_anonymized !== undefined) insertPayload.data_anonymized = data_anonymized
    if (pending_balance !== undefined) insertPayload.pending_balance = pending_balance
    if (last_class_date !== undefined) insertPayload.last_class_date = last_class_date
    if (organization_id) insertPayload.organization_id = organization_id

    const { data: created, error } = await supabase
      .from('clients')
      .insert(insertPayload)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ client: created }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}


