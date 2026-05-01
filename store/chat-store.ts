import { create } from 'zustand'

type State = {
  /** Live assistant text while SSE is active, keyed by message id */
  streamingContent: Record<string, string>
  setStreamingContent: (messageId: string, text: string) => void
  appendStreamingToken: (messageId: string, token: string) => void
  clearStreamingContent: (messageId: string) => void
}

export const useChatStore = create<State>(set => ({
  streamingContent: {},
  setStreamingContent: (messageId, text) =>
    set(s => ({
      streamingContent: { ...s.streamingContent, [messageId]: text },
    })),
  appendStreamingToken: (messageId, token) =>
    set(s => ({
      streamingContent: {
        ...s.streamingContent,
        [messageId]: (s.streamingContent[messageId] ?? '') + token,
      },
    })),
  clearStreamingContent: messageId =>
    set(s => {
      const next = { ...s.streamingContent }
      delete next[messageId]
      return { streamingContent: next }
    }),
}))
