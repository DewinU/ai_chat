import { Suspense } from 'react'

import { loadSidebarConversations } from '../../lib/data'
import { SidebarDeferred } from './sidebar-deferred'
import { SidebarLoading } from './sidebar-loading'

export const dynamic = 'force-dynamic'

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const conversationsPromise = loadSidebarConversations()

  return (
    <div className="flex min-h-0 flex-1">
      <Suspense fallback={<SidebarLoading />}>
        <SidebarDeferred conversationsPromise={conversationsPromise} />
      </Suspense>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
