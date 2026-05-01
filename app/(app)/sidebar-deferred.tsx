'use client'

import { use } from 'react'

import type { SidebarConversation } from '../../lib/types'

import { Sidebar } from './sidebar'

export function SidebarDeferred({
  conversationsPromise,
}: {
  conversationsPromise: Promise<SidebarConversation[]>
}) {
  const conversations = use(conversationsPromise)
  return <Sidebar conversations={conversations} />
}
