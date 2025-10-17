import { NextResponse } from 'next/server'
import { getSupabaseRouteClientWithAuth } from '@/src/lib/supabaseServer'

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


