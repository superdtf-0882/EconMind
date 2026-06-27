import type { Message } from "@/lib/types";

export function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex animate-fade-in gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
          E
        </span>
      )}
      <div
        className={`max-w-[min(80%,640px)] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-accent text-foreground"
            : "border border-border bg-card text-foreground"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex animate-fade-in gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
        E
      </span>
      <div className="flex items-center gap-1 rounded-2xl border border-border bg-card px-4 py-3">
        <span className="h-1.5 w-1.5 animate-typing-dot rounded-full bg-gray-400" style={{ animationDelay: "0ms" }} />
        <span className="h-1.5 w-1.5 animate-typing-dot rounded-full bg-gray-400" style={{ animationDelay: "150ms" }} />
        <span className="h-1.5 w-1.5 animate-typing-dot rounded-full bg-gray-400" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
