import { after } from "next/server"
import { NextResponse } from "next/server"
import { z } from "zod"

import prisma from "@/lib/prisma"
import { runAssistantGeneration } from "@/lib/stream-assistant"

export const maxDuration = 300

const bodySchema = z.object({
  prompt: z.string().min(1).max(32000),
  conversationId: z.string().min(1).optional(),
})

export async function POST(request: Request) {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { prompt, conversationId } = parsed.data

  if (!conversationId) {
    const title = prompt.slice(0, 80).trim() || "New chat"
    const { conversationId: convId, assistantMessageId } = await prisma.$transaction(
      async (tx) => {
        const conv = await tx.conversation.create({ data: { title } })
        await tx.message.create({
          data: {
            conversationId: conv.id,
            role: "user",
            content: prompt,
            status: "completed",
          },
        })
        const assistant = await tx.message.create({
          data: {
            conversationId: conv.id,
            role: "assistant",
            content: "",
            status: "streaming",
          },
        })
        return { conversationId: conv.id, assistantMessageId: assistant.id }
      }
    )
    after(async () => {
      await runAssistantGeneration({
        conversationId: convId,
        assistantMessageId,
      })
    })
    return NextResponse.json({
      conversationId: convId,
      assistantMessageId,
    })
  }

  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  })
  if (!convo) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
  }
  const last = convo.messages[0]
  if (last?.status === "streaming") {
    return NextResponse.json(
      { error: "Wait for the current reply to finish before sending another message." },
      { status: 409 }
    )
  }

  const assistantMessageId = await prisma.$transaction(async (tx) => {
    await tx.message.create({
      data: {
        conversationId,
        role: "user",
        content: prompt,
        status: "completed",
      },
    })
    const assistant = await tx.message.create({
      data: {
        conversationId,
        role: "assistant",
        content: "",
        status: "streaming",
      },
    })
    return assistant.id
  })

  after(async () => {
    await runAssistantGeneration({
      conversationId,
      assistantMessageId,
    })
  })

  return NextResponse.json({
    conversationId,
    assistantMessageId,
  })
}
