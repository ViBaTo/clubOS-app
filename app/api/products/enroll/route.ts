import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { client_id, product_id } = body || {}

    if (!client_id || !product_id) {
      return NextResponse.json(
        { error: 'client_id and product_id are required' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Client enrolled successfully (mock)',
      enrollment: {
        id: `enroll-${Date.now()}`,
        client_id,
        product_id,
        enrolled_at: new Date().toISOString(),
        status: 'active'
      }
    }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}
