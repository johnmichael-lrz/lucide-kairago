import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, RAG_TABLES_SQL } from '@/lib/rag/supabase-client'
import { embedText } from '@/lib/rag/embeddings'
import {
  BARANGAY_PROFILES,
  DISASTER_RECORDS,
  NDRRMC_PROTOCOLS,
  type BarangayProfile,
} from '@/lib/rag/seed-data'

// Create all RAG tables by running the DDL via Supabase's SQL exec endpoint.
// Requires service role key — never expose this route without authentication.
async function createTables(): Promise<{ ok: boolean; error?: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return { ok: false, error: 'Missing Supabase env vars' }

  const response = await fetch(`${url}/rest/v1/rpc/exec_ddl`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql: RAG_TABLES_SQL }),
  })

  // exec_ddl may not exist yet — fall through and attempt DML anyway.
  // Tables can also be created via the Supabase dashboard SQL editor.
  if (!response.ok && response.status !== 404) {
    const text = await response.text()
    console.warn('exec_ddl not available or failed:', text)
  }

  return { ok: true }
}

async function seedBarangayProfiles(): Promise<{
  inserted: string[]
  skipped: string[]
  idMap: Record<string, string>
}> {
  const inserted: string[] = []
  const skipped: string[] = []
  const idMap: Record<string, string> = {}

  for (const profile of BARANGAY_PROFILES) {
    // Check if already seeded
    const { data: existing } = await supabaseAdmin
      .from('barangay_profiles')
      .select('id, name')
      .eq('name', profile.name)
      .eq('municipality', profile.municipality)
      .maybeSingle()

    if (existing) {
      idMap[profile.name] = existing.id
      skipped.push(profile.name)
      continue
    }

    const embedding = await embedText(profile.profileText)

    const { data, error } = await supabaseAdmin
      .from('barangay_profiles')
      .insert({
        name: profile.name,
        municipality: profile.municipality,
        province: profile.province,
        elevation: profile.elevation,
        coastal_proximity: profile.coastal_proximity,
        river_basin: profile.river_basin,
        historical_flood_extent: profile.historical_flood_extent,
        evacuation_centers: profile.evacuation_centers,
        embedding,
      })
      .select('id')
      .single()

    if (error) throw new Error(`Failed to insert ${profile.name}: ${error.message}`)
    idMap[profile.name] = data.id
    inserted.push(profile.name)
  }

  return { inserted, skipped, idMap }
}

async function seedDisasterRecords(
  idMap: Record<string, string>,
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0
  let skipped = 0

  for (const record of DISASTER_RECORDS) {
    const barangayId = idMap[record.barangayName]
    if (!barangayId) continue

    const { data: existing } = await supabaseAdmin
      .from('historical_disaster_records')
      .select('id')
      .eq('barangay_id', barangayId)
      .eq('event_name', record.event_name)
      .maybeSingle()

    if (existing) {
      skipped++
      continue
    }

    const docText = `${record.event_name} in ${record.barangayName}: ${record.conditions} ${record.impact}`
    const embedding = await embedText(docText)

    const { error } = await supabaseAdmin.from('historical_disaster_records').insert({
      barangay_id: barangayId,
      event_name: record.event_name,
      event_type: record.event_type,
      date_occurred: record.date_occurred,
      severity: record.severity,
      conditions: record.conditions,
      impact: record.impact,
      embedding,
    })

    if (error) throw new Error(`Failed to insert record ${record.event_name}: ${error.message}`)
    inserted++
  }

  return { inserted, skipped }
}

async function seedNdrrmc(): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0
  let skipped = 0

  for (const protocol of NDRRMC_PROTOCOLS) {
    const { data: existing } = await supabaseAdmin
      .from('ndrrmc_protocols')
      .select('id')
      .eq('alert_level', protocol.alert_level)
      .maybeSingle()

    if (existing) {
      skipped++
      continue
    }

    const docText = `${protocol.alert_level}: ${protocol.protocol_text} ${protocol.recommended_actions.join(' ')}`
    const embedding = await embedText(docText)

    const { error } = await supabaseAdmin.from('ndrrmc_protocols').insert({
      alert_level: protocol.alert_level,
      protocol_text: protocol.protocol_text,
      recommended_actions: protocol.recommended_actions,
      embedding,
    })

    if (error) throw new Error(`Failed to insert protocol ${protocol.alert_level}: ${error.message}`)
    inserted++
  }

  return { inserted, skipped }
}

// POST /api/rag/seed — idempotent seeding endpoint
// Protect with a secret header in production
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('x-seed-secret')
  const expectedSecret = process.env.RAG_SEED_SECRET
  if (expectedSecret && authHeader !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Step 1: Attempt table creation
    await createTables()

    // Step 2: Seed barangay profiles
    const profileResult = await seedBarangayProfiles()

    // Step 3: Seed historical disaster records
    const recordResult = await seedDisasterRecords(profileResult.idMap)

    // Step 4: Seed NDRRMC protocols
    const ndrrmcResult = await seedNdrrmc()

    return NextResponse.json({
      success: true,
      barangay_profiles: profileResult,
      disaster_records: recordResult,
      ndrrmc_protocols: ndrrmcResult,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Seeding failed', details: String(error) },
      { status: 500 },
    )
  }
}

// GET /api/rag/seed — check seeding status
export async function GET() {
  try {
    const [profiles, records, protocols] = await Promise.all([
      supabaseAdmin.from('barangay_profiles').select('id, name, municipality', { count: 'exact' }),
      supabaseAdmin.from('historical_disaster_records').select('id', { count: 'exact' }),
      supabaseAdmin.from('ndrrmc_protocols').select('id, alert_level', { count: 'exact' }),
    ])

    return NextResponse.json({
      barangay_profiles: { count: profiles.count ?? 0, data: profiles.data },
      historical_disaster_records: { count: records.count ?? 0 },
      ndrrmc_protocols: { count: protocols.count ?? 0, data: protocols.data },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Status check failed', details: String(error) },
      { status: 500 },
    )
  }
}
