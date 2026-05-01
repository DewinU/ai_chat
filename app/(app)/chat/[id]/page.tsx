import { notFound } from "next/navigation"

import prisma from "@/lib/prisma"

import { ChatRoom, type ChatMessageDTO } from "./chat-room"

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  })
  if (!conversation) {
    notFound()
  }

  const initialMessages: ChatMessageDTO[] = conversation.messages.map((m) => ({
    id: m.id,
    role: m.role === "user" ? "user" : "assistant",
    content: m.content,
    status: m.status,
    createdAt: m.createdAt.toISOString(),
  }))

  const lastAssistant = [...conversation.messages]
    .reverse()
    .find((m) => m.role === "assistant")
  const initialStreamingAssistantId =
    lastAssistant?.status === "streaming" ? lastAssistant.id : null

  return (
    <ChatRoom
      key={`${conversation.id}:${initialStreamingAssistantId ?? "idle"}`}
      conversationId={conversation.id}
      title={conversation.title}
      initialMessages={initialMessages}
      initialStreamingAssistantId={initialStreamingAssistantId}
    />
  )
}
