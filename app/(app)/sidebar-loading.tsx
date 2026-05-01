import { Skeleton } from '@/shared/ui/skeleton'

export function SidebarLoading() {
  return (
    <aside className="border-border bg-sidebar text-sidebar-foreground flex w-64 shrink-0 flex-col border-r">
      <div className="border-sidebar-border border-b px-3 py-3">
        <Skeleton className="h-8 w-full rounded-md" />
      </div>
      <div className="flex flex-col gap-2 p-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-md" />
        ))}
      </div>
    </aside>
  )
}
