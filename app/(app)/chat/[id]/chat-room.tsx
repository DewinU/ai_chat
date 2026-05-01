'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useChatStore } from '@/store/chat-store'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { Skeleton } from '@/shared/ui/skeleton'
import { Textarea } from '@/shared/ui/textarea'

import type { ChatInitialPayload } from '../../../../lib/types'

export type { ChatMessageDTO } from '../../../../lib/types'

const replySchema = z.object({
  prompt: z.string().min(1, 'Enter a message').max(32000),
})

type ReplyForm = z.infer<typeof replySchema>

function AssistantReplySkeletonBody() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  )
}

export function ChatRoom({
  conversationPromise,
}: {
  conversationPromise: Promise<ChatInitialPayload>
}) {
  const payload = use(conversationPromise)
  const {
    conversationId,
    title,
    initialMessages,
    initialStreamingAssistantId,
  } = payload

  const router = useRouter()
  const [streamMessageId, setStreamMessageId] = useState<string | null>(
    initialStreamingAssistantId,
  )
  const setStreamingContent = useChatStore(s => s.setStreamingContent)
  const appendStreamingToken = useChatStore(s => s.appendStreamingToken)
  const clearStreamingContent = useChatStore(s => s.clearStreamingContent)

  useEffect(() => {
    if (!streamMessageId) return
    const url = `/api/stream?conversationId=${encodeURIComponent(conversationId)}&messageId=${encodeURIComponent(streamMessageId)}`
    const es = new EventSource(url)

    const onSync = (ev: MessageEvent) => {
      try {
        const { text } = JSON.parse(ev.data) as { text?: string }
        setStreamingContent(streamMessageId, text ?? '')
      } catch {
        /* ignore */
      }
    }
    const onToken = (ev: MessageEvent) => {
      try {
        const { text } = JSON.parse(ev.data) as { text?: string }
        if (text) appendStreamingToken(streamMessageId, text)
      } catch {
        /* ignore */
      }
    }
    const finish = () => {
      es.close()
      clearStreamingContent(streamMessageId)
      setStreamMessageId(null)
      router.refresh()
    }
    const onDone = () => finish()
    const onErr = () => {
      es.close()
      toast.error('Stream interrupted')
      router.refresh()
    }

    es.addEventListener('sync', onSync as EventListener)
    es.addEventListener('token', onToken as EventListener)
    es.addEventListener('done', onDone)
    es.addEventListener('error', onErr)

    return () => {
      es.removeEventListener('sync', onSync as EventListener)
      es.removeEventListener('token', onToken as EventListener)
      es.removeEventListener('done', onDone)
      es.removeEventListener('error', onErr)
      es.close()
    }
  }, [
    streamMessageId,
    conversationId,
    router,
    setStreamingContent,
    appendStreamingToken,
    clearStreamingContent,
  ])

  const streamingContent = useChatStore(s => s.streamingContent)

  const pendingStreamNotInList =
    !!streamMessageId && !initialMessages.some(m => m.id === streamMessageId)

  const form = useForm<ReplyForm>({
    resolver: zodResolver(replySchema),
    defaultValues: { prompt: '' },
  })

  async function onReply(values: ReplyForm) {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: values.prompt, conversationId }),
      })
      const data = (await res.json()) as {
        assistantMessageId?: string
        error?: string
      }
      if (!res.ok) {
        toast.error(data.error ?? 'Could not send message')
        return
      }
      if (data.assistantMessageId) {
        setStreamMessageId(data.assistantMessageId)
      }
      form.reset()
      router.refresh()
    } catch {
      toast.error('Network error')
    }
  }

  return (
    <div
      key={`${conversationId}:${initialStreamingAssistantId ?? 'idle'}`}
      className="flex min-h-0 flex-1 flex-col"
    >
      <header className="border-border border-b px-6 py-4">
        <h1 className="truncate text-lg font-semibold">{title}</h1>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-3 p-6">
          {initialMessages.map(m => {
            const live =
              m.role === 'assistant' && m.id === streamMessageId
                ? (streamingContent[m.id] ?? m.content)
                : m.content
            const showStreamSkeleton =
              m.role === 'assistant' &&
              m.id === streamMessageId &&
              !(live ?? '').trim()
            return (
              <Card
                key={m.id}
                className={
                  m.role === 'user'
                    ? 'border-primary/20 ml-8'
                    : 'border-muted mr-8'
                }
              >
                <CardHeader className="py-3 pb-0">
                  <CardTitle className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {m.role === 'user' ? 'You' : 'Assistant'}
                    {m.role === 'assistant' && m.status === 'streaming'
                      ? ' · streaming'
                      : null}
                    {m.role === 'assistant' && m.status === 'failed'
                      ? ' · failed'
                      : null}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2 pb-4">
                  {showStreamSkeleton ? (
                    <AssistantReplySkeletonBody />
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {live || '…'}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
          {pendingStreamNotInList ? (
            <Card
              className="border-muted mr-8"
              key={`pending-${streamMessageId}`}
            >
              <CardHeader className="py-3 pb-0">
                <CardTitle className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Assistant · streaming
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 pb-4">
                <AssistantReplySkeletonBody />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </ScrollArea>
      <div className="border-border border-t p-4">
        <form
          onSubmit={form.handleSubmit(onReply)}
          className="mx-auto flex max-w-3xl flex-col gap-3"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="reply">Reply</FieldLabel>
              <Textarea
                id="reply"
                rows={3}
                placeholder="Message this conversation…"
                disabled={form.formState.isSubmitting || !!streamMessageId}
                aria-invalid={!!form.formState.errors.prompt}
                {...form.register('prompt')}
              />
              {form.formState.errors.prompt?.message ? (
                <FieldError>{form.formState.errors.prompt.message}</FieldError>
              ) : null}
            </Field>
          </FieldGroup>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || !!streamMessageId}
            className="self-end"
          >
            {streamMessageId
              ? 'Wait for reply…'
              : form.formState.isSubmitting
                ? 'Sending…'
                : 'Send'}
          </Button>
        </form>
      </div>
    </div>
  )
}
