"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ConceptMap } from "@/components/ConceptMap";
import { ChatBubble, TypingIndicator } from "@/components/ChatBubble";
import { TrailSidebar } from "@/components/TrailMarker";
import { getStoredUuid } from "@/lib/uuid-storage";
import type { ConceptId, ConceptStatus, Learner, Message, TrailMarker } from "@/lib/types";

export default function ChatPage() {
  const router = useRouter();

  const [learner, setLearner] = useState<Learner | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [trailMarkers, setTrailMarkers] = useState<TrailMarker[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingLearner, setLoadingLearner] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const uuid = getStoredUuid();
    if (!uuid) {
      router.push("/");
      return;
    }
    fetch(`/api/progress?uuid=${uuid}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data: Learner) => {
        setLearner(data);
        setTrailMarkers(data.trailMarkers ?? []);
        if ((data.conversation ?? []).length === 0) {
          return kickoffOpening(data);
        }
        setConversation(data.conversation);
      })
      .catch(() => router.push("/"))
      .finally(() => setLoadingLearner(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, loading]);

  async function persist(newConversation: Message[], newTrailMarkers: TrailMarker[]) {
    const uuid = getStoredUuid();
    if (!uuid) return;
    const body = JSON.stringify({
      uuid,
      patch: { conversation: newConversation, trailMarkers: newTrailMarkers },
    });
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
    } catch {
      setTimeout(() => {
        fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        }).catch(() => {});
      }, 1000);
    }
  }

  async function applyDemonstratedConcepts(slugs: string[]) {
    if (slugs.length === 0 || !learner) return;
    const uuid = getStoredUuid();
    if (!uuid) return;

    const concepts: Partial<Record<ConceptId, ConceptStatus>> = {};
    slugs.forEach((slug) => {
      const id = slug as ConceptId;
      if (learner.concepts[id] && learner.concepts[id] !== "complete") {
        concepts[id] = "complete";
      }
    });
    if (Object.keys(concepts).length === 0) return;

    setLearner({ ...learner, concepts: { ...learner.concepts, ...concepts } });
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid, patch: { concepts } }),
      });
      const updated = await res.json();
      setLearner(updated);
    } catch {
      // ignore for prototype
    }
  }

  async function kickoffOpening(data: Learner) {
    setLoading(true);
    setError(null);
    slowTimer.current = setTimeout(() => setSlow(true), 8000);

    let result: { text?: string; thread?: string; error?: string };
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Hi" }],
          learnerName: data.name,
          learnerContext: data.context,
        }),
      });
      result = await res.json();
    } catch {
      result = { error: "network_failed" };
    }

    setLoading(false);
    setSlow(false);
    if (slowTimer.current) clearTimeout(slowTimer.current);

    if (result.error || !result.text) {
      setError("Something went wrong — try sending that again.");
      return;
    }

    const seeded: Message[] = [{ role: "assistant", content: result.text }];
    setConversation(seeded);
    persist(seeded, []);
  }

  async function sendTurn(history: Message[], markers: TrailMarker[]) {
    setLoading(true);
    setError(null);
    slowTimer.current = setTimeout(() => setSlow(true), 8000);

    let result: { text?: string; thread?: string; demonstratedConcepts?: string[]; error?: string };
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          learnerName: learner!.name,
          learnerContext: learner!.context,
        }),
      });
      result = await res.json();
    } catch {
      result = { error: "network_failed" };
    }

    setLoading(false);
    setSlow(false);
    if (slowTimer.current) clearTimeout(slowTimer.current);

    if (result.error || !result.text) {
      setError("Something went wrong — try sending that again.");
      return;
    }

    const next = [...history, { role: "assistant" as const, content: result.text }];
    setConversation(next);

    let nextMarkers = markers;
    if (result.thread && result.thread !== "main") {
      const marker: TrailMarker = {
        thread: result.thread as TrailMarker["thread"],
        exchangeIndex: history.length,
        preview: result.text.slice(0, 60) + "...",
      };
      nextMarkers = [...markers, marker];
      setTrailMarkers(nextMarkers);
    }

    persist(next, nextMarkers);
    if (result.demonstratedConcepts && result.demonstratedConcepts.length > 0) {
      applyDemonstratedConcepts(result.demonstratedConcepts);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading || !learner) return;
    setInput("");

    const next = [...conversation, { role: "user" as const, content: text }];
    setConversation(next);
    persist(next, trailMarkers);
    await sendTurn(next, trailMarkers);
  }

  function retry() {
    setError(null);
    if (conversation.length === 0 && learner) {
      kickoffOpening(learner);
    } else {
      sendTurn(conversation, trailMarkers);
    }
  }

  if (loadingLearner || !learner) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 px-4 py-4 lg:flex-row">
      <aside className="lg:w-56 lg:shrink-0">
        <div className="rounded-2xl border border-border bg-card p-4 lg:sticky lg:top-4">
          <ConceptMap concepts={learner.concepts} compact />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-2xl border border-border bg-background p-4">
            {conversation.map((m, i) => (
              <ChatBubble key={i} message={m} />
            ))}
            {loading && <TypingIndicator />}
            {slow && (
              <p className="text-center text-xs text-gray-400">Thinking a little longer… hang on.</p>
            )}
            {error && (
              <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
                <span>{error}</span>
                <button type="button" onClick={retry} className="font-semibold underline">
                  Retry
                </button>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              disabled={loading}
              placeholder="Type your answer…"
              className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:w-72 lg:shrink-0">
          <TrailSidebar markers={trailMarkers} />
        </div>
      </div>
    </main>
  );
}
