import { NextResponse } from 'next/server'
import { getSupabaseRouteClientWithAuth } from '@/app/lib/supabaseServer'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseRouteClientWithAuth(_request)
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await context.params
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()
    if (error)
      return NextResponse.json({ error: error.message }, { status: 404 })

    let category_name: string | null = null
    if (data?.categoria_id) {
      const { data: cat, error: catError } = await supabase
        .from('categories')
        .select('name')
        .eq('id', data.categoria_id)
        .maybeSingle()
      if (!catError) category_name = cat?.name ?? null
    }

    return NextResponse.json({ client: { ...data, category_name } })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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
    const body = await request.json()

    const updatableFields = [
      'full_name',
      'email',
      'phone',
      'document_id',
      'categoria_id',
      'status',
      'internal_notes',
      'communications_consent',
      'deletion_request',
      'data_anonymized',
      'pending_balance',
      'last_class_date'
    ]
    const payload: Record<string, any> = {}
    for (const key of updatableFields) {
      if (key in body) payload[key] = body[key]
    }
    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('clients')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ client: data })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}
