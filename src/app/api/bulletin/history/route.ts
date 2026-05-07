import { type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key, { auth: { persistSession: false } })
}

const RISK_LEVEL_MAP: Record<string, string> = {
  HIGH: 'EVACUATE NOW',
  MODERATE: 'MODERATE RISK',
  SAFE: 'SAFE',
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const barangay = searchParams.get('barangay')
  const riskFilter = searchParams.get('risk_level')

  try {
    const supabase = getSupabase()
    let query = supabase
      .from('bulletin_history')
      .select(
        'id, barangay_name, risk_level, bulletin_text, recommended_action, confidence, timestamp',
      )
      .order('timestamp', { ascending: false })
      .limit(10)

    if (barangay) query = query.eq('barangay_name', barangay)

    if (riskFilter && riskFilter !== 'ALL' && RISK_LEVEL_MAP[riskFilter]) {
      query = query.eq('risk_level', RISK_LEVEL_MAP[riskFilter])
    }

    const { data, error } = await query

    if (error) {
      if ((error as { code?: string }).code === '42P01') {
        return Response.json({ bulletins: [] })
      }
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ bulletins: data ?? [] })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
