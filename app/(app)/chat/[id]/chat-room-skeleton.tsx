import { Card, CardContent, CardHeader } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'

export function ChatRoomSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-border border-b px-6 py-4">
        <Skeleton className="h-6 w-2/3 max-w-md" />
      </header>
      <div className="min-h-0 flex-1 space-y-3 overflow-hidden p-6">
        <Card className="border-primary/20 ml-8">
          <CardHeader className="py-3 pb-0">
            <Skeleton className="h-3 w-12" />
          </CardHeader>
          <CardContent className="space-y-2 pt-2 pb-4">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </CardContent>
        </Card>
        <Card className="border-muted mr-8">
          <CardHeader className="py-3 pb-0">
            <Skeleton className="h-3 w-20" />
          </CardHeader>
          <CardContent className="space-y-2 pt-2 pb-4">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </CardContent>
        </Card>
        <Card className="border-primary/20 ml-8">
          <CardHeader className="py-3 pb-0">
            <Skeleton className="h-3 w-12" />
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>
      <div className="border-border border-t p-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="min-h-[4.5rem] w-full rounded-lg" />
          <Skeleton className="h-8 w-24 self-end rounded-lg" />
        </div>
      </div>
    </div>
  )
}
