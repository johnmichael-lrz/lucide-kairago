@AGENTS.md

# Kairago — Project Context for Claude Code

## What this is
Kairago is a hyperlocal environmental risk intelligence platform for the Philippines built with Next.js 15 App Router, TypeScript, Tailwind CSS, and shadcn/ui. It converts satellite and environmental data from PAGASA, NASA POWER, NOAA, and PHIVOLCS into plain-language 72-hour risk bulletins for Philippine barangays.

## Tech stack
Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui, Lucide icons, Plus Jakarta Sans, Supabase with pgvector, LangGraph, LlamaIndex, OpenRouter, PydanticAI, Langfuse, Voyage AI, Cohere, Mem0, Vercel AI SDK.

## Critical rules
- All npm installs must use --legacy-peer-deps
- Never hardcode API keys — always use process.env
- Always run npm run build after completing each phase
- All bulletin text must be in English at Grade 6 reading level
- Use "your community" as the subject in all bulletin text, never "you" or "residents"

## Project structure
- Frontend is complete with seeded data in src/app
- Home page at / — src/app/page.tsx
- Map page at /map — src/app/map/page.tsx
- History page at /history — src/app/history/page.tsx
- About page at /about — src/app/about/page.tsx
- Settings page at /settings — src/app/settings/page.tsx
- Bottom navigation at src/components/bottom-nav.tsx

## Risk levels
SAFE, MODERATE RISK, EVACUATE NOW

## Supabase
Project ID: xksubpixblzhltxpbrck
pgvector is already enabled
Use the new Supabase API key format — publishable key for anon, secret key for service role

## Three seeded barangays
- Barangay Pag-asa: 14.6507 lat, 121.0794 lng
- Barangay San Roque Marikina: 14.6507 lat, 121.1000 lng
- Barangay Poblacion Leyte: 11.2442 lat, 124.9996 lng