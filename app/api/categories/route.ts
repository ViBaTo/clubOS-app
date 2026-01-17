import { NextResponse } from 'next/server'
import { mockCategories } from '@/src/data/mock-data'

export async function GET() {
  try {
    // Sort categories by name
    const categories = [...mockCategories]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(c => ({ id: c.id, name: c.name }))

    return NextResponse.json({ categories })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}
