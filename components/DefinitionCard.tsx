export function DefinitionCard() {
  return (
    <div className="animate-fade-in rounded-2xl border border-border bg-accent p-6">
      <div className="mb-2 flex items-center gap-2 text-base font-semibold text-foreground">
        📌 Incentive
      </div>
      <p className="mb-3 text-sm leading-relaxed text-foreground">
        Anything that makes a behavior more or less likely — a reward, a penalty, or what others
        expect.
      </p>
      <p className="text-sm italic leading-relaxed text-gray-600">
        &ldquo;People respond to what they&apos;re rewarded for.&rdquo;
      </p>
    </div>
  );
}
