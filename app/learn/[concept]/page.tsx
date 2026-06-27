"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ConceptMap } from "@/components/ConceptMap";
import { ChatBubble, TypingIndicator } from "@/components/ChatBubble";
import { DefinitionCard } from "@/components/DefinitionCard";
import { TrailSidebar } from "@/components/TrailMarker";
import { UnlockModal } from "@/components/UnlockModal";
import { getStoredUuid } from "@/lib/uuid-storage";
import { SCENARIOS } from "@/lib/lessons/incentives";
import type { ConceptId, ConceptStatus, Learner, Message, TrailMarker } from "@/lib/types";

const OPENING_SCENARIOS: Record<string, string> = {
  price_signals:
    "Think about something you buy pretty regularly — could be songs, snacks, a game, whatever. Now imagine the price doubles overnight. What do you do?",
};

const UNLOCK_TARGETS: Record<string, ConceptId[]> = {
  incentives: ["price_signals"],
  price_signals: ["resource_allocation", "supply_demand"],
};

export default function LessonPage() {
  const router = useRouter();
  const params = useParams();
  const concept = params.concept as ConceptId;

  const [learner, setLearner] = useState<Learner | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [trailMarkers, setTrailMarkers] = useState<TrailMarker[]>([]);
  const [beat, setBeat] = useState(1);
  const [scenarioVariant, setScenarioVariant] = useState<"A" | "B">("A");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockSummary, setUnlockSummary] = useState<string | undefined>(undefined);
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
        const lesson = data.lessons[concept];
        const currentBeat = lesson?.beat ?? 1;
        const currentVariant: "A" | "B" =
          lesson?.scenarioVariant ?? (data.context.includes("sports") ? "B" : "A");
        setBeat(currentBeat);
        setScenarioVariant(currentVariant);
        setTrailMarkers(lesson?.trailMarkers ?? []);

        const existingConversation = lesson?.conversation ?? [];
        if (existingConversation.length === 0 && currentBeat === 1) {
          const opening = concept === "incentives" ? SCENARIOS[currentVariant] : OPENING_SCENARIOS[concept];
          setConversation(opening ? [{ role: "assistant", content: opening }] : []);
        } else {
          setConversation(existingConversation);
        }
      })
      .catch(() => router.push("/"))
      .finally(() => setLoadingLearner(false));
  }, [router, concept]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, loading]);

  async function persist(
    newConversation: Message[],
    newBeat: number,
    newTrailMarkers: TrailMarker[]
  ) {
    const uuid = getStoredUuid();
    if (!uuid) return;
    const body = JSON.stringify({
      uuid,
      patch: {
        lessons: {
          [concept]: {
            beat: newBeat,
            scenarioVariant,
            conversation: newConversation,
            trailMarkers: newTrailMarkers,
          },
        },
      },
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

  async function unlockConcepts(targets: ConceptId[]) {
    const uuid = getStoredUuid();
    if (!uuid) return;
    const concepts: Partial<Record<ConceptId, ConceptStatus>> = { [concept]: "complete" };
    targets.forEach((t) => {
      concepts[t] = "in_progress";
    });
    const patch = { concepts };
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid, patch }),
      });
      const updated = await res.json();
      setLearner(updated);
    } catch {
      // ignore for prototype
    }
  }

  async function sendTurn(history: Message[], markers: TrailMarker[]) {
    setLoading(true);
    setError(null);
    slowTimer.current = setTimeout(() => setSlow(true), 8000);

    let result: {
      text?: string;
      thread?: string;
      advance?: boolean;
      unlockSummary?: string | null;
      error?: string;
    };
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          learnerName: learner!.name,
          concept,
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

    if (result.advance) {
      setBeat(3);
      persist(next, 3, nextMarkers);
      setUnlockSummary(result.unlockSummary ?? undefined);
      await unlockConcepts(UNLOCK_TARGETS[concept] ?? []);
      setShowUnlockModal(true);
    } else {
      persist(next, 2, nextMarkers);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading || !learner || beat === 3) return;
    setInput("");

    const next = [...conversation, { role: "user" as const, content: text }];
    setConversation(next);
    const newBeat = beat === 1 ? 2 : beat;
    setBeat(newBeat);
    persist(next, newBeat, trailMarkers);
    await sendTurn(next, trailMarkers);
  }

  function retry() {
    setError(null);
    sendTurn(conversation, trailMarkers);
  }

  if (loadingLearner || !learner) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-4 lg:flex-row">
      <aside className="lg:w-56 lg:shrink-0">
        <div className="rounded-2xl border border-border bg-card p-4 lg:sticky lg:top-4">
          <ConceptMap concepts={learner.concepts} activeId={concept} compact />
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

          {beat === 3 ? (
            <p className="mt-3 text-center text-sm text-gray-500">
              You&apos;ve completed this lesson. Head back to your dashboard to keep going.
            </p>
          ) : (
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
          )}
        </div>

        <div className="flex flex-col gap-4 lg:w-72 lg:shrink-0">
          {beat === 3 && <DefinitionCard concept={concept} />}
          <TrailSidebar markers={trailMarkers} />
        </div>
      </div>

      {showUnlockModal && (
        <UnlockModal
          concept={concept}
          targets={UNLOCK_TARGETS[concept] ?? []}
          summary={unlockSummary}
          onSelect={(c) => {
            setShowUnlockModal(false);
            router.push(`/learn/${c}`);
          }}
          onDashboard={() => {
            setShowUnlockModal(false);
            router.push("/learn");
          }}
        />
      )}
    </main>
  );
}
