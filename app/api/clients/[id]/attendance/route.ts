import { NextResponse } from 'next/server'

// Mock attendance data
const mockAttendance = [
  { id: 'att-1', date: '2024-01-15', class_type: 'Clase particular', instructor: 'Ana García', status: 'attended' },
  { id: 'att-2', date: '2024-01-12', class_type: 'Clase grupal', instructor: 'Carlos Méndez', status: 'attended' },
  { id: 'att-3', date: '2024-01-10', class_type: 'Academia', instructor: 'María López', status: 'missed' },
  { id: 'att-4', date: '2024-01-08', class_type: 'Clase particular', instructor: 'Ana García', status: 'attended' },
  { id: 'att-5', date: '2024-01-05', class_type: 'Clase grupal', instructor: 'David Ruiz', status: 'attended' },
]

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    // Return mock attendance for the client
    return NextResponse.json({
      attendance: mockAttendance,
      summary: {
        total: mockAttendance.length,
        attended: mockAttendance.filter(a => a.status === 'attended').length,
        missed: mockAttendance.filter(a => a.status === 'missed').length,
      }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}
