const STEPS = ["Scenario", "Your reasoning", "The concept", "Prove it"];

export function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 px-1">
      {STEPS.map((label, idx) => {
        const stepNum = idx + 1;
        const done = stepNum < current;
        const active = stepNum === current;
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                done
                  ? "bg-success text-white"
                  : active
                  ? "bg-primary text-white"
                  : "bg-border text-gray-500"
              }`}
            >
              {done ? "✓" : stepNum}
            </div>
            <span
              className={`hidden text-xs font-medium sm:inline ${
                active ? "text-foreground" : "text-gray-400"
              }`}
            >
              {label}
            </span>
            {idx < STEPS.length - 1 && (
              <div className={`h-px flex-1 ${done ? "bg-success" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
