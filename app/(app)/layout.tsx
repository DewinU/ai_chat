import prisma from "@/lib/prisma"

import { Sidebar, type SidebarConversation } from "./sidebar"

export const dynamic = "force-dynamic"

export default async function AppShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const rows = await prisma.conversation.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, createdAt: true },
  })
  const conversations: SidebarConversation[] = rows.map((c) => ({
    id: c.id,
    title: c.title,
    createdAt: c.createdAt.toISOString(),
  }))

  return (
    <div className="flex min-h-0 flex-1">
      <Sidebar conversations={conversations} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
