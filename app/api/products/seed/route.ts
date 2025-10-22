// Removed. Seeding is now done via scripts/seed/seed-products.js
export async function POST() {
  return NextResponse.json({ error: 'Disabled. Use scripts/seed/seed-products.js.' }, { status: 410 })
}


