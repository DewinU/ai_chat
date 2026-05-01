import prisma from '@/lib/prisma'

import type {
  ChatInitialPayload,
  ChatMessageDTO,
  SidebarConversation,
} from './types'

export async function loadSidebarConversations(): Promise<
  SidebarConversation[]
> {
  const rows = await prisma.conversation.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, createdAt: true },
  })
  return rows.map(c => ({
    id: c.id,
    title: c.title,
    createdAt: c.createdAt.toISOString(),
  }))
}

export async function loadChatPageData(
  id: string,
): Promise<ChatInitialPayload> {
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!conversation) {
    throw new Error('Conversation not found')
  }

  const initialMessages: ChatMessageDTO[] = conversation.messages.map(m => ({
    id: m.id,
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content,
    status: m.status,
    createdAt: m.createdAt.toISOString(),
  }))

  const lastAssistant = [...conversation.messages]
    .reverse()
    .find(m => m.role === 'assistant')
  const initialStreamingAssistantId =
    lastAssistant?.status === 'streaming' ? lastAssistant.id : null

  return {
    conversationId: conversation.id,
    title: conversation.title,
    initialMessages,
    initialStreamingAssistantId,
  }
}
