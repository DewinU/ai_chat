'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/shared/lib/utils'
import { ScrollArea } from '@/shared/ui/scroll-area'

import type { SidebarConversation } from '../../lib/types'

export type { SidebarConversation }

export function Sidebar({
  conversations,
}: {
  conversations: SidebarConversation[]
}) {
  const pathname = usePathname()

  return (
    <aside className="border-border bg-sidebar text-sidebar-foreground flex w-64 shrink-0 flex-col border-r">
      <div className="border-sidebar-border border-b px-3 py-3">
        <Link
          href="/"
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground block rounded-md px-2 py-1.5 text-sm font-medium"
        >
          New chat
        </Link>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <nav className="flex flex-col gap-0.5 p-2">
          {conversations.map(c => {
            const href = `/chat/${c.id}`
            const active = pathname === href
            return (
              <Link
                key={c.id}
                href={href}
                className={cn(
                  'truncate rounded-md px-2 py-2 text-left text-sm transition-colors',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground/90 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground',
                )}
                title={c.title}
              >
                {c.title}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>
    </aside>
  )
}
