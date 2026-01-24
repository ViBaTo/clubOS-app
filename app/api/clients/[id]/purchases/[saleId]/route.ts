import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; saleId: string }> }
) {
  try {
    const { id, saleId } = await context.params
    
    // Return a mock purchase
    return NextResponse.json({
      purchase: {
        id: saleId,
        client_id: id,
        product_name: 'Bono 10 Clases',
        purchase_date: '2024-01-15',
        price: 350,
        classes_remaining: 7,
        classes_total: 10,
        expires_at: '2024-04-15',
        status: 'active'
      }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; saleId: string }> }
) {
  try {
    const { saleId } = await context.params
    
    return NextResponse.json({ success: true, deleted_id: saleId })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}
