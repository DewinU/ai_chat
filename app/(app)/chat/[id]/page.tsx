import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import prisma from '@/lib/prisma'

import { loadChatPageData } from '../../../../lib/data'
import { ChatRoom } from './chat-room'
import { ChatRoomSkeleton } from './chat-room-skeleton'

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const exists = await prisma.conversation.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!exists) {
    notFound()
  }

  const conversationPromise = loadChatPageData(id)

  return (
    <Suspense fallback={<ChatRoomSkeleton />}>
      <ChatRoom conversationPromise={conversationPromise} />
    </Suspense>
  )
}
