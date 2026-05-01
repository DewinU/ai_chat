import { z } from "zod"

import prisma from "@/lib/prisma"
import { readAllStreamChunks, readStreamChunksFrom, streamKey } from "@/lib/redis"

export const maxDuration = 300

const querySchema = z.object({
  conversationId: z.string().min(1),
  messageId: z.string().min(1),
})

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = querySchema.safeParse({
    conversationId: url.searchParams.get("conversationId") ?? undefined,
    messageId: url.searchParams.get("messageId") ?? undefined,
  })
  if (!parsed.success) {
    return new Response("Missing or invalid conversationId / messageId", { status: 400 })
  }
  const { conversationId, messageId } = parsed.data

  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      conversationId,
      role: "assistant",
    },
  })
  if (!message) {
    return new Response("Not found", { status: 404 })
  }

  const encoder = new TextEncoder()
  const signal = request.signal
  const key = streamKey(conversationId, messageId)

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enqueue = (s: string) => controller.enqueue(encoder.encode(s))

      const sendEvent = (event: string, data: unknown) => {
        enqueue(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
      }

      try {
        if (message.status !== "streaming") {
          sendEvent("sync", { text: message.content })
          sendEvent("done", { status: message.status })
          controller.close()
          return
        }

        const chunks = await readAllStreamChunks(key)
        sendEvent("sync", { text: chunks.join("") })
        let nextIndex = chunks.length

        while (!signal.aborted) {
          const fresh = await prisma.message.findUnique({
            where: { id: messageId },
            select: { status: true, content: true },
          })
          if (!fresh) {
            sendEvent("error", { message: "Message was deleted" })
            break
          }

          const newChunks = await readStreamChunksFrom(key, nextIndex)
          for (const text of newChunks) {
            sendEvent("token", { text })
            nextIndex += 1
          }

          if (fresh.status !== "streaming") {
            sendEvent("done", { status: fresh.status })
            break
          }

          await sleep(100)
        }
      } catch (e) {
        console.error("stream route", e)
        try {
          sendEvent("error", { message: "Stream failed" })
        } catch {
          /* ignore */
        }
      } finally {
        try {
          controller.close()
        } catch {
          /* ignore */
        }
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
