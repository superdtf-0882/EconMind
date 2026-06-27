const DEFINITIONS: Record<string, { term: string; body: string; quote: string }> = {
  incentives: {
    term: "Incentive",
    body: "Anything that makes a behavior more or less likely — a reward, a penalty, or what others expect.",
    quote: "People respond to what they're rewarded for.",
  },
  price_signals: {
    term: "Price signal",
    body: "A price that carries information — telling buyers what to buy and sellers what to make, with no one coordinating it.",
    quote: "The same number tells buyers and sellers two different things.",
  },
};

export function DefinitionCard({ concept }: { concept: string }) {
  const def = DEFINITIONS[concept] ?? DEFINITIONS["incentives"];
  return (
    <div className="animate-fade-in rounded-2xl border border-border bg-accent p-6">
      <div className="mb-2 flex items-center gap-2 text-base font-semibold text-foreground">
        📌 {def.term}
      </div>
      <p className="mb-3 text-sm leading-relaxed text-foreground">{def.body}</p>
      <p className="text-sm italic leading-relaxed text-gray-600">&ldquo;{def.quote}&rdquo;</p>
    </div>
  );
}
