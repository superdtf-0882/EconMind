import type { TrailMarker as TrailMarkerType } from "@/lib/types";

const TRAIL_CONFIG: Record<
  TrailMarkerType["thread"],
  { label: string; color: string; bg: string }
> = {
  fairness: { label: "Fairness question", color: "#7C3AED", bg: "#EDE9FE" },
  "fix-it": { label: "Redesigning it", color: "#0369A1", bg: "#E0F2FE" },
  connection: { label: "Real-world connection", color: "#065F46", bg: "#D1FAE5" },
  philosophy: { label: "Big question", color: "#92400E", bg: "#FEF3C7" },
  "jump-ahead": { label: "Thinking ahead", color: "#9D174D", bg: "#FCE7F3" },
};

function TrailMarker({ marker }: { marker: TrailMarkerType }) {
  const config = TRAIL_CONFIG[marker.thread];
  return (
    <div
      className="animate-fade-in"
      style={{
        borderLeft: `3px solid ${config.color}`,
        paddingLeft: "10px",
        marginBottom: "12px",
      }}
    >
      <div
        style={{
          display: "inline-block",
          background: config.bg,
          color: config.color,
          fontSize: "11px",
          fontWeight: 500,
          padding: "2px 8px",
          borderRadius: "99px",
          marginBottom: "3px",
        }}
      >
        {config.label}
      </div>
      <div style={{ fontSize: "12px", color: "#6B7280", lineHeight: 1.4 }}>
        {marker.preview}
      </div>
    </div>
  );
}

export function TrailSidebar({ markers }: { markers: TrailMarkerType[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div
        style={{
          fontSize: "11px",
          color: "#9CA3AF",
          marginBottom: "12px",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        Your trail
      </div>
      {markers.length === 0 && (
        <div style={{ fontSize: "12px", color: "#D1D5DB", fontStyle: "italic" }}>
          Detours you take will appear here.
        </div>
      )}
      {markers.map((m, i) => (
        <TrailMarker key={i} marker={m} />
      ))}
    </div>
  );
}
