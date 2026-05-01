import { streamText } from "ai"

import { getChatModel } from "@/lib/ai"
import prisma from "@/lib/prisma"
import { appendStreamChunks, deleteStreamKey, streamKey } from "@/lib/redis"

async function buildModelMessages(conversationId: string, excludeAssistantId: string) {
  const rows = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  })
  const messages: { role: "user" | "assistant"; content: string }[] = []
  for (const m of rows) {
    if (m.id === excludeAssistantId) continue
    if (m.role === "assistant" && m.status !== "completed") continue
    messages.push({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    })
  }
  return messages
}

export async function runAssistantGeneration(args: {
  conversationId: string
  assistantMessageId: string
}) {
  const { conversationId, assistantMessageId } = args
  const key = streamKey(conversationId, assistantMessageId)
  try {
    const messages = await buildModelMessages(conversationId, assistantMessageId)
    const result = streamText({
      model: getChatModel(),
      messages,
    })
    for await (const text of result.textStream) {
      if (text) await appendStreamChunks(key, [text])
    }
    const fullText = await result.text
    await prisma.message.update({
      where: { id: assistantMessageId },
      data: { content: fullText, status: "completed" },
    })
    await deleteStreamKey(key).catch(() => {})
  } catch (err) {
    console.error("runAssistantGeneration", err)
    await prisma.message
      .update({
        where: { id: assistantMessageId },
        data: { status: "failed" },
      })
      .catch(() => {})
  }
}
