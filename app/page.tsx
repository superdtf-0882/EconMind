"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { seedLearner } from "@/lib/seed";
import { setStoredUuid } from "@/lib/uuid-storage";

const INTERESTS = ["Sports", "Music", "Gaming", "Art", "Food", "Science", "None of the above"];

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function toggleInterest(interest: string) {
    setSelected((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  }

  async function handleSubmit() {
    if (!name.trim() || submitting) return;
    setSubmitting(true);

    const uuid = uuidv4();
    const context = selected
      .filter((i) => i !== "None of the above")
      .map((i) => i.toLowerCase());
    const learner = seedLearner(uuid, name.trim(), context);

    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid, learner }),
      });
    } catch (err) {
      console.error("Failed to create learner record:", err);
    }

    setStoredUuid(uuid);
    router.push("/learn/incentives");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-base font-semibold text-white">
            E
          </span>
          <span className="text-lg font-semibold text-foreground">EconMind</span>
        </div>

        <h1 className="mb-1 text-2xl font-semibold leading-tight text-foreground">
          What&apos;s your name?
        </h1>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Type your name"
          className="mb-6 w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />

        <h2 className="mb-3 text-base font-medium text-foreground">
          What are you into? Pick any that apply.
        </h2>
        <div className="mb-8 flex flex-wrap gap-2">
          {INTERESTS.map((interest) => {
            const active = selected.includes(interest);
            return (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white text-foreground hover:border-primary/40"
                }`}
              >
                {interest}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!name.trim() || submitting}
          className="w-full rounded-xl bg-primary px-4 py-3 text-base font-semibold text-white transition-opacity disabled:opacity-40"
        >
          {submitting ? "Setting things up…" : "Let's go"}
        </button>
      </div>
    </main>
  );
}
