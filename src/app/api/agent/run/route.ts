import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { findBarangayByName } from '@/lib/barangay-geocoding'
import { runPipeline } from '@/lib/agents/pipeline'

const requestSchema = z.object({
  barangay_name: z.string().min(1),
  coordinates: z
    .object({ lat: z.number(), lng: z.number() })
    .optional(),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { barangay_name, coordinates: providedCoords } = parsed.data

  let coordinates = providedCoords
  if (!coordinates) {
    const barangay = findBarangayByName(barangay_name)
    if (!barangay) {
      return NextResponse.json(
        { error: `Barangay "${barangay_name}" not found. Provide coordinates or use a seeded barangay.` },
        { status: 404 },
      )
    }
    coordinates = { lat: barangay.latitude, lng: barangay.longitude }
  }

  try {
    let latestBulletin:
      | {
          data: unknown
          barangay: string
          environmental_data: unknown
        }
      | undefined

    for await (const event of runPipeline(barangay_name, coordinates)) {
      if (event.type === 'bulletin') latestBulletin = event
      if (event.type === 'error') throw new Error(event.message)
    }

    if (!latestBulletin) {
      return NextResponse.json(
        { error: 'Agent pipeline produced no bulletin' },
        { status: 502 },
      )
    }

    return NextResponse.json({
      bulletin: latestBulletin.data,
      barangay: latestBulletin.barangay,
      environmental_data: latestBulletin.environmental_data,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Agent pipeline failed', details: String(error) },
      { status: 502 },
    )
  }
}
