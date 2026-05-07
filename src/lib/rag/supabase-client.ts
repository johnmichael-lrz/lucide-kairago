import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key, { auth: { persistSession: false } })
}

export const supabaseAdmin = getServiceClient()

// DDL for all five RAG tables — executed via exec_sql RPC
export const RAG_TABLES_SQL = `
create extension if not exists vector;

create table if not exists barangay_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  municipality text not null,
  province text not null,
  elevation float,
  coastal_proximity float,
  river_basin text,
  historical_flood_extent text,
  evacuation_centers text[],
  embedding vector(1024),
  created_at timestamp with time zone default now()
);

create table if not exists historical_disaster_records (
  id uuid primary key default gen_random_uuid(),
  barangay_id uuid references barangay_profiles(id) on delete cascade,
  event_name text not null,
  event_type text not null,
  date_occurred timestamp with time zone,
  severity text,
  conditions text,
  impact text,
  embedding vector(1024),
  created_at timestamp with time zone default now()
);

create table if not exists community_reports (
  id uuid primary key default gen_random_uuid(),
  barangay_id uuid references barangay_profiles(id) on delete cascade,
  observation text not null,
  location_within_barangay text,
  severity text,
  reported_at timestamp with time zone default now(),
  embedding vector(1024)
);

create table if not exists ndrrmc_protocols (
  id uuid primary key default gen_random_uuid(),
  alert_level text not null,
  protocol_text text not null,
  recommended_actions text[],
  embedding vector(1024)
);

create table if not exists scientific_literature (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  source text,
  embedding vector(1024)
);

-- pgvector similarity search functions
create or replace function match_barangay_profiles(
  query_embedding vector(1024),
  match_count int default 3
)
returns table (
  id uuid, name text, municipality text, province text,
  elevation float, coastal_proximity float, river_basin text,
  historical_flood_extent text, evacuation_centers text[],
  similarity float
)
language sql stable as $$
  select id, name, municipality, province, elevation, coastal_proximity,
         river_basin, historical_flood_extent, evacuation_centers,
         1 - (embedding <=> query_embedding) as similarity
  from barangay_profiles
  where embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;

create or replace function match_historical_records(
  query_embedding vector(1024),
  match_count int default 5
)
returns table (
  id uuid, barangay_id uuid, event_name text, event_type text,
  date_occurred timestamp with time zone, severity text,
  conditions text, impact text, similarity float
)
language sql stable as $$
  select id, barangay_id, event_name, event_type, date_occurred,
         severity, conditions, impact,
         1 - (embedding <=> query_embedding) as similarity
  from historical_disaster_records
  where embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;

create or replace function match_ndrrmc_protocols(
  query_embedding vector(1024),
  match_count int default 3
)
returns table (
  id uuid, alert_level text, protocol_text text,
  recommended_actions text[], similarity float
)
language sql stable as $$
  select id, alert_level, protocol_text, recommended_actions,
         1 - (embedding <=> query_embedding) as similarity
  from ndrrmc_protocols
  where embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;
`
