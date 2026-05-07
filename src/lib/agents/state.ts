import { Annotation } from '@langchain/langgraph'

export const AgentStateAnnotation = Annotation.Root({
  barangay_name: Annotation<string>(),
  coordinates: Annotation<{ lat: number; lng: number }>(),
  raw_nasa_power: Annotation<Record<string, unknown>>(),
  raw_noaa: Annotation<Record<string, unknown>>(),
  normalized_data: Annotation<Record<string, unknown>>(),
  risk_score: Annotation<number>(),
  risk_level: Annotation<string>(),
  retrieved_context: Annotation<string>(),
  bulletin_draft: Annotation<Record<string, unknown>>(),
  quality_check_result: Annotation<{ passed: boolean; issues: string[] }>(),
  approved_bulletin: Annotation<Record<string, unknown>>(),
  retry_count: Annotation<number>(),
  timestamp: Annotation<string>(),
  error: Annotation<string | undefined>(),
})

export type AgentState = typeof AgentStateAnnotation.State
