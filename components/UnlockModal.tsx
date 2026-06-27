"use client";

import { conceptName, conceptDescription } from "@/lib/concepts";
import type { ConceptId } from "@/lib/types";

export function UnlockModal({
  concept,
  targets,
  summary,
  onSelect,
  onDashboard,
}: {
  concept: ConceptId;
  targets: ConceptId[];
  summary?: string;
  onSelect: (concept: ConceptId) => void;
  onDashboard: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="animate-fade-in w-full max-w-lg rounded-2xl bg-card p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="#059669"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-check-draw"
            />
          </svg>
        </div>
        <h2 className="mb-2 text-2xl font-semibold text-foreground">
          {conceptName(concept)} — unlocked ✓
        </h2>
        {summary ? (
          <p className="mb-6 text-sm leading-relaxed text-gray-600">{summary}</p>
        ) : (
          <p className="mb-6 text-sm leading-relaxed text-gray-600">
            You can now explain {conceptName(concept).toLowerCase()}.{" "}
            {targets.length > 0 ? "New topics are ready." : ""}
          </p>
        )}

        {targets.length > 0 && (
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {targets.map((t) => (
              <div key={t} className="rounded-xl border border-border p-4 text-left">
                <div className="mb-1 font-semibold text-foreground">{conceptName(t)}</div>
                <div className="mb-3 text-xs text-gray-500">{conceptDescription(t)}</div>
                <button
                  type="button"
                  onClick={() => onSelect(t)}
                  className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white"
                >
                  Start this one
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onDashboard}
          className="text-xs text-gray-400 underline hover:text-gray-600"
        >
          Or go back to your dashboard
        </button>
      </div>
    </div>
  );
}
