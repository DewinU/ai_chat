import { HomeNewChatForm } from "./home-new-chat-form"

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New chat</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your message starts a conversation. Replies stream durably and stay in sync across tabs.
        </p>
      </div>
      <HomeNewChatForm />
    </div>
  )
}
