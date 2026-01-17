import { NextResponse } from 'next/server'
import { mockDataStore, generateClientId, mockCategories } from '@/src/data/mock-data'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const q = searchParams.get('q') || ''

    let clients = [...mockDataStore.clients]

    // Filter by status
    if (status && status !== 'all') {
      clients = clients.filter(c => c.status === status)
    }

    // Filter by search query
    if (q) {
      const query = q.toLowerCase()
      clients = clients.filter(c => 
        c.full_name.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query)
      )
    }

    // Sort by created_at descending
    clients.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({ clients })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      full_name,
      email,
      phone,
      document_id,
      categoria_id,
      status = 'active',
      internal_notes,
      communications_consent = true,
      deletion_request = false,
      data_anonymized = false,
      pending_balance = 0,
      last_class_date
    } = body || {}

    if (!full_name) {
      return NextResponse.json(
        { error: 'full_name is required' },
        { status: 400 }
      )
    }

    // Find category name if categoria_id provided
    const category = categoria_id 
      ? mockCategories.find(c => c.id === categoria_id)
      : null

    const newClient = {
      id: generateClientId(),
      full_name,
      email: email ?? null,
      phone: phone ?? null,
      document_id: document_id ?? null,
      categoria_id: categoria_id ?? null,
      category_name: category?.name ?? null,
      status: status as 'active' | 'inactive' | 'prospect',
      internal_notes: internal_notes ?? null,
      communications_consent,
      deletion_request,
      data_anonymized,
      pending_balance,
      last_class_date: last_class_date ?? null,
      organization_id: 'org-001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    mockDataStore.clients.push(newClient)

    return NextResponse.json({ client: newClient }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}
