export type SidebarConversation = {
  id: string
  title: string
  createdAt: string
}

export type ChatMessageDTO = {
  id: string
  role: 'user' | 'assistant'
  content: string
  status: 'streaming' | 'completed' | 'failed'
  createdAt: string
}

export type ChatInitialPayload = {
  conversationId: string
  title: string
  initialMessages: ChatMessageDTO[]
  initialStreamingAssistantId: string | null
}
