import { NextRequest, NextResponse } from 'next/server'
import {
  searchExercises,
  getBodyParts,
  getEquipmentList,
  getExercisesByBodyPart,
  getExercisesByEquipment,
} from '@/lib/exercisedb'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action') || 'search'
  const query = searchParams.get('q') || 'chest'
  const bodyPart = searchParams.get('bodyPart') || ''
  const equipment = searchParams.get('equipment') || ''
  const limit = parseInt(searchParams.get('limit') || '30', 10)

  try {
    switch (action) {
      case 'bodyParts': {
        const data = await getBodyParts()
        return NextResponse.json(data, { headers: { 'Cache-Control': 's-maxage=86400' } })
      }
      case 'equipment': {
        const data = await getEquipmentList()
        return NextResponse.json(data, { headers: { 'Cache-Control': 's-maxage=86400' } })
      }
      case 'byBodyPart': {
        const data = await getExercisesByBodyPart(bodyPart, limit)
        return NextResponse.json(data, { headers: { 'Cache-Control': 's-maxage=3600' } })
      }
      case 'byEquipment': {
        const data = await getExercisesByEquipment(equipment, limit)
        return NextResponse.json(data, { headers: { 'Cache-Control': 's-maxage=3600' } })
      }
      case 'search':
      default: {
        const data = await searchExercises(query, limit)
        return NextResponse.json(data, { headers: { 'Cache-Control': 's-maxage=3600' } })
      }
    }
  } catch (err) {
    console.error('[exercises API]', err)
    return NextResponse.json([], { status: 500 })
  }
}
