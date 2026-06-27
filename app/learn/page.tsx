"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConceptMap } from "@/components/ConceptMap";
import { ALL_CONCEPT_IDS } from "@/lib/concepts";
import { getStoredUuid } from "@/lib/uuid-storage";
import type { Learner } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [learner, setLearner] = useState<Learner | null>(null);
  const [loading, setLoading] = useState(true);

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
      .then((data: Learner) => setLearner(data))
      .catch(() => router.push("/"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading || !learner) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </main>
    );
  }

  const completedCount = ALL_CONCEPT_IDS.filter(
    (id) => learner.concepts[id] === "complete"
  ).length;

  return (
    <main className="mx-auto flex w-full max-w-[680px] flex-1 flex-col px-4 py-8">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-base font-semibold text-white">
          E
        </span>
        <span className="text-lg font-semibold text-foreground">EconMind</span>
      </div>

      <h1 className="mb-1 text-2xl font-semibold text-foreground">
        Hey {learner.name} — ready to keep going?
      </h1>

      <div className="mb-2 mt-4 flex items-center justify-between text-sm text-gray-500">
        <span>
          {completedCount} of {ALL_CONCEPT_IDS.length} concepts
        </span>
      </div>
      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-success transition-all"
          style={{ width: `${(completedCount / ALL_CONCEPT_IDS.length) * 100}%` }}
        />
      </div>

      <button
        type="button"
        onClick={() => router.push("/learn/chat")}
        className="mb-8 w-full rounded-xl bg-primary px-4 py-3 text-base font-semibold text-white"
      >
        Continue
      </button>

      <div className="rounded-2xl border border-border bg-card p-6">
        <ConceptMap concepts={learner.concepts} />
      </div>

      <p className="mt-8 text-center text-xs text-gray-400">
        EconMind · Grade 7 Economics · Prototype
      </p>
    </main>
  );
}
