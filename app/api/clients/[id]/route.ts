import { NextResponse } from 'next/server'
import { mockDataStore, mockCategories } from '@/src/data/mock-data'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const client = mockDataStore.clients.find(c => c.id === id)
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json({ client })
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
    const { id } = await context.params
    const body = await request.json()

    const clientIndex = mockDataStore.clients.findIndex(c => c.id === id)
    if (clientIndex === -1) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

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

    // Update category_name if categoria_id changed
    if (payload.categoria_id) {
      const category = mockCategories.find(c => c.id === payload.categoria_id)
      payload.category_name = category?.name ?? null
    }

    // Update the client
    mockDataStore.clients[clientIndex] = {
      ...mockDataStore.clients[clientIndex],
      ...payload,
      updated_at: new Date().toISOString()
    }

    return NextResponse.json({ client: mockDataStore.clients[clientIndex] })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const clientIndex = mockDataStore.clients.findIndex(c => c.id === id)
    
    if (clientIndex === -1) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    mockDataStore.clients.splice(clientIndex, 1)

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}
