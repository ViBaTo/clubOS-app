import { NextResponse } from 'next/server'
import { getSupabaseRouteClientWithAuth } from '@/app/lib/supabaseServer'

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

    // Check if client is already enrolled in this product
    const { data: existingEnrollment } = await supabase
      .from('product_sales')
      .select('id')
      .eq('client_id', client_id)
      .eq('product_id', product_id)
      .eq('status', 'active')
      .maybeSingle()

    if (existingEnrollment) {
      return NextResponse.json({ error: 'Este cliente ya está inscrito en esta clase' }, { status: 400 })
    }

    // Get current product to check available spots
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('configuration')
      .eq('id', product_id)
      .single()

    if (productError) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const config = product.configuration || {}
    const availableSpots = config.availableSpots || 0
    
    // Check if spots are available
    if (availableSpots <= 0) {
      return NextResponse.json({ error: 'No hay plazas disponibles' }, { status: 400 })
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

    // Update product: decrement availableSpots and update status if full
    const newAvailableSpots = availableSpots - 1
    const updatedConfig = {
      ...config,
      availableSpots: newAvailableSpots,
      status: newAvailableSpots <= 0 ? 'Completa' : (config.status || 'Disponible')
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({ configuration: updatedConfig })
      .eq('id', product_id)

    if (updateError) {
      console.error('Failed to update product spots:', updateError)
      // Don't fail the enrollment if spot update fails
    }

    return NextResponse.json({ enrollment: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}

