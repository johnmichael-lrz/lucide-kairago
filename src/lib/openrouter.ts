import { createOpenAI } from '@ai-sdk/openai'

export const PRIMARY_MODEL = 'anthropic/claude-sonnet-4-6'
export const FALLBACK_MODEL = 'deepseek/deepseek-chat'

export function createOpenRouterClient() {
  return createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    headers: {
      'HTTP-Referer': 'https://kairago.vercel.app',
      'X-Title': 'Kairago',
    },
  })
}
