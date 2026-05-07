import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function GET() {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('bulletin_history')
      .select('barangay_name, risk_level, timestamp')
      .order('timestamp', { ascending: false })

    if (error) {
      if ((error as { code?: string }).code === '42P01') {
        return Response.json({ risks: {} })
      }
      return Response.json({ error: error.message }, { status: 500 })
    }

    // Keep only the most recent entry per barangay
    const risks: Record<string, string> = {}
    for (const row of data ?? []) {
      if (!risks[row.barangay_name]) {
        risks[row.barangay_name] = row.risk_level
      }
    }

    return Response.json({ risks })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
