"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ConceptMap } from "@/components/ConceptMap";
import { Stepper } from "@/components/Stepper";
import { ChatBubble, TypingIndicator } from "@/components/ChatBubble";
import { DefinitionCard } from "@/components/DefinitionCard";
import { UnlockModal } from "@/components/UnlockModal";
import { conceptName } from "@/lib/concepts";
import { getStoredUuid } from "@/lib/uuid-storage";
import {
  SCENARIOS,
  CLOSING_SCENARIO,
  REVEAL_TEXT,
  beat2SystemPrompt,
  beat4SystemPrompt,
} from "@/lib/lessons/incentives";
import type { ConceptId, Learner, Message } from "@/lib/types";

export default function LessonPage() {
  const router = useRouter();
  const params = useParams();
  const concept = params.concept as ConceptId;

  const [learner, setLearner] = useState<Learner | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [beat, setBeat] = useState(1);
  const [scenarioVariant, setScenarioVariant] = useState<"A" | "B">("A");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [loadingLearner, setLoadingLearner] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUserMessage = useRef<string>("");

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
        if (lesson) {
          setBeat(lesson.beat);
          setScenarioVariant(lesson.scenarioVariant);
          if (lesson.conversation.length === 0 && lesson.beat === 1 && concept === "incentives") {
            setConversation([
              { role: "assistant", content: SCENARIOS[lesson.scenarioVariant] },
            ]);
          } else {
            setConversation(lesson.conversation);
          }
        }
      })
      .catch(() => router.push("/"))
      .finally(() => setLoadingLearner(false));
  }, [router, concept]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, loading]);

  const beat3Timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function enterBeat3(history: Message[]) {
    const withReveal = [...history, { role: "assistant" as const, content: REVEAL_TEXT }];
    setConversation(withReveal);
    setBeat(3);
    persist(withReveal, 3);
    if (beat3Timer.current) clearTimeout(beat3Timer.current);
    beat3Timer.current = setTimeout(() => advanceToBeat4(withReveal), 3000);
  }

  function advanceToBeat4(history: Message[]) {
    if (beat3Timer.current) clearTimeout(beat3Timer.current);
    const next = [...history, { role: "assistant" as const, content: CLOSING_SCENARIO }];
    setConversation(next);
    setBeat(4);
    persist(next, 4);
  }

  useEffect(() => {
    return () => {
      if (beat3Timer.current) clearTimeout(beat3Timer.current);
    };
  }, []);

  async function persist(newConversation: Message[], newBeat: number) {
    const uuid = getStoredUuid();
    if (!uuid) return;
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uuid,
          patch: {
            lessons: {
              [concept]: { beat: newBeat, scenarioVariant, conversation: newConversation },
            },
          },
        }),
      });
    } catch {
      // silent retry once
      setTimeout(() => {
        fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uuid,
            patch: {
              lessons: {
                [concept]: { beat: newBeat, scenarioVariant, conversation: newConversation },
              },
            },
          }),
        }).catch(() => {});
      }, 1000);
    }
  }

  async function unlockConcepts() {
    const uuid = getStoredUuid();
    if (!uuid || !learner) return;
    const patch = {
      concepts: {
        incentives: "complete" as const,
        resource_allocation: "in_progress" as const,
        supply_demand: "in_progress" as const,
      },
    };
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

  function callApi(messages: Message[], systemPrompt: string): Promise<{ content?: string; error?: string }> {
    setLoading(true);
    setError(null);
    slowTimer.current = setTimeout(() => setSlow(true), 8000);

    return fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, systemPrompt }),
    })
      .then((res) => res.json())
      .catch(() => ({ error: "network_failed" }))
      .finally(() => {
        setLoading(false);
        setSlow(false);
        if (slowTimer.current) clearTimeout(slowTimer.current);
      });
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading || !learner) return;
    setInput("");
    lastUserMessage.current = text;

    const withUser: Message[] = [...conversation, { role: "user", content: text }];
    setConversation(withUser);

    if (beat === 1) {
      setBeat(2);
      persist(withUser, 2);
      await runBeat2(withUser, text);
      return;
    }

    if (beat === 2) {
      persist(withUser, 2);
      await runBeat2(withUser, text);
      return;
    }

    if (beat === 4) {
      persist(withUser, 4);
      await runBeat4(withUser, text);
      return;
    }
  }

  async function runBeat2(history: Message[], learnerMessage: string) {
    const systemPrompt = beat2SystemPrompt(
      learner!.name,
      SCENARIOS[scenarioVariant],
      learnerMessage
    );
    const result = await callApi(history, systemPrompt);
    if (result.error || !result.content) {
      setError("Something went wrong — try sending that again.");
      return;
    }
    const advancing = result.content.includes("[ADVANCE]");
    const cleanText = result.content.replace("[ADVANCE]", "").trim();
    const next = [...history, { role: "assistant" as const, content: cleanText }];
    setConversation(next);

    if (advancing) {
      enterBeat3(next);
    } else {
      persist(next, 2);
    }
  }

  async function runBeat4(history: Message[], learnerMessage: string) {
    const systemPrompt = beat4SystemPrompt(learner!.name, learnerMessage);
    const result = await callApi(history, systemPrompt);
    if (result.error || !result.content) {
      setError("Something went wrong — try sending that again.");
      return;
    }

    const jsonMatch = result.content.match(/\{[^}]*"unlock"\s*:\s*true[^}]*\}/);
    if (jsonMatch) {
      const cleanText = result.content.replace(jsonMatch[0], "").trim();
      let feedback = "";
      try {
        feedback = JSON.parse(jsonMatch[0]).feedback ?? "";
      } catch {
        feedback = "";
      }
      const displayText = [cleanText, feedback].filter(Boolean).join("\n\n");
      const next = [...history, { role: "assistant" as const, content: displayText }];
      setConversation(next);
      persist(next, 4);
      setTimeout(() => {
        unlockConcepts();
        setShowUnlockModal(true);
      }, 1500);
    } else {
      const next = [...history, { role: "assistant" as const, content: result.content }];
      setConversation(next);
      persist(next, 4);
    }
  }

  function retry() {
    setError(null);
    const text = lastUserMessage.current;
    if (beat === 2) runBeat2(conversation, text);
    if (beat === 4) runBeat4(conversation, text);
  }

  if (loadingLearner || !learner) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </main>
    );
  }

  if (concept !== "incentives") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-medium text-foreground">
          {conceptName(concept)} isn&apos;t built yet in this prototype.
        </p>
        <button
          type="button"
          onClick={() => router.push("/learn")}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Back to dashboard
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-4 lg:flex-row">
      {/* Concept map: top strip on mobile, sidebar on desktop */}
      <aside className="lg:w-56 lg:shrink-0">
        <div className="rounded-2xl border border-border bg-card p-4 lg:sticky lg:top-4">
          <ConceptMap concepts={learner.concepts} activeId="incentives" compact />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="mb-3 rounded-2xl border border-border bg-card px-4 py-3">
            <Stepper current={beat} />
          </div>

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
              disabled={loading || beat === 3}
              placeholder={beat === 3 ? "Reading…" : "Type your answer…"}
              className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={loading || beat === 3 || !input.trim()}
              className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>

        {beat >= 3 && (
          <div className="lg:w-72 lg:shrink-0">
            <button
              type="button"
              onClick={() => {
                if (beat === 3) advanceToBeat4(conversation);
              }}
              className="block w-full text-left"
            >
              <DefinitionCard />
            </button>
          </div>
        )}
      </div>

      {showUnlockModal && (
        <UnlockModal
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
