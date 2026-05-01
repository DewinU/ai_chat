import { createOpenRouter } from '@openrouter/ai-sdk-provider'

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY ?? '',
})

export function getChatModel() {
  const modelId = process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini'
  return openrouter.chat(modelId)
}
