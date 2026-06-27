import Link from "next/link";
import { CONCEPT_SPINE } from "@/lib/concepts";
import type { ConceptId, ConceptStatus } from "@/lib/types";

function StatusBadge({ status }: { status: ConceptStatus }) {
  if (status === "complete") {
    return <span className="text-success">✓</span>;
  }
  if (status === "in_progress") {
    return <span className="text-warm">→</span>;
  }
  return <span className="text-gray-400">🔒</span>;
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
  return (
    <div className={compact ? "flex flex-col gap-3" : "flex flex-col gap-6"}>
      {CONCEPT_SPINE.map((tier) => (
        <div key={tier.title}>
          {!compact && (
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
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
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${
                    isActive ? "bg-accent" : ""
                  } ${clickable ? "hover:bg-accent/60" : ""}`}
                >
                  <StatusBadge status={status} />
                  <div className="min-w-0">
                    <div
                      className={`truncate font-medium ${
                        status === "locked" ? "text-gray-400" : "text-foreground"
                      }`}
                    >
                      {c.name}
                    </div>
                    {!compact && (
                      <div className="truncate text-xs text-gray-500">{c.description}</div>
                    )}
                  </div>
                </div>
              );

              return clickable ? (
                <Link key={c.id} href={`/learn/${c.id}`}>
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
