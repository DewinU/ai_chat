import { ChatRoomSkeleton } from './chat/[id]/chat-room-skeleton'
import { SidebarLoading } from './sidebar-loading'

export function AppShellSkeleton() {
  return (
    <div className="flex min-h-0 flex-1">
      <SidebarLoading />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ChatRoomSkeleton />
      </div>
    </div>
  )
}
