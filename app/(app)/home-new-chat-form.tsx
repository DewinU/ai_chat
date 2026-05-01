"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/shared/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/ui/field"
import { Textarea } from "@/shared/ui/textarea"

const schema = z.object({
  prompt: z.string().min(1, "Enter a message").max(32000),
})

type FormValues = z.infer<typeof schema>

export function HomeNewChatForm() {
  const router = useRouter()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { prompt: "" },
  })

  async function onSubmit(values: FormValues) {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: values.prompt }),
      })
      const data = (await res.json()) as { conversationId?: string; error?: unknown }
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Could not start chat")
        return
      }
      if (!data.conversationId) {
        toast.error("Invalid response from server")
        return
      }
      form.reset()
      router.push(`/chat/${data.conversationId}`)
      router.refresh()
    } catch {
      toast.error("Network error")
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full max-w-2xl flex-col gap-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="prompt">Message</FieldLabel>
          <Textarea
            id="prompt"
            rows={4}
            placeholder="Ask anything…"
            disabled={form.formState.isSubmitting}
            aria-invalid={!!form.formState.errors.prompt}
            {...form.register("prompt")}
          />
          {form.formState.errors.prompt?.message ? (
            <FieldError>{form.formState.errors.prompt.message}</FieldError>
          ) : null}
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={form.formState.isSubmitting} className="self-start">
        {form.formState.isSubmitting ? "Starting…" : "Send"}
      </Button>
    </form>
  )
}
