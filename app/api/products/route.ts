import { NextResponse } from 'next/server'
import { getSupabaseRouteClientWithAuth } from '@/src/lib/supabaseServer'

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseRouteClientWithAuth(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const productType = searchParams.get('type') || undefined
    let query = supabase.from('products').select('*').order('created_at', { ascending: false })
    if (productType) query = query.eq('product_type', productType)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ products: data })
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

    // Resolve user's organization
    let organization_id: string | null = null
    const { data: orgRow } = await supabase
      .from('organization_users')
      .select('organization_id, is_primary, created_at')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    organization_id = orgRow?.organization_id ?? null

    const insertPayload: Record<string, any> = {
      name,
      description: description ?? null,
      product_type,
      price: price ?? 0,
      currency,
      duration_days: duration_days ?? null,
      classes_included: classes_included ?? null,
      is_active,
      display_order,
      configuration: configuration ?? {},
    }
    if (organization_id) insertPayload.organization_id = organization_id

    const { data: created, error } = await supabase
      .from('products')
      .insert(insertPayload)
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ product: created }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}


