import Link from "next/link";
import { CONCEPT_SPINE } from "@/lib/concepts";
import type { ConceptId, ConceptStatus } from "@/lib/types";

function StatusBadge({ status, panelComplete }: { status: ConceptStatus; panelComplete: boolean }) {
  if (status === "complete") {
    return <span className={panelComplete ? "text-white" : "text-success"}>✓</span>;
  }
  if (status === "in_progress") {
    return <span className={panelComplete ? "text-white" : "text-warm"}>→</span>;
  }
  return <span className={panelComplete ? "text-white/60" : "text-gray-400"}>🔒</span>;
}

export function ConceptMap({
  concepts,
  activeId,
  compact = false,
}: {
  concepts: Record<ConceptId, ConceptStatus>;
  activeId?: ConceptId;
  compact?: boolean;
}) {
  const allComplete = Object.values(concepts).every((status) => status === "complete");

  return (
    <div
      className={`${compact ? "flex flex-col gap-3" : "flex flex-col gap-6"} rounded-2xl transition-colors duration-700 ${
        allComplete ? "bg-success p-4 -m-4" : ""
      }`}
    >
      {CONCEPT_SPINE.map((tier) => (
        <div key={tier.title}>
          {!compact && (
            <div
              className={`mb-2 text-xs font-semibold uppercase tracking-wide ${
                allComplete ? "text-white/70" : "text-gray-400"
              }`}
            >
              {tier.title}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            {tier.concepts.map((c) => {
              const status = concepts[c.id];
              const isActive = c.id === activeId;
              const clickable = status !== "locked";

              const row = (
                <div
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors duration-700 ${
                    isActive && !allComplete ? "bg-accent" : ""
                  } ${clickable && !allComplete ? "hover:bg-accent/60" : ""} ${
                    allComplete ? "bg-white/15 border border-white/30" : ""
                  }`}
                >
                  <StatusBadge status={status} panelComplete={allComplete} />
                  <div className="min-w-0">
                    <div
                      className={`truncate font-medium ${
                        allComplete
                          ? "text-white"
                          : status === "locked"
                          ? "text-gray-400"
                          : "text-foreground"
                      }`}
                    >
                      {c.name}
                    </div>
                    {!compact && (
                      <div
                        className={`truncate text-xs ${
                          allComplete ? "text-white/70" : "text-gray-500"
                        }`}
                      >
                        {c.description}
                      </div>
                    )}
                  </div>
                </div>
              );

              return clickable ? (
                <Link key={c.id} href="/learn/chat">
                  {row}
                </Link>
              ) : (
                <div key={c.id}>{row}</div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
